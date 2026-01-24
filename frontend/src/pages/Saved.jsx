import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Grid3x3, Bookmark, Video, Image, MessageCircle, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

const Saved = () => {
  const [type, setType] = useState('all')

  const { data: savedContent, isLoading } = useQuery({
    queryKey: ['saved-content', type],
    queryFn: () => {
      // You'll need to implement getSavedContent in post.service
      return { success: true, savedContent: [] }
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const content = savedContent?.savedContent || []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Saved</h1>
            <p className="text-gray-600">All your saved posts and reels</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setType('all')}
            className={`pb-3 px-1 font-medium ${
              type === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setType('posts')}
            className={`pb-3 px-1 font-medium flex items-center ${
              type === 'posts'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Image className="w-4 h-4 mr-2" />
            Posts
          </button>
          <button
            onClick={() => setType('reels')}
            className={`pb-3 px-1 font-medium flex items-center ${
              type === 'reels'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Video className="w-4 h-4 mr-2" />
            Reels
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {content.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Bookmark className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No saved items</h3>
          <p className="text-gray-600">Save posts and reels to see them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {content.map((item) => (
            <Link
              key={item._id}
              to={`/post/${item._id}`}
              className="aspect-square relative group"
            >
              {item.mediaType === 'video' || item.video ? (
                <div className="relative w-full h-full">
                  <video
                    src={item.video || item.media?.[0]}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    <Video className="w-3 h-3 inline mr-1" />
                    Reel
                  </div>
                </div>
              ) : (
                <img
                  src={item.media?.[0] || item.thumbnail}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 mr-1" />
                    <span>{item.likesCount || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-5 h-5 mr-1" />
                    <span>{item.commentsCount || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Saved