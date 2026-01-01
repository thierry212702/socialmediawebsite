import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor with better error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401) {
            console.log('🔐 401 Unauthorized - Redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

// ==================== AUTH API ====================
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    checkAuth: () => api.get('/auth/me'),
    updateProfile: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });
        return api.put('/auth/update-profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    changePassword: (data) => api.post('/auth/change-password', data),
};

// ==================== USER API ====================
export const userAPI = {
    searchUsers: (query) => api.get(`/users/search?search=${query}`),
    getUserProfile: (userId) => api.get(`/users/profile/${userId}`),
    getUserByUsername: (username) => api.get(`/users/username/${username}`),
    getFollowers: (userId) => api.get(`/users/${userId}/followers`),
    getFollowing: (userId) => api.get(`/users/${userId}/following`),
    followUser: (userId) => api.post(`/users/follow/${userId}`),
    unfollowUser: (userId) => api.delete(`/users/unfollow/${userId}`),
    getSuggestedUsers: () => api.get('/users/suggested'),
    updateUserStatus: (data) => api.put('/users/status', data),
    updateUserSettings: (data) => api.put('/users/settings', data),
    getSavedContent: (type = 'all', page = 1, limit = 20) =>
        api.get(`/users/saved?type=${type}&page=${page}&limit=${limit}`),
    toggleSavePost: (postId) => api.post(`/users/save/post/${postId}`),
    toggleSaveReel: (reelId) => api.post(`/users/save/reel/${reelId}`),
};

// ==================== POST API ====================
export const postAPI = {
    createPost: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                if (key === 'media' && Array.isArray(data[key])) {
                    data[key].forEach(file => formData.append('media', file));
                } else {
                    formData.append(key, data[key]);
                }
            }
        });
        return api.post('/messages/posts/create', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getFeedPosts: (page = 1, limit = 10) =>
        api.get(`/messages/posts/feed?page=${page}&limit=${limit}`),
    getExplorePosts: (page = 1, limit = 20) =>
        api.get(`/messages/posts/explore?page=${page}&limit=${limit}`),
    searchPosts: (query, page = 1, limit = 20) =>
        api.get(`/messages/posts/search?q=${query}&page=${page}&limit=${limit}`),
    toggleLikePost: (postId) => api.post(`/messages/posts/${postId}/like`),
    addCommentToPost: (postId, content) =>
        api.post(`/messages/posts/${postId}/comments`, { content }),
    getPostComments: (postId, limit = 20, skip = 0) =>
        api.get(`/messages/posts/${postId}/comments?limit=${limit}&skip=${skip}`),
    getUserPosts: (username) => api.get(`/messages/posts/user/${username}`),
    deletePost: (postId) => api.delete(`/messages/posts/${postId}`),
};

// ==================== CHAT API ====================
export const chatAPI = {
    getConversations: () => api.get('/messages/chat/conversations'),
    getMessages: (userId) => api.get(`/messages/chat/${userId}`),
    sendMessage: (userId, data) => {
        const formData = new FormData();
        if (data.text) formData.append('text', data.text);
        if (data.image) formData.append('image', data.image);
        return api.post(`/messages/chat/send/${userId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getUsersForSidebar: () => api.get('/messages/chat/users'),
};

// ==================== NOTIFICATION API ====================
export const notificationAPI = {
    getNotifications: (limit = 20, skip = 0) =>
        api.get(`/messages/notifications?limit=${limit}&skip=${skip}`),
    markAsRead: (notificationId) =>
        api.put(`/messages/notifications/${notificationId}/read`),
    markAllAsRead: () => api.put('/messages/notifications/read-all'),
    getUnreadCount: () => api.get('/messages/notifications/unread-count'),
};

export default api;