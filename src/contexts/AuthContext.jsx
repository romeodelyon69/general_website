import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AuthContext = createContext(null)

const BASE = '/api'

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [username,    setUsername]    = useState(null)
  const [isAdmin,     setIsAdmin]     = useState(false)
  const [status,      setStatus]      = useState('loading') // 'loading' | 'auth' | 'guest'
  const refreshTimerRef = useRef(null)

  // ── Schedule automatic access-token refresh (every 90 min) ─────────────
  function scheduleRefresh() {
    clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => silentRefresh(), 90 * 60 * 1000)
  }

  // ── Silent refresh (called on mount + timer) ────────────────────────────
  const silentRefresh = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE}/auth/refresh`, {
        method:      'POST',
        credentials: 'include',   // send httpOnly cookie
      })
      if (!res.ok) throw new Error('refresh failed')
      const { accessToken: token, username: user, isAdmin: admin } = await res.json()
      setAccessToken(token)
      setUsername(user)
      setIsAdmin(admin === true)
      setStatus('auth')
      scheduleRefresh()
    } catch {
      setAccessToken(null)
      setUsername(null)
      setStatus('guest')
    }
  }, [])

  // On mount: try to restore session via cookie
  useEffect(() => {
    silentRefresh()
    return () => clearTimeout(refreshTimerRef.current)
  }, [])

  // ── API helper (auto-adds Bearer token) ──────────────────────────────────
  const api = useCallback(async (path, opts = {}) => {
    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(opts.headers ?? {}),
      },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error ?? 'Erreur serveur')
    }
    return res.json()
  }, [accessToken])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (user, password) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ username: user, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Identifiants incorrects')
    }
    const { accessToken: token, username: uname, isAdmin: admin } = await res.json()
    setAccessToken(token)
    setUsername(uname)
    setIsAdmin(admin === true)
    setStatus('auth')
    scheduleRefresh()
    return token
  }, [])

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (user, password) => {
    const res = await fetch(`${BASE}/auth/register`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ username: user, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Erreur lors de l\'inscription')
    }
    const { accessToken: token, username: uname, isAdmin: admin } = await res.json()
    setAccessToken(token)
    setUsername(uname)
    setIsAdmin(admin === true)
    setStatus('auth')
    scheduleRefresh()
    return token
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    clearTimeout(refreshTimerRef.current)
    setAccessToken(null)
    setUsername(null)
    setIsAdmin(false)
    setStatus('guest')
  }, [])

  return (
    <AuthContext.Provider value={{ accessToken, username, isAdmin, status, login, register, logout, api }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
