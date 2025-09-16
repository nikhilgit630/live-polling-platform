"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient, type User } from "@/lib/api"
import { wsManager } from "@/lib/websocket"

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on mount
    const savedToken = localStorage.getItem("auth_token")
    if (savedToken) {
      setToken(savedToken)
      apiClient.setToken(savedToken)

      // Verify token and get user data
      apiClient
        .getCurrentUser()
        .then(({ user }) => {
          setUser(user)
          // Connect WebSocket with token
          wsManager.connect(savedToken)
        })
        .catch(() => {
          // Token is invalid, clear it
          localStorage.removeItem("auth_token")
          apiClient.clearToken()
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      setUser(response.user)
      setToken(response.token)
      apiClient.setToken(response.token)

      // Connect WebSocket
      wsManager.connect(response.token)
    } catch (error) {
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiClient.register(name, email, password)
      setUser(response.user)
      setToken(response.token)
      apiClient.setToken(response.token)

      // Connect WebSocket
      wsManager.connect(response.token)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    apiClient.clearToken()
    wsManager.disconnect()
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
