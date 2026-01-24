import React, { useState, useEffect } from 'react'
import { Search, UserPlus, UserCheck, Loader } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import userService from '../../services/user.service'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search-users', debouncedSearch],
    queryFn: () => userService.searchUsers(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  })

  const followMutation = useMutation({
    mutationFn: (userId) => userService.followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['search-users', debouncedSearch])
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: (userId) => userService.unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['search-users', debouncedSearch])
    },
  })

  const handleFollow = (userId, isFollowing) => {
    if (isFollowing) {
      unfollowMutation.mutate(userId)
    } else {
      followMutation.mutate(userId)
    }
  }

  const users = searchResults?.users || []

  return (
    <div className="mb-6">
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users..."
          className="input-field pl-12"
        />
      </div>

      {isLoading && debouncedSearch && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}

      {!isLoading && debouncedSearch && users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found</p>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
            >
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center space-x-3 flex-1"
              >
                <img
                  src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.username}</p>
                  <p className="text-sm text-gray-500 truncate">{user.fullName}</p>
                  <p className="text-xs text-gray-400">
                    {user.followersCount} followers • {user.followingCount} following
                  </p>
                </div>
              </Link>

              {user._id !== currentUser?._id && (
                <button
                  onClick={() => handleFollow(user._id, user.isFollowing)}
                  disabled={followMutation.isLoading || unfollowMutation.isLoading}
                  className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                    user.isFollowing
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 inline mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 inline mr-2" />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserSearch