import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Image, Video, Upload, Smile, MapPin, Hash, Send } from 'lucide-react'
import postService from '../../services/post.service'
import { toast } from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'

const PostForm = ({ onSuccess }) => {
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [tags, setTags] = useState('')
  const [media, setMedia] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const queryClient = useQueryClient()

  const onDrop = useCallback((acceptedFiles) => {
    const newMedia = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    )
    setMedia(prev => [...prev, ...newMedia])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    multiple: true
  })

  const removeMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const handleEmojiClick = (emojiData) => {
    setCaption(prev => prev + emojiData.emoji)
  }

  const createPostMutation = useMutation({
    mutationFn: (formData) => postService.createPost(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] })
      queryClient.invalidateQueries({ queryKey: ['user-posts'] })
      toast.success('Post created successfully!')
      onSuccess?.()
    },
    onError: (error) => {
      console.error('Create post error:', error)
      toast.error(error.response?.data?.error || 'Failed to create post')
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (media.length === 0) {
      toast.error('Please add at least one media file')
      return
    }

    const formData = new FormData()
    formData.append('caption', caption)
    formData.append('location', location)
    formData.append('tags', tags)
    
    media.forEach(file => {
      formData.append('media', file)
    })

    createPostMutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="space-y-6">
        {/* Media Upload */}
        <div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-gray-500 mb-4">or click to select files</p>
            <p className="text-sm text-gray-400">
              Supports images and videos
            </p>
          </div>

          {/* Media Preview */}
          {media.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">
                {media.length} file{media.length > 1 ? 's' : ''} selected
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {media.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.type.startsWith('image') ? (
                      <img
                        src={file.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={file.preview}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Caption Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Caption
          </label>
          <div className="relative">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="input-field min-h-[120px] resize-none pr-10"
              rows="4"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute bottom-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <Smile className="w-5 h-5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-10">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Add Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location"
            className="input-field"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Hash className="w-4 h-4 inline mr-2" />
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="input-field"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={createPostMutation.isLoading || media.length === 0}
          className="btn-primary w-full py-3 flex items-center justify-center"
        >
          {createPostMutation.isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Posting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Post
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default PostForm