import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

// Singleton presence socket shared across the app. Connection is gated on
// authentication state from AuthContext; one WebSocket is opened regardless
// of how many components consume usePresence.

const PresenceContext = createContext(null)

export function PresenceProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const [isConnected, setIsConnected] = useState(false)
  const [onlineFriendIds, setOnlineFriendIds] = useState(new Set())
  const [notifications, setNotifications] = useState([])

  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const pingIntervalRef = useRef(null)
  const retryCountRef = useRef(0)
  // Guards against stale reconnect timers firing after unmount/logout.
  const isActiveRef = useRef(true)
  // Holds the latest connect function so reconnect timers can safely reference
  // it without a temporal-dead-zone / stale-closure problem.
  const connectRef = useRef(null)

  const connect = useCallback(() => {
    if (!isAuthenticated) {
      setIsConnected(false)
      return
    }

    if (isActiveRef.current === false) return

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws/presence/`

    let socket
    try {
      socket = new WebSocket(wsUrl)
    } catch {
      setIsConnected(false)
      return
    }
    socketRef.current = socket

    socket.onopen = () => {
      if (!isActiveRef.current) return
      setIsConnected(true)
      retryCountRef.current = 0

      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)
    }

    socket.onmessage = (event) => {
      if (!isActiveRef.current) return
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'initial_presence' || data.type === 'online_friends_list') {
          setOnlineFriendIds(new Set(data.online_friend_ids || []))
        } else if (data.type === 'friend_presence') {
          setOnlineFriendIds((prev) => {
            const next = new Set(prev)
            if (data.status === 'online') {
              next.add(data.user_id)
            } else {
              next.delete(data.user_id)
            }
            return next
          })
        } else if (data.type === 'friend_request_notification') {
          setNotifications((prev) => [
            { ...data, id: Date.now() },
            ...prev.slice(0, 9),
          ])
        }
      } catch {
        // ignore malformed frames
      }
    }

    socket.onclose = (e) => {
      setIsConnected(false)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)

      // Reconnect with exponential backoff only while active and authenticated.
      if (isActiveRef.current && isAuthenticated && !e.wasClean) {
        const timeout = Math.min(1000 * 2 ** retryCountRef.current, 15000)
        retryCountRef.current += 1
        reconnectTimeoutRef.current = setTimeout(() => connectRef.current && connectRef.current(), timeout)
      }
    }

    socket.onerror = () => {
      socket.close()
    }
  }, [isAuthenticated])

  // Keep the latest connect callback available to the reconnect timer without
  // writing refs during render.
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  // Close socket cleanly on logout / unmount.
  const closeSocket = useCallback(() => {
    isActiveRef.current = false
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
    if (socketRef.current) {
      socketRef.current.close(1000, 'Session ended')
      socketRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Open/close based on auth state.
  useEffect(() => {
    if (isAuthenticated) {
      isActiveRef.current = true
      connect()
    } else {
      closeSocket()
    }
    return () => {
      closeSocket()
    }
  }, [isAuthenticated, connect, closeSocket])

  const isFriendOnline = useCallback(
    (userId) => onlineFriendIds.has(Number(userId)),
    [onlineFriendIds],
  )

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      isConnected,
      onlineFriendIds,
      isFriendOnline,
      notifications,
      clearNotification,
    }),
    [isConnected, onlineFriendIds, isFriendOnline, notifications, clearNotification],
  )

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}

// Context file intentionally exports both a provider component and a hook.
// eslint-disable-next-line react-refresh/only-export-components
export function usePresence() {
  const ctx = useContext(PresenceContext)
  if (!ctx) {
    throw new Error('usePresence deve ser usado dentro de PresenceProvider')
  }
  return ctx
}
