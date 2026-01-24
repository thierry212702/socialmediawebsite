import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import authService from '../services/auth.service'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await authService.checkAuth()
      if (response.success) {
        setUser(response.user)
      } else {
        localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password)
      if (response.success) {
        localStorage.setItem('token', response.token)
        setUser(response.user)
        toast.success('Login successful!')
        navigate('/')
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: error.response?.data?.message || 'Login failed' }
    }
  }

  const signup = async (userData) => {
    try {
      const response = await authService.signup(userData)
      if (response.success) {
        localStorage.setItem('token', response.token)
        setUser(response.user)
        toast.success('Account created successfully!')
        navigate('/')
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, message: error.response?.data?.message || 'Signup failed' }
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      navigate('/login')
      toast.success('Logged out successfully')
    }
  }

  const updateProfile = async (formData) => {
    try {
      const response = await authService.updateProfile(formData)
      if (response.success) {
        setUser(response.user)
        toast.success('Profile updated!')
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, message: error.response?.data?.message || 'Update failed' }
    }
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    setUser,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}