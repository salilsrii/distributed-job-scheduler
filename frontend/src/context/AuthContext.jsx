import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

const TOKEN_KEY = 'access_token'
const USER_KEY  = 'user'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)

  // Listen for 401 events dispatched by the Axios interceptor
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((tokenVal, userVal) => {
    localStorage.setItem(TOKEN_KEY, tokenVal)
    localStorage.setItem(USER_KEY,  JSON.stringify(userVal))
    setToken(tokenVal)
    setUser(userVal)
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      // Backend may return { access_token, user } or { token, user }
      const tkn  = data.access_token ?? data.token
      const usr  = data.user ?? { email }
      persist(tkn, usr)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [persist])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout, persist }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}
