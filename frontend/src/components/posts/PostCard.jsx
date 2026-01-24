import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreVertical
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import postService from '../../services/post.service'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import CommentModal from './CommentModal'

const PostCard = ({ post }) => {
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const { user } = useAuth()
  const { socket, toggleLikePost } = useSocket()
  const queryClient = useQueryClient()

  const likeMutation = useMutation({
    mutationFn: () => postService.toggleLikePost(post._id),
    onSuccess: (data) => {
      setIsLiked(data.liked)
      setLikesCount(data.likesCount)
      if (socket) {
        toggleLikePost(post._id)
      }
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => postService.toggleSavePost(post._id),
    onSuccess: (data) => {
      setIsSaved(data.saved)
    },
  })

  const handleLike = () => {
    likeMutation.mutate()
  }

  const handleSave = () => {
    saveMutation.mutate()
  }

  const handleComment = () => {
    setShowCommentModal(true)
  }

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count
  }

  return (
    <>
      <div className="card mb-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${post.user.username}`}>
              <img
                src={post.user.profilePicture || `https://ui-avatars.com/api/?name=${post.user.username}&background=random`}
                alt={post.user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            </Link>
            <div>
              <Link 
                to={`/profile/${post.user.username}`}
                className="font-semibold hover:text-blue-600"
              >
                {post.user.username}
              </Link>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Post Media */}
        <div className="mb-4">
          {post.mediaType === 'image' && (
            <img
              src={post.media[0]}
              alt={post.caption}
              className="w-full rounded-lg object-cover max-h-[500px]"
            />
          )}
          {post.mediaType === 'video' && (
            <video
              src={post.media[0]}
              controls
              className="w-full rounded-lg"
            />
          )}
          {post.mediaType === 'carousel' && (
            <div className="relative">
              {/* Implement carousel with Swiper */}
              <img
                src={post.media[0]}
                alt={post.caption}
                className="w-full rounded-lg object-cover max-h-[500px]"
              />
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Heart 
                className="w-7 h-7" 
                fill={isLiked ? "#ef4444" : "none"}
                color={isLiked ? "#ef4444" : "currentColor"}
              />
            </button>
            <button
              onClick={handleComment}
              className="p-1 hover:scale-110 transition-transform"
            >
              <MessageCircle className="w-7 h-7" />
            </button>
            <button className="p-1 hover:scale-110 transition-transform">
              <Send className="w-7 h-7" />
            </button>
          </div>
          <button
            onClick={handleSave}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Bookmark 
              className="w-7 h-7" 
              fill={isSaved ? "#3b82f6" : "none"}
              color={isSaved ? "#3b82f6" : "currentColor"}
            />
          </button>
        </div>

        {/* Post Stats */}
        <div className="mb-3">
          <p className="font-semibold">
            {formatCount(likesCount)} likes
          </p>
          {post.commentsCount > 0 && (
            <button
              onClick={handleComment}
              className="text-gray-500 hover:text-gray-700"
            >
              View all {formatCount(post.commentsCount)} comments
            </button>
          )}
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="mb-3">
            <p className="text-sm">
              <Link 
                to={`/profile/${post.user.username}`}
                className="font-semibold hover:text-blue-600 mr-2"
              >
                {post.user.username}
              </Link>
              {post.caption}
            </p>
          </div>
        )}

        {/* Add Comment Input */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 text-sm outline-none px-2 py-1"
              onClick={handleComment}
            />
            <button 
              onClick={handleComment}
              className="text-blue-500 hover:text-blue-700 font-medium text-sm"
            >
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <CommentModal
          post={post}
          onClose={() => setShowCommentModal(false)}
        />
      )}
    </>
  )
}

export default PostCard