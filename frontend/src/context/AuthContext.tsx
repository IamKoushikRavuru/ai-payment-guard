import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi, type LoginRequest, type RegisterRequest, type UserResponse } from '@/api/auth'

interface AuthContextType {
  user: UserResponse | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isAuthModalOpen: boolean
  authModalMode: 'login' | 'register'
  openAuthModal: (mode?: 'login' | 'register') => void
  closeAuthModal: () => void
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'aegis_auth_token'
const USER_KEY = 'aegis_auth_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY)
        const savedUserStr = localStorage.getItem(USER_KEY)

        if (savedToken && savedUserStr) {
          try {
            const parsedUser = JSON.parse(savedUserStr)
            setToken(savedToken)
            setUser(parsedUser)
          } catch {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
            setToken(null)
            setUser(null)
          }
        } else {
          setToken(null)
          setUser(null)
        }
      } catch (err) {
        console.error('Failed to restore auth session', err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  const login = async (credentials: LoginRequest) => {
    const res = await authApi.login(credentials)
    setToken(res.access_token)
    setUser(res.user)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    setIsAuthModalOpen(false)
  }

  const register = async (data: RegisterRequest) => {
    const res = await authApi.register(data)
    setToken(res.access_token)
    setUser(res.user)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    setIsAuthModalOpen(false)
  }

  const logout = async () => {
    try {
      await authApi.logout().catch(() => null)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
