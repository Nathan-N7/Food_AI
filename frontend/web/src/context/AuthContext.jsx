import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { fetchJson, setUnauthorizedHandler } from '../lib/api.js'

const AuthContext = createContext(null)

const API_URL = '/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Hydrate auth state from the session cookie on mount.
  useEffect(() => {
    let active = true
    async function bootstrap() {
      try {
        const me = await fetchJson(`${API_URL}/auth/me/`)
        if (active) setUser(me)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      active = false
    }
  }, [])

  const handleUnauthorized = useCallback(() => {
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized)
    return () => setUnauthorizedHandler(null)
  }, [handleUnauthorized])

  const login = useCallback(async (credentials) => {
    const data = await fetchJson(`${API_URL}/auth/login/`, {
      method: 'POST',
      body: credentials,
    })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetchJson(`${API_URL}/auth/logout/`, { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Context file intentionally exports both a provider component and a hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}
