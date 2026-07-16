import React, { createContext, useState, useEffect, useContext } from 'react'
import api from '../services/api'

interface UserProfile {
  email: string
  role: string
  is_active: boolean
}

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  registerUser: (email: string, password: string, role?: string) => Promise<void>
  logout: () => void
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
  )

  useEffect(() => {
    // Theme sync
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const verifyToken = async (currentToken: string) => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
    } catch (error) {
      console.error('Invalid token verification:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      verifyToken(token)
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })

      const { access_token, role, email } = response.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('user_role', role)
      localStorage.setItem('user_email', email)
      setToken(access_token)
      setUser({ email, role, is_active: true })
    } catch (error) {
      setIsLoading(false)
      throw error;
    }
  }

  const registerUser = async (email: string, password: string, role: string = 'retail') => {
    await api.post('/auth/register', { email, password, role })
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_email')
    setToken(null)
    setUser(null)
    setIsLoading(false)
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    registerUser,
    logout,
    theme,
    toggleTheme
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
