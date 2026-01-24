import api from './api'

const postService = {
  createPost: async (formData) => {
    return await api.post('/messages/posts/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  getFeedPosts: async (page = 1) => {
    return await api.get('/messages/posts/feed', { params: { page } })
  },

  getExplorePosts: async (page = 1) => {
    return await api.get('/messages/posts/explore', { params: { page } })
  },

  getUserPosts: async (username) => {
    return await api.get(`/messages/posts/user/${username}`)
  },

  getPostComments: async (postId) => {
    return await api.get(`/messages/posts/${postId}/comments`)
  },

  addComment: async (postId, content) => {
    return await api.post(`/messages/posts/${postId}/comments`, { content })
  },

  toggleLikePost: async (postId) => {
    return await api.post(`/messages/posts/${postId}/like`)
  },

  deletePost: async (postId) => {
    return await api.delete(`/messages/posts/${postId}`)
  },

  searchPosts: async (query) => {
    return await api.get('/messages/posts/search', { params: { q: query } })
  },

  toggleSavePost: async (postId) => {
    return await api.post(`/users/save/post/${postId}`)
  },
}

export default postService