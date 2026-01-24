import React, { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, Grid3x3, Loader } from 'lucide-react'
import postService from '../services/post.service'
import PostCard from '../components/posts/PostCard'

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['explore-posts'],
    queryFn: ({ pageParam = 1 }) => postService.getExplorePosts(pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.posts.length < 20) return undefined
      return lastPage.page + 1
    },
  })

  const handleSearch = async (e) => {
    e.preventDefault()
    // Implement search functionality
  }

  const posts = data?.pages.flatMap(page => page.posts) || []

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, people, or tags"
            className="input-field pl-12"
          />
        </form>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <Grid3x3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No posts to explore</h3>
          <p className="text-gray-600">Follow more people to see their posts here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div key={post._id} className="aspect-square relative group">
              <img
                src={post.media[0]}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="font-semibold">{post.user.username}</p>
                  <p className="text-sm">{post.caption?.substring(0, 50)}...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  )
}

export default Explore