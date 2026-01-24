// File: src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calls, setCalls] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      auth: {
        token: localStorage.getItem('token'),
        userId: user._id,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      
      // Join user room
      newSocket.emit('joinUserRoom', user._id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Online users
    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    // Notifications
    newSocket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast notification based on type
      switch (notification.type) {
        case 'like':
          toast.success(`${notification.sender?.username} liked your post`, {
            icon: '❤️',
            style: {
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: 'white',
            },
          });
          break;
        case 'comment':
          toast.success(`${notification.sender?.username} commented on your post`, {
            icon: '💬',
            style: {
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: 'white',
            },
          });
          break;
        case 'follow':
          toast.success(`${notification.sender?.username} started following you`, {
            icon: '👥',
            style: {
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: 'white',
            },
          });
          break;
        case 'mention':
          toast.success(`${notification.sender?.username} mentioned you`, {
            icon: '@',
            style: {
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              color: 'white',
            },
          });
          break;
        case 'repost':
          toast.success(`${notification.sender?.username} reposted your content`, {
            icon: '🔄',
            style: {
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: 'white',
            },
          });
          break;
      }
    });

    // Messages
    newSocket.on('newMessage', (message) => {
      // This will be handled by the Messages component
      console.log('New message received:', message);
    });

    newSocket.on('messageRead', (data) => {
      console.log('Message read:', data);
    });

    newSocket.on('typing', (data) => {
      console.log('Typing:', data);
    });

    // Calls
    newSocket.on('incomingCall', (callData) => {
      setCalls(prev => [...prev, callData]);
      
      // Show incoming call notification
      toast.custom((t) => (
        <div className={`bg-white rounded-xl shadow-2xl p-6 max-w-md w-full transform transition-all duration-300 ${t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={callData.caller?.profilePicture || `https://ui-avatars.com/api/?name=${callData.caller?.username}&background=random`}
                alt={callData.caller?.username}
                className="w-16 h-16 rounded-full"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{callData.caller?.username}</h3>
              <p className="text-neutral-600">
                {callData.type === 'video' ? 'Video call' : 'Voice call'}
              </p>
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                newSocket.emit('declineCall', { callId: callData.callId });
              }}
              className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200"
            >
              Decline
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                newSocket.emit('answerCall', { callId: callData.callId });
              }}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
            >
              Answer
            </button>
          </div>
        </div>
      ), {
        duration: 30000,
        position: 'top-center',
      });
    });

    newSocket.on('callAnswered', (data) => {
      console.log('Call answered:', data);
      setCalls(prev => prev.filter(call => call.callId !== data.callId));
    });

    newSocket.on('callDeclined', (data) => {
      console.log('Call declined:', data);
      setCalls(prev => prev.filter(call => call.callId !== data.callId));
      toast.error('Call declined');
    });

    newSocket.on('callEnded', (data) => {
      console.log('Call ended:', data);
      setCalls(prev => prev.filter(call => call.callId !== data.callId));
    });

    // Post interactions
    newSocket.on('postLiked', (data) => {
      console.log('Post liked:', data);
    });

    newSocket.on('postCommented', (data) => {
      console.log('Post commented:', data);
    });

    newSocket.on('postReposted', (data) => {
      console.log('Post reposted:', data);
    });

    newSocket.on('newPostCreated', (post) => {
      console.log('New post:', post);
    });

    newSocket.on('userFollowed', (data) => {
      console.log('User followed:', data);
    });

    // Cleanup
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  // Socket functions
  const sendMessage = useCallback((data) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', data);
    }
  }, [socket, isConnected]);

  const toggleLikePost = useCallback((postId) => {
    if (socket && isConnected) {
      socket.emit('toggleLikePost', { postId });
    }
  }, [socket, isConnected]);

  const toggleFollow = useCallback((userId) => {
    if (socket && isConnected) {
      socket.emit('toggleFollow', { userId });
    }
  }, [socket, isConnected]);

  const joinConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      socket.emit('joinConversation', conversationId);
    }
  }, [socket, isConnected]);

  const leaveConversation = useCallback((conversationId) => {
    if (socket && isConnected) {
      socket.emit('leaveConversation', conversationId);
    }
  }, [socket, isConnected]);

  const initiateCall = useCallback((data) => {
    if (socket && isConnected) {
      socket.emit('initiateCall', data);
    }
  }, [socket, isConnected]);

  const answerCall = useCallback((data) => {
    if (socket && isConnected) {
      socket.emit('answerCall', data);
    }
  }, [socket, isConnected]);

  const declineCall = useCallback((data) => {
    if (socket && isConnected) {
      socket.emit('declineCall', data);
    }
  }, [socket, isConnected]);

  const endCall = useCallback((data) => {
    if (socket && isConnected) {
      socket.emit('endCall', data);
    }
  }, [socket, isConnected]);

  const markAsRead = useCallback((data) => {
    if (socket && isConnected) {
      socket.emit('markAsRead', data);
    }
  }, [socket, isConnected]);

  const sendTyping = useCallback((data) => {
    if (socket && isConnected) {
      socket.emit('typing', data);
    }
  }, [socket, isConnected]);

  const value = {
    socket,
    onlineUsers,
    notifications,
    calls,
    isConnected,
    sendMessage,
    toggleLikePost,
    toggleFollow,
    joinConversation,
    leaveConversation,
    initiateCall,
    answerCall,
    declineCall,
    endCall,
    markAsRead,
    sendTyping,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};