import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);

    useEffect(() => {
        if (isAuthenticated && user && user.token) {
            const token = user.token || localStorage.getItem('token');

            if (!token) {
                console.error('No token found for socket connection');
                return;
            }

            // Clean up previous socket connection
            if (socketRef.current) {
                console.log('🧹 Cleaning up previous socket connection');
                socketRef.current.disconnect();
                socketRef.current = null;
            }

            console.log('🔄 Connecting socket with token:', token.substring(0, 20) + '...');

            const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
                auth: {
                    token: token,
                },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 10,
                timeout: 20000,
                forceNew: true,
            });

            socketRef.current = newSocket;
            setSocket(newSocket);

            // ========== CONNECTION EVENTS ==========
            newSocket.on('connect', () => {
                console.log('✅ Socket connected:', newSocket.id, 'User:', user.username);
                
                // Request online users list after connection
                newSocket.emit('getOnlineUsers');
            });

            newSocket.on('disconnect', (reason) => {
                console.log('❌ Socket disconnected. Reason:', reason);
                
                // Try to reconnect if disconnected by server
                if (reason === 'io server disconnect') {
                    console.log('🔄 Server disconnected socket, attempting to reconnect...');
                    setTimeout(() => {
                        if (socketRef.current && !socketRef.current.connected) {
                            socketRef.current.connect();
                        }
                    }, 2000);
                }
            });

            newSocket.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error.message);
                
                // If authentication error, clear token and redirect
                if (error.message.includes('Authentication error') || error.message.includes('Invalid token')) {
                    console.error('Authentication failed, clearing token');
                    localStorage.removeItem('token');
                    window.location.reload();
                }
            });

            // ========== FORCE DISCONNECT (from duplicate connection) ==========
            newSocket.on('forceDisconnect', (message) => {
                console.log('⚠️ Force disconnect:', message);
                newSocket.disconnect();
            });

            // ========== ONLINE USERS ==========
            newSocket.on('onlineUsers', (users) => {
                console.log('👥 Online users:', users);
                setOnlineUsers(users);
            });

            newSocket.on('userStatusChanged', (data) => {
                console.log('🔄 User status changed:', data);
                // This event is for user presence (online/offline) with user details
                // Not used for basic online users list
            });

            // ========== NOTIFICATIONS ==========
            newSocket.on('newNotification', (notification) => {
                console.log('🔔 New notification received:', notification);
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show toast notification
                const fromUsername = notification.from?.username || 'Someone';
                switch (notification.type) {
                    case 'follow':
                        toast(`${fromUsername} started following you`, { icon: '👤' });
                        break;
                    case 'like':
                        toast(`${fromUsername} liked your post`, { icon: '❤️' });
                        break;
                    case 'comment':
                        toast(`${fromUsername} commented on your post`, { icon: '💬' });
                        break;
                    case 'message':
                        toast(`New message from ${fromUsername}`, { icon: '📨' });
                        break;
                    case 'post':
                        toast(`${fromUsername} posted something new`, { icon: '📸' });
                        break;
                    default:
                        toast('New notification', { icon: '🔔' });
                }
            });

            // ========== CHAT EVENTS ==========
            newSocket.on('newMessage', (message) => {
                console.log('📨 New message received:', message);
                
                // Dispatch custom event for chat updates
                window.dispatchEvent(new CustomEvent('new-message', { detail: message }));

                // Show notification if not in chat with sender
                if (message.senderId?._id !== user._id) {
                    toast(`New message from ${message.senderId?.username || 'Someone'}`, {
                        icon: '💬',
                    });
                }
            });

            // ========== POST EVENTS ==========
            newSocket.on('postLiked', (data) => {
                console.log('❤️ Post liked event:', data);
                window.dispatchEvent(new CustomEvent('post-liked', { detail: data }));
                
                // Update UI if needed
                if (data.postId) {
                    // You can dispatch another event or update state
                }
            });

            newSocket.on('postCommented', (data) => {
                console.log('💬 Post commented event:', data);
                window.dispatchEvent(new CustomEvent('post-commented', { detail: data }));
            });

            newSocket.on('newPostCreated', (postData) => {
                console.log('📸 New post created event:', postData);
                window.dispatchEvent(new CustomEvent('new-post', { detail: postData }));

                // Show notification for new posts from followed users (except own posts)
                if (postData.user?._id !== user._id) {
                    toast(`${postData.user?.username || 'Someone'} posted something new`, {
                        icon: '📸',
                    });
                }
            });

            newSocket.on('followUpdated', (data) => {
                console.log('👥 Follow updated event:', data);
                window.dispatchEvent(new CustomEvent('follow-updated', { detail: data }));
                
                // Show toast for follow events that involve current user
                if (data.targetUserId === user._id) {
                    if (data.following) {
                        toast(`You have a new follower!`, { icon: '👥' });
                    }
                }
            });

            // ========== TYPING INDICATOR ==========
            newSocket.on('typing', (data) => {
                console.log('⌨️ Typing indicator:', data);
                window.dispatchEvent(new CustomEvent('typing-indicator', { detail: data }));
            });

            // ========== MESSAGE STATUS ==========
            newSocket.on('messagesRead', (data) => {
                console.log('✅ Messages read:', data);
                window.dispatchEvent(new CustomEvent('messages-read', { detail: data }));
            });

            // Cleanup function
            return () => {
                console.log('🧹 Cleaning up socket connection on unmount');
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
                setSocket(null);
                setOnlineUsers([]);
                // Don't clear notifications here - keep them in state
                // setNotifications([]);
                // setUnreadCount(0);
            };
        } else {
            // If not authenticated, ensure socket is disconnected
            if (socketRef.current) {
                console.log('🚫 User not authenticated, disconnecting socket');
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
        }
    }, [isAuthenticated, user?._id]); // Re-run when authentication or user changes

    // Function to send message via socket
    const sendMessage = (messageData) => {
        if (socket && socket.connected) {
            console.log('📤 Sending message:', messageData);
            socket.emit('sendMessage', messageData);
        } else {
            console.error('Cannot send message: Socket not connected');
            toast.error('Connection lost. Please refresh the page.');
        }
    };

    // Function to toggle like (FIXED: Remove userId parameter)
    const toggleLikePost = (postId) => {
        if (socket && socket.connected) {
            console.log('❤️ Toggling like for post:', postId);
            socket.emit('toggleLikePost', { postId });
        } else {
            console.error('Cannot toggle like: Socket not connected');
        }
    };

    // Function to follow/unfollow (FIXED: Use correct parameter name)
    const toggleFollow = (userId) => {
        if (socket && socket.connected) {
            console.log('👤 Toggling follow for user:', userId);
            socket.emit('toggleFollow', { userId });
        } else {
            console.error('Cannot toggle follow: Socket not connected');
        }
    };

    // Function to create new post via socket
    const createNewPost = (postData) => {
        if (socket && socket.connected) {
            console.log('📝 Creating new post via socket:', postData._id);
            socket.emit('newPostCreated', postData);
        } else {
            console.error('Cannot create post: Socket not connected');
        }
    };

    // Function to join conversation
    const joinConversation = (conversationId) => {
        if (socket && socket.connected) {
            console.log('💬 Joining conversation:', conversationId);
            socket.emit('joinConversation', conversationId);
        }
    };

    // Function to mark messages as read
    const markMessagesAsRead = (conversationId) => {
        if (socket && socket.connected) {
            console.log('✅ Marking messages as read for:', conversationId);
            socket.emit('markAsRead', { conversationId });
        }
    };

    // Function to send typing indicator
    const sendTypingIndicator = (conversationId, isTyping) => {
        if (socket && socket.connected) {
            socket.emit('typing', { conversationId, isTyping });
        }
    };

    // Function to join post room
    const joinPostRoom = (postId) => {
        if (socket && socket.connected) {
            console.log('📸 Joining post room:', postId);
            socket.emit('joinPost', postId);
        }
    };

    // Function to leave post room
    const leavePostRoom = (postId) => {
        if (socket && socket.connected) {
            console.log('📸 Leaving post room:', postId);
            socket.emit('leavePost', postId);
        }
    };

    const value = {
        socket,
        onlineUsers,
        notifications,
        unreadCount,
        isConnected: socket?.connected || false,
        sendMessage,
        toggleLikePost,
        toggleFollow,
        createNewPost,
        joinConversation,
        markMessagesAsRead,
        sendTypingIndicator,
        joinPostRoom,
        leavePostRoom,
        clearNotifications: () => {
            setNotifications([]);
            setUnreadCount(0);
        },
        markNotificationAsRead: (notificationId) => {
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId ? { ...notif, read: true } : notif
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        },
        // Helper to check if a specific user is online
        isUserOnline: (userId) => {
            return onlineUsers.includes(userId);
        },
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};