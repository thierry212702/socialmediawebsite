import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, ChevronRight, ChevronLeft } from 'lucide-react'
import { useSocket } from '../../contexts/SocketContext'
import userService from '../../services/user.service'

const RightSidebar = ({ isOpen, onToggle }) => {
  const { onlineUsers } = useSocket()

  const { data: suggestedUsers, isLoading } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: () => userService.getSuggestedUsers(),
  })

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-l-lg shadow-sm fixed right-0 top-1/2 transform -translate-y-1/2 z-30"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    )
  }

  return (
    <aside className="hidden lg:block w-80 h-screen bg-white border-l border-gray-200 fixed right-0 top-0 z-40">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Discover</h2>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Online Users */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-700 mb-3">Online Now ({onlineUsers.length})</h3>
        <div className="space-y-3">
          {/* Online users would be mapped here */}
          <p className="text-sm text-gray-500">No online users</p>
        </div>
      </div>

      {/* Suggested Users */}
      <div className="p-4">
        <h3 className="font-medium text-gray-700 mb-3">Suggested for you</h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : suggestedUsers?.users?.length > 0 ? (
          <div className="space-y-3">
            {suggestedUsers.users.slice(0, 5).map((user) => (
              <Link
                key={user._id}
                to={`/profile/${user.username}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.bio || 'No bio yet'}</p>
                  </div>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Follow
                </button>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No suggestions available</p>
        )}
      </div>
    </aside>
  )
}

export default RightSidebar