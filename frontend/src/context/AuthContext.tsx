'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface UserData {
  id: number
  full_name: string
  email: string | null
  avatar: string | null
  username: string | null
  telegram_id: number | null
}

interface AuthCtx {
  user: UserData | null
  token: string | null
  loading: boolean
  loginWithGoogle: (credential: string) => Promise<void>
  loginWithTelegram: (data: Record<string, unknown>) => Promise<void>
  loginWithPhone: (phone: string, password: string) => Promise<void>
  register: (data: { first_name: string; last_name: string; phone: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('user_token')
    if (saved) {
      setToken(saved)
      fetch('/api/user-auth/me', {
        headers: { Authorization: `Bearer ${saved}` },
      })
        .then(r => {
          if (!r.ok) throw new Error()
          return r.json()
        })
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('user_token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch('/api/user-auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })
    if (!res.ok) throw new Error('Google login failed')
    const data = await res.json()
    localStorage.setItem('user_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const loginWithTelegram = useCallback(async (tgData: Record<string, unknown>) => {
    const res = await fetch('/api/user-auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tgData),
    })
    if (!res.ok) throw new Error('Telegram login failed')
    const data = await res.json()
    localStorage.setItem('user_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const loginWithPhone = useCallback(async (phone: string, password: string) => {
    const res = await fetch('/api/user-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Login failed')
    }
    const data = await res.json()
    localStorage.setItem('user_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (regData: { first_name: string; last_name: string; phone: string; password: string }) => {
    const res = await fetch('/api/user-auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || 'Registration failed')
    }
    const data = await res.json()
    localStorage.setItem('user_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('user_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, loginWithTelegram, loginWithPhone, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
