import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreVertical 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import postService from '../services/post.service'
import { useAuth } from '../contexts/AuthContext'
import CommentModal from '../components/posts/CommentModal'

const PostDetail = () => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCommentModal, setShowCommentModal] = React.useState(false)

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => {
      // You'll need to implement getPostById in post.service
      return { success: true, post: {} }
    },
  })

  const likeMutation = useMutation({
    mutationFn: () => postService.toggleLikePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['post', postId])
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      {/* Post Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Media Section */}
          <div className="md:w-2/3 bg-black">
            {post?.mediaType === 'image' && (
              <img
                src={post?.media[0]}
                alt={post?.caption}
                className="w-full h-auto max-h-[600px] object-contain"
              />
            )}
            {post?.mediaType === 'video' && (
              <video
                src={post?.media[0]}
                controls
                className="w-full h-auto max-h-[600px]"
              />
            )}
          </div>

          {/* Details Section */}
          <div className="md:w-1/3 p-4">
            {/* User Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <img
                  src={post?.user?.profilePicture || `https://ui-avatars.com/api/?name=${post?.user?.username}&background=random`}
                  alt={post?.user?.username}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <p className="font-semibold">{post?.user?.username}</p>
                  <p className="text-sm text-gray-500">{post?.location}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto mb-4 max-h-[400px]">
              {/* Comment items would go here */}
              <p className="text-gray-500 text-center py-8">
                No comments yet
              </p>
            </div>

            {/* Actions */}
            <div className="border-t border-b border-gray-100 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => likeMutation.mutate()}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    {post?.isLiked ? (
                      <HeartFill className="w-7 h-7 text-red-500" />
                    ) : (
                      <Heart className="w-7 h-7" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowCommentModal(true)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <MessageCircle className="w-7 h-7" />
                  </button>
                  <button className="p-1 hover:scale-110 transition-transform">
                    <Send className="w-7 h-7" />
                  </button>
                </div>
                <button className="p-1 hover:scale-110 transition-transform">
                  {post?.isSaved ? (
                    <BookmarkFill className="w-7 h-7 text-blue-600" />
                  ) : (
                    <Bookmark className="w-7 h-7" />
                  )}
                </button>
              </div>
              <p className="font-semibold">{post?.likesCount} likes</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatDistanceToNow(new Date(post?.createdAt), { addSuffix: true })}
              </p>
            </div>

            {/* Add Comment */}
            <div className="pt-3">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 text-sm outline-none px-2 py-1"
                  onClick={() => setShowCommentModal(true)}
                />
                <button 
                  onClick={() => setShowCommentModal(true)}
                  className="text-blue-500 hover:text-blue-700 font-medium text-sm"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && post && (
        <CommentModal
          post={post}
          onClose={() => setShowCommentModal(false)}
        />
      )}
    </div>
  )
}

export default PostDetail