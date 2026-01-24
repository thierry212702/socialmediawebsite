import React from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const ConversationList = ({ conversations = [], activeConversationId }) => {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-500 text-center">No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        if (!conversation || !conversation.participants || conversation.participants.length === 0) {
          return null
        }
        
        const otherUser = conversation.participants.find(p => p && p._id)
        const lastMessage = conversation.lastMessage
        
        if (!otherUser) return null

        return (
          <Link
            key={conversation._id || Math.random()}
            to={`/messages/${otherUser._id}`}
            className={`flex items-center p-3 rounded-lg transition-colors ${
              activeConversationId === otherUser._id
                ? 'bg-blue-50'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="relative">
              <img
                src={otherUser.profilePicture || `https://ui-avatars.com/api/?name=${otherUser.username || 'User'}&background=random`}
                alt={otherUser.username || 'User'}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                otherUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold truncate">{otherUser.username || 'User'}</p>
                <span className="text-xs text-gray-500">
                  {lastMessage?.createdAt && formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 truncate">
                  {lastMessage?.text || 'No messages yet'}
                </p>
                {lastMessage?.senderId === otherUser?._id && (
                  <div className="flex-shrink-0 ml-2">
                    {conversation.unreadCount?.get(otherUser?._id) > 0 ? (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    ) : lastMessage?.status === 'read' ? (
                      <CheckCheck className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Check className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default ConversationList