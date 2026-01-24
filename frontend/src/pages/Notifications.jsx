import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  ThumbsUp,
  Clock,
  Check
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import notificationService from '../services/notification.service'
import { Link } from 'react-router-dom'

const Notifications = () => {
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  })

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />
      default:
        return <ThumbsUp className="w-5 h-5 text-gray-500" />
    }
  }

  const getMessage = (notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post'
      case 'comment':
        return 'commented on your post'
      case 'follow':
        return 'started following you'
      default:
        return 'sent you a notification'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const notifications = notificationsData?.notifications || []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button className="text-blue-600 hover:text-blue-700 font-medium">
          Mark all as read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Bell className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
          <p className="text-gray-600">When you get notifications, they'll appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Link
              key={notification._id}
              to={notification.post ? `/post/${notification.post._id}` : '#'}
              className={`flex items-start p-4 rounded-lg hover:bg-gray-50 ${
                notification.read ? 'bg-white' : 'bg-blue-50'
              }`}
            >
              <div className="flex-shrink-0 mr-4">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <img
                    src={notification.sender?.profilePicture || `https://ui-avatars.com/api/?name=${notification.sender?.username}&background=random`}
                    alt={notification.sender?.username}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">
                        {notification.sender?.username}
                      </span>{' '}
                      {getMessage(notification)}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {notification.post?.caption && (
                  <p className="text-sm text-gray-600 mt-2 truncate">
                    {notification.post.caption}
                  </p>
                )}
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications