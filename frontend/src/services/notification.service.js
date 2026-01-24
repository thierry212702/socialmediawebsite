import api from './api'

const notificationService = {
  getNotifications: async () => {
    return await api.get('/messages/notifications')
  },

  markAllAsRead: async () => {
    return await api.put('/messages/notifications/read-all')
  },
}

export default notificationService