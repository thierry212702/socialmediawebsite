import api from './api'

const authService = {
  signup: async (userData) => {
    return await api.post('/auth/signup', userData)
  },

  login: async (email, password) => {
    return await api.post('/auth/login', { email, password })
  },

  logout: async () => {
    return await api.post('/auth/logout')
  },

  checkAuth: async () => {
    return await api.get('/auth/check')
  },

  updateProfile: async (formData) => {
    return await api.put('/auth/update-profile', formData)
  },

  changePassword: async (passwords) => {
    return await api.post('/auth/change-password', passwords)
  },

  getCurrentUser: async () => {
    return await api.get('/auth/me')
  },
}

export default authService