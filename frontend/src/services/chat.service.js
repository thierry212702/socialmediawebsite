import api from './api'

const chatService = {
  getChatUsers: async () => {
    return await api.get('/messages/chat/users')
  },

  getConversations: async () => {
    return await api.get('/messages/chat/conversations')
  },

  getMessages: async (userId) => {
    return await api.get(`/messages/chat/${userId}`)
  },

  sendMessage: async (userId, data) => {
    return await api.post(`/messages/chat/send/${userId}`, data)
  },

  markAsRead: async (conversationId) => {
    return await api.put(`/messages/notifications/${conversationId}/read`)
  },
}

export default chatService