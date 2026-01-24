import React, { useState } from 'react'
import { X, Send, Heart } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import postService from '../../services/post.service'
import { formatDistanceToNow } from 'date-fns'

const CommentModal = ({ post, onClose }) => {
  const [comment, setComment] = useState('')
  const queryClient = useQueryClient()

  const { data: comments } = useQuery({
    queryKey: ['post-comments', post._id],
    queryFn: () => postService.getPostComments(post._id),
  })

  const addCommentMutation = useMutation({
    mutationFn: () => postService.addComment(post._id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries(['post-comments', post._id])
      setComment('')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (comment.trim()) {
      addCommentMutation.mutate()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Comments</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-4 border-b">
          <div className="flex items-start space-x-3">
            <img
              src={post.media[0]}
              alt=""
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <p className="font-medium">{post.user.username}</p>
              <p className="text-gray-600 text-sm">{post.caption}</p>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments?.comments?.map((comment) => (
            <div key={comment._id} className="flex items-start space-x-3">
              <img
                src={comment.user.profilePicture}
                alt={comment.user.username}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{comment.user.username}</p>
                    <button className="text-gray-400 hover:text-red-500">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <div className="flex items-center space-x-4 mt-1 px-4">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                  <button className="text-xs text-gray-500 hover:text-gray-700">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Comment */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={!comment.trim() || addCommentMutation.isLoading}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CommentModal