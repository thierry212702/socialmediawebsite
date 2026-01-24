import api from './api'

const userService = {
  searchUsers: async (query) => {
    return await api.get('/users/search', { params: { search: query } })
  },

  getUserProfile: async (userId) => {
    return await api.get(`/users/profile/${userId}`)
  },

  getUserByUsername: async (username) => {
    return await api.get(`/users/username/${username}`)
  },

  followUser: async (userId) => {
    return await api.post(`/users/follow/${userId}`)
  },

  unfollowUser: async (userId) => {
    return await api.delete(`/users/unfollow/${userId}`)
  },

  getFollowers: async (userId) => {
    return await api.get(`/users/${userId}/followers`)
  },

  getFollowing: async (userId) => {
    return await api.get(`/users/${userId}/following`)
  },

  getSuggestedUsers: async () => {
    return await api.get('/users/suggested')
  },

  updateUserSettings: async (settings) => {
    return await api.put('/users/settings', settings)
  },

  updateStatus: async (status) => {
    return await api.put('/users/status', status)
  },
}

export default userService