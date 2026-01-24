import React, { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader } from 'lucide-react'
import postService from '../services/post.service'
import PostCard from '../components/posts/PostCard'
import CreatePost from '../components/posts/CreatePost'

const Home = () => {
  const [showCreatePost, setShowCreatePost] = useState(false)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['feed-posts'],
    queryFn: ({ pageParam = 1 }) => postService.getFeedPosts(pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.posts.length < 10) return undefined
      return lastPage.page + 1
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load posts</p>
      </div>
    )
  }

  const posts = data?.pages.flatMap(page => page.posts) || []

  return (
    <div>
      {/* Create Post Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 text-left"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
            <span className="text-gray-500">What's on your mind?</span>
          </div>
        </button>
      </div>

      {/* Posts */}
      <div>
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet. Follow people to see their posts!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="text-center my-8">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="btn-secondary px-6"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost onClose={() => setShowCreatePost(false)} />
      )}
    </div>
  )
}

export default Home