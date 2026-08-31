import { useState, useEffect, useRef, useCallback } from 'react'

export function usePresence() {
  const [isConnected, setIsConnected] = useState(false)
  const [onlineFriendIds, setOnlineFriendIds] = useState(new Set())
  const [notifications, setNotifications] = useState([])
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const pingIntervalRef = useRef(null)
  const retryCountRef = useRef(0)

  const connect = useCallback(() => {
    const token = sessionStorage.getItem('token')
    if (!token) {
      setIsConnected(false)
      return
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws/presence/?token=${token}`

    try {
      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onopen = () => {
        setIsConnected(true)
        retryCountRef.current = 0

        // Start ping heartbeat
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'initial_presence') {
            setOnlineFriendIds(new Set(data.online_friend_ids || []))
          } else if (data.type === 'online_friends_list') {
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
        } catch (err) {
          console.error('WebSocket parse error:', err)
        }
      }

      socket.onclose = (e) => {
        setIsConnected(false)
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)

        // Exponential backoff reconnect
        if (sessionStorage.getItem('token') && !e.wasClean) {
          const timeout = Math.min(1000 * 2 ** retryCountRef.current, 15000)
          retryCountRef.current += 1
          reconnectTimeoutRef.current = setTimeout(connect, timeout)
        }
      }

      socket.onerror = () => {
        socket.close()
      }
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounted')
      }
    }
  }, [connect])

  const isFriendOnline = useCallback(
    (userId) => onlineFriendIds.has(Number(userId)),
    [onlineFriendIds]
  )

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return {
    isConnected,
    onlineFriendIds,
    isFriendOnline,
    notifications,
    clearNotification,
  }
}
