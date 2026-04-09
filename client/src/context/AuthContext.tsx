import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../api'

interface User {
  id: number
  name: string
  email: string
  type: 'member' | 'admin'
  status: 'active' | 'suspended'
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  isAdmin: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState]  = useState<User | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)   // true until first token check completes

  // On mount: verify stored token against server. This catches stale tokens
  // from previous sessions (e.g. after docker compose down -v wipes the DB).
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (!storedToken) {
      setLoading(false)
      return
    }

    // Set token first so the request interceptor includes it
    setToken(storedToken)

    api.get('/user')
      .then(res => {
        const u = res.data.data
        setUserState(u)
        localStorage.setItem('auth_user', JSON.stringify(u))
      })
      .catch(() => {
        // Token is invalid or expired — clear everything
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setToken(null)
        setUserState(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, []) // runs once on mount only

  const login = async (email: string, password: string) => {
    const res = await api.post('/login', { email, password })
    const { user: u, token: t } = res.data.data
    localStorage.setItem('auth_token', t)
    localStorage.setItem('auth_user', JSON.stringify(u))
    setToken(t)
    setUserState(u)
  }

  const register = async (name: string, email: string, password: string, password_confirmation: string) => {
    await api.post('/register', { name, email, password, password_confirmation })
  }

  const logout = async () => {
    try { await api.post('/logout') } catch {}
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUserState(null)
  }

  const setUser = (u: User) => {
    setUserState(u)
    localStorage.setItem('auth_user', JSON.stringify(u))
  }

  // While verifying the token, render nothing to prevent a flash of
  // wrong content (e.g. briefly showing a protected page then redirecting)
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout, setUser,
      isAdmin: user?.type === 'admin',
      isAuthenticated: !!token && !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
