import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { setAuthToken } from '../api/client'
import { getCurrentUser } from '../api/authApi'
import type { UserResponse } from '../api/types'

type AuthUser = UserResponse & { type: 'interviewee' | 'employer' }

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (token: string, record: UserResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = window.localStorage.getItem('auth_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        setUser({ ...currentUser, type: currentUser.role === 'employer' ? 'employer' : 'interviewee' })
      } catch {
        setAuthToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  function login(token: string, record: UserResponse) {
    setAuthToken(token)
    setUser({ ...record, type: record.role === 'employer' ? 'employer' : 'interviewee' })
  }

  function logout() {
    setAuthToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
