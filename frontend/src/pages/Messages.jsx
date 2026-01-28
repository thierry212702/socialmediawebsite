import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Search, 
  Send, 
  Image as ImageIcon,
  Smile,
  Phone,
  Video,
  Info,
  MessageCircle,
  Circle
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import chatService from '../services/chat.service'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import MessageItem from '../components/chat/MessageItem'

const Messages = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentChatUser, setCurrentChatUser] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const queryClient = useQueryClient()
  
  // Track the last message we sent to prevent duplicates
  const lastSentMessageRef = useRef(null)

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations(),
  })

  const { data: chatUsers, refetch: refetchChatUsers } = useQuery({
    queryKey: ['chat-users'],
    queryFn: () => chatService.getChatUsers(),
    refetchInterval: 30000,
  })

  const { 
    data: messagesData, 
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages 
  } = useQuery({
    queryKey: ['messages', userId],
    queryFn: () => chatService.getMessages(userId),
    enabled: !!userId,
  })

  // Extract messages array from the response
  const messages = Array.isArray(messagesData) 
    ? messagesData 
    : messagesData?.messages || messagesData?.data || []

  // Listen for online/offline status updates via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleUserOnline = (userData) => {
      queryClient.setQueryData(['chat-users'], (oldData) => {
        if (!oldData?.users) return oldData
        
        return {
          ...oldData,
          users: oldData.users.map(u => 
            u._id === userData.userId 
              ? { ...u, status: 'online', lastSeen: null }
              : u
          )
        }
      })
    }

    const handleUserOffline = (userData) => {
      queryClient.setQueryData(['chat-users'], (oldData) => {
        if (!oldData?.users) return oldData
        
        return {
          ...oldData,
          users: oldData.users.map(u => 
            u._id === userData.userId 
              ? { ...u, status: 'offline', lastSeen: new Date().toISOString() }
              : u
          )
        }
      })
    }

    // Only listen for messages from OTHER users (not our own)
    const handleNewMessage = (newMessage) => {
      // If this is our own message that we just sent, ignore it
      if (lastSentMessageRef.current && 
          (newMessage._id === lastSentMessageRef.current._id || 
           newMessage.text === lastSentMessageRef.current.text)) {
        console.log('Ignoring our own message from socket')
        lastSentMessageRef.current = null
        return
      }

      const isForCurrentChat = 
        newMessage.senderId === userId || 
        newMessage.receiverId === userId ||
        (newMessage.senderId?._id === userId) ||
        (newMessage.receiverId?._id === userId)

      if (isForCurrentChat) {
        // Refetch to get updated messages
        setTimeout(() => {
          refetchMessages()
        }, 100)
      }
    }

    socket.on('userOnline', handleUserOnline)
    socket.on('userOffline', handleUserOffline)
    socket.on('newMessage', handleNewMessage)

    return () => {
      socket.off('userOnline', handleUserOnline)
      socket.off('userOffline', handleUserOffline)
      socket.off('newMessage', handleNewMessage)
    }
  }, [socket, isConnected, userId, queryClient, refetchMessages])

  // Find the current chat user from chatUsers list
  useEffect(() => {
    if (userId && chatUsers?.users) {
      const userData = chatUsers.users.find(u => u._id === userId)
      if (userData) {
        setCurrentChatUser(userData)
      }
    }
  }, [userId, chatUsers])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim() || !userId || !user || isSending) return

    const messageText = message.trim()
    setMessage('')
    setShowEmojiPicker(false)
    setIsSending(true)

    try {
      // 1. Send via HTTP API
      const sentMessage = await chatService.sendMessage(userId, { text: messageText })
      
      // Store the sent message to ignore it from socket
      lastSentMessageRef.current = sentMessage
      
      console.log('Message sent successfully:', sentMessage._id)

      // 2. If socket is connected, emit for real-time (but don't listen for it)
      if (socket && isConnected) {
        socket.emit('sendMessage', {
          receiverId: userId,
          text: messageText,
          _id: sentMessage._id,
          createdAt: sentMessage.createdAt
        })
      }

      // 3. Refetch messages after sending
      await refetchMessages()
      
      // 4. Scroll to bottom
      scrollToBottom()

      // 5. Update conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] })

    } catch (error) {
      console.error('Send message error:', error)
      // Restore the message so user can try again
      setMessage(messageText)
    } finally {
      setIsSending(false)
    }
  }

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji)
  }

  // Filter and sort users: online first, then alphabetical
  const filteredAndSortedUsers = chatUsers?.users
    ?.filter(userItem =>
      userItem.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (userItem.fullName && userItem.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    ?.sort((a, b) => {
      if (a.status === 'online' && b.status !== 'online') return -1
      if (a.status !== 'online' && b.status === 'online') return 1
      return a.username.localeCompare(b.username)
    }) || []

  // Count online users
  const onlineUsersCount = filteredAndSortedUsers.filter(u => u.status === 'online').length

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Conversations List */}
      <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Messages</h2>
            {!isConnected && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Connecting...
              </span>
            )}
          </div>
          
          {/* Online Users Status */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Circle className="w-3 h-3 text-green-500 fill-green-500" />
                  <span className="ml-1 font-medium">{onlineUsersCount}</span>
                </div>
                <span className="text-gray-600">Online</span>
              </div>
              <button 
                onClick={() => refetchChatUsers()}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredAndSortedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-center">
                {searchQuery ? 'No users found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <button 
                  onClick={() => navigate('/explore')}
                  className="mt-3 text-sm text-blue-500 hover:text-blue-700"
                >
                  Find people to message
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Online Users Section */}
              {onlineUsersCount > 0 && (
                <div className="px-4 pt-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Online Now
                  </h3>
                  <div className="space-y-2 mb-4">
                    {filteredAndSortedUsers
                      .filter(u => u.status === 'online')
                      .map((userItem) => (
                        <div
                          key={userItem._id}
                          className={`p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                            userId === userItem._id ? 'bg-blue-50 border border-blue-100' : ''
                          }`}
                          onClick={() => navigate(`/messages/${userItem._id}`)}
                        >
                          <div className="flex items-center">
                            <div className="relative">
                              <img
                                src={userItem.profilePicture || `https://ui-avatars.com/api/?name=${userItem.username}&background=random`}
                                alt={userItem.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="font-medium text-gray-900">{userItem.username}</p>
                              <p className="text-xs text-green-600">Online</p>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* All Users Section */}
              <div className="px-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  All Conversations
                </h3>
                <div className="space-y-1">
                  {filteredAndSortedUsers.map((userItem) => {
                    if (userItem.status === 'online') return null // Already shown above
                    
                    return (
                      <div
                        key={userItem._id}
                        className={`p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                          userId === userItem._id ? 'bg-blue-50 border border-blue-100' : ''
                        }`}
                        onClick={() => navigate(`/messages/${userItem._id}`)}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <img
                              src={userItem.profilePicture || `https://ui-avatars.com/api/?name=${userItem.username}&background=random`}
                              alt={userItem.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-gray-400"></div>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">{userItem.username}</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {userItem.status === 'offline' 
                                ? userItem.lastSeen 
                                  ? `Last seen ${new Date(userItem.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                                  : 'Offline'
                                : 'Away'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col hidden md:flex">
        {userId && currentChatUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={currentChatUser.profilePicture || `https://ui-avatars.com/api/?name=${currentChatUser.username}&background=random`}
                    alt={currentChatUser.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    currentChatUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div>
                  <p className="font-semibold">{currentChatUser.username}</p>
                  <p className={`text-sm flex items-center ${
                    currentChatUser.status === 'online' ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {currentChatUser.status === 'online' ? (
                      <>
                        <Circle className="w-2 h-2 fill-green-500 mr-1" />
                        Online
                      </>
                    ) : currentChatUser.lastSeen ? (
                      `Last seen ${new Date(currentChatUser.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading messages...</div>
                </div>
              ) : messagesError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-500">Error loading messages</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400">Start a conversation by sending a message!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  if (!msg || !msg.text) return null
                  
                  const isOwn = msg.senderId?._id === user?._id || 
                               msg.sender === user?._id || 
                               msg.senderId === user?._id
                  
                  return (
                    <MessageItem
                      key={msg._id}
                      message={msg}
                      isOwn={isOwn}
                      senderAvatar={
                        isOwn 
                          ? user?.profilePicture 
                          : currentChatUser?.profilePicture
                      }
                    />
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 relative">
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-0 z-10">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Smile className="w-6 h-6 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <ImageIcon className="w-6 h-6 text-gray-500" />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
                  className={`p-2 rounded-full ${isSending ? 'bg-blue-400' : 'bg-blue-600'} text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSending ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-1">⏳</span>
                      Sending...
                    </span>
                  ) : (
                    <Send className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-24 h-24 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
            <p className="text-gray-600 mb-6">Select a conversation or start a new one</p>
            <button 
              onClick={() => navigate('/explore')}
              className="btn-primary"
            >
              Find Friends
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages