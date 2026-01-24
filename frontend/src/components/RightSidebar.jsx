import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, ChevronRight, ChevronLeft, Flame, TrendingUp, Clock, Play, Heart, MessageCircle, MoreVertical } from 'lucide-react'
import { useSocket } from '../../contexts/SocketContext'
import userService from '../../services/user.service'
import { formatDistanceToNow } from 'date-fns'

const RightSidebar = ({ isOpen, onToggle }) => {
  const { onlineUsers } = useSocket()

  const { data: trendingContent, isLoading } = useQuery({
    queryKey: ['trending-content'],
    queryFn: async () => {
      try {
        // Simulated trending content - replace with actual API call
        return {
          trending: [
            {
              id: 1,
              type: 'video',
              url: 'https://example.com/video1.mp4',
              thumbnail: 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=400&h=600&fit=crop',
              likes: 24500,
              comments: 1200,
              user: {
                username: 'trending_user1',
                profilePicture: 'https://ui-avatars.com/api/?name=Trending+User&background=linear-gradient(45deg,#ff6b6b,#ee5a52)'
              },
              duration: '0:45',
              views: '1.2M',
              caption: 'This trend is taking over! 🔥 #viral',
              createdAt: new Date(Date.now() - 3600000) // 1 hour ago
            },
            {
              id: 2,
              type: 'photo',
              url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w-400&h=600&fit=crop',
              likes: 18400,
              comments: 850,
              user: {
                username: 'photographer',
                profilePicture: 'https://ui-avatars.com/api/?name=Photo+Guru&background=linear-gradient(45deg,#4ecdc4,#44a08d)'
              },
              views: '850K',
              caption: 'Golden hour perfection ✨ #photography',
              createdAt: new Date(Date.now() - 7200000) // 2 hours ago
            },
            {
              id: 3,
              type: 'video',
              url: 'https://example.com/video2.mp4',
              thumbnail: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=600&fit=crop',
              likes: 32100,
              comments: 2100,
              user: {
                username: 'creator_pro',
                profilePicture: 'https://ui-avatars.com/api/?name=Creator+Pro&background=linear-gradient(45deg,#8e2de2,#4a00e0)'
              },
              duration: '1:20',
              views: '2.5M',
              caption: 'Behind the scenes magic 🎬 #creative',
              createdAt: new Date(Date.now() - 10800000) // 3 hours ago
            }
          ],
          suggestedUsers: [
            {
              _id: '1',
              username: 'tech_guru',
              profilePicture: 'https://ui-avatars.com/api/?name=Tech+Guru&background=linear-gradient(45deg,#11998e,#38ef7d)',
              followersCount: 12500,
              isFollowing: false
            },
            {
              _id: '2',
              username: 'travel_diary',
              profilePicture: 'https://ui-avatars.com/api/?name=Travel+Diary&background=linear-gradient(45deg,#f46b45,#eea849)',
              followersCount: 8900,
              isFollowing: true
            },
            {
              _id: '3',
              username: 'art_vibes',
              profilePicture: 'https://ui-avatars.com/api/?name=Art+Vibes&background=linear-gradient(45deg,#834d9b,#d04ed6)',
              followersCount: 15600,
              isFollowing: false
            }
          ]
        }
      } catch (error) {
        console.error('Error fetching trending content:', error)
        return { trending: [], suggestedUsers: [] }
      }
    },
  })

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center w-10 h-10 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-l-xl shadow-lg fixed right-0 top-1/2 transform -translate-y-1/2 z-30 hover:bg-gray-700/80 transition-colors group"
      >
        <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
      </button>
    )
  }

  return (
    <aside className="hidden lg:block w-80 h-[calc(100vh-4rem)] bg-gray-900/50 backdrop-blur-xl border-l border-gray-800/50 fixed right-0 top-16 z-40 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-800/50 flex items-center justify-between bg-gradient-to-r from-gray-900/80 to-transparent">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-200">Trending Now</h2>
            <p className="text-xs text-gray-400">Discover what's hot</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Trending Content (Reels-like) */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-300 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
            Viral Content
          </h3>
          <span className="text-xs text-gray-400">
            {trendingContent?.trending?.length || 0} items
          </span>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[9/16] bg-gray-800/50 rounded-xl mb-2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-800/50 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-800/50 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : trendingContent?.trending?.length > 0 ? (
          <div className="space-y-4">
            {trendingContent.trending.map((item) => (
              <div key={item.id} className="group relative">
                {/* Content Card */}
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-gray-800/30 to-gray-900/50 border border-gray-800/50">
                  {/* Thumbnail/Video */}
                  <div className="aspect-[9/16] relative overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.type === 'video' && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <Play className="w-3 h-3 mr-1" />
                          {item.duration}
                        </div>
                        <div className="absolute bottom-3 left-3 text-white text-sm font-medium">
                          {item.views} views
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Content Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <img
                          src={item.user.profilePicture}
                          alt={item.user.username}
                          className="w-8 h-8 rounded-full border border-gray-700/50"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-200">@{item.user.username}</p>
                          <p className="text-xs text-gray-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-800/50 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-300 line-clamp-2 mb-3">{item.caption}</p>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-gray-400">
                          <Heart className="w-4 h-4 mr-1" />
                          <span>{item.likes.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          <span>{item.comments.toLocaleString()}</span>
                        </div>
                      </div>
                      <button className="text-xs px-3 py-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 rounded-lg hover:from-blue-600/30 hover:to-purple-600/30 transition-colors">
                        Explore
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-full flex items-center justify-center">
              <Flame className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400">No trending content yet</p>
            <p className="text-sm text-gray-500 mt-1">Check back later for updates</p>
          </div>
        )}
      </div>

      {/* Suggested Users */}
      <div className="p-4 border-t border-gray-800/50">
        <h3 className="font-medium text-gray-300 mb-3 flex items-center">
          <Users className="w-4 h-4 mr-2 text-blue-400" />
          Suggested for You
        </h3>
        {trendingContent?.suggestedUsers?.length > 0 ? (
          <div className="space-y-3">
            {trendingContent.suggestedUsers.slice(0, 5).map((user) => (
              <Link
                key={user._id}
                to={`/profile/${user.username}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover border border-gray-700/50 group-hover:border-blue-500/50 transition-colors"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-200">@{user.username}</p>
                    <p className="text-xs text-gray-400">{user.followersCount.toLocaleString()} followers</p>
                  </div>
                </div>
                <button className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${
                  user.isFollowing
                    ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                }`}>
                  {user.isFollowing ? 'Following' : 'Follow'}
                </button>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No suggestions available</p>
        )}
      </div>

      {/* Online Users */}
      <div className="p-4 border-t border-gray-800/50">
        <h3 className="font-medium text-gray-300 mb-3">
          Online Now ({onlineUsers.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {onlineUsers.length > 0 ? (
            onlineUsers.slice(0, 8).map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                className="relative group"
                title={user.username}
              >
                <img
                  src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=linear-gradient(45deg,#00b09b,#96c93d)&color=fff`}
                  alt={user.username}
                  className="w-10 h-10 rounded-full border-2 border-green-500/50 object-cover group-hover:border-green-400 transition-colors"
                />
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500">No online users</p>
          )}
        </div>
      </div>

      {/* Trending Tags */}
      <div className="p-4 border-t border-gray-800/50">
        <h3 className="font-medium text-gray-300 mb-3">Trending Tags</h3>
        <div className="flex flex-wrap gap-2">
          {['#viral', '#trending', '#explore', '#social', '#content', '#creator'].map((tag) => (
            <a
              key={tag}
              href={`/explore/${tag.replace('#', '')}`}
              className="px-3 py-1.5 bg-gradient-to-r from-gray-800/50 to-gray-900/50 hover:from-gray-700/50 hover:to-gray-800/50 rounded-lg text-sm text-gray-400 hover:text-blue-400 transition-all duration-300"
            >
              {tag}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}

export default RightSidebar