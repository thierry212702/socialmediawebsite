import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  User, 
  Settings, 
  Grid3x3, 
  Bookmark, 
  Users,
  Camera,
  Mail,
  Link,
  MapPin,
  Calendar,
  Edit2,
  Check
} from 'lucide-react'
import { format } from 'date-fns'
import userService from '../services/user.service'
import postService from '../services/post.service'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

const Profile = () => {
  const { username } = useParams()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('posts')
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioText, setBioText] = useState('')

  const isOwnProfile = !username || username === currentUser?.username

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username || currentUser?.username],
    queryFn: () => 
      isOwnProfile 
        ? userService.getUserProfile('me')
        : userService.getUserByUsername(username),
    enabled: !!currentUser,
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', username || currentUser?.username],
    queryFn: () => postService.getUserPosts(username || currentUser?.username),
    enabled: !!(username || currentUser?.username),
  })

  const followMutation = useMutation({
    mutationFn: () => 
      profileData?.profile.isFollowing 
        ? userService.unfollowUser(profileData.profile._id)
        : userService.followUser(profileData.profile._id),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile', username || currentUser?.username])
      toast.success(profileData?.profile.isFollowing ? 'Unfollowed' : 'Followed')
    },
    onError: () => {
      toast.error('Operation failed')
    },
  })

  const updateBioMutation = useMutation({
    mutationFn: (bio) => 
      userService.updateUserSettings({ bio }),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile', username || currentUser?.username])
      setIsEditingBio(false)
      toast.success('Bio updated')
    },
  })

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Profile not found</p>
      </div>
    )
  }

  const profile = profileData.profile || profileData.user
  const posts = postsData?.posts || []

  const handleFollow = () => {
    if (!profile.isOwnProfile) {
      followMutation.mutate()
    }
  }

  const handleSaveBio = () => {
    if (bioText.trim()) {
      updateBioMutation.mutate(bioText)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
          {/* Profile Picture */}
          <div className="relative mb-4 md:mb-0">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.username}&size=128&background=random`}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            </div>
            {isOwnProfile && (
              <button className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-4">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <div className="flex items-center space-x-3 mt-2 md:mt-0">
                {isOwnProfile ? (
                  <>
                    <button className="btn-secondary">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                    <button className="btn-secondary">
                      <Settings className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`px-6 py-2 rounded-lg font-medium ${
                        profile.isFollowing
                          ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={followMutation.isLoading}
                    >
                      {followMutation.isLoading ? (
                        '...'
                      ) : profile.isFollowing ? (
                        'Following'
                      ) : (
                        'Follow'
                      )}
                    </button>
                    <button className="btn-secondary">
                      <Mail className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex space-x-8 mb-4">
              <div className="text-center">
                <p className="font-bold text-lg">{profile.postsCount}</p>
                <p className="text-gray-600 text-sm">Posts</p>
              </div>
              <button className="text-center hover:text-blue-600">
                <p className="font-bold text-lg">{profile.followersCount}</p>
                <p className="text-gray-600 text-sm">Followers</p>
              </button>
              <button className="text-center hover:text-blue-600">
                <p className="font-bold text-lg">{profile.followingCount}</p>
                <p className="text-gray-600 text-sm">Following</p>
              </button>
            </div>

            {/* Bio & Details */}
            <div className="space-y-2">
              <div>
                <p className="font-semibold">{profile.fullName}</p>
                {isEditingBio ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="text"
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      className="input-field flex-1"
                      placeholder="Add your bio"
                    />
                    <button
                      onClick={handleSaveBio}
                      className="btn-primary"
                      disabled={updateBioMutation.isLoading}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsEditingBio(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="text-gray-700 mt-1">
                      {profile.bio || 'No bio yet'}
                    </p>
                    {isOwnProfile && !profile.bio && (
                      <button
                        onClick={() => setIsEditingBio(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Add bio
                      </button>
                    )}
                  </div>
                )}
              </div>

              {profile.website && (
                <div className="flex items-center text-blue-600">
                  <Link className="w-4 h-4 mr-2" />
                  <a 
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}

              {profile.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{profile.location}</span>
                </div>
              )}

              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center py-3 px-1 border-b-2 font-medium ${
              activeTab === 'posts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid3x3 className="w-5 h-5 mr-2" />
            Posts
          </button>
          
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center py-3 px-1 border-b-2 font-medium ${
                activeTab === 'saved'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bookmark className="w-5 h-5 mr-2" />
              Saved
            </button>
          )}

          <button
            onClick={() => setActiveTab('tagged')}
            className={`flex items-center py-3 px-1 border-b-2 font-medium ${
              activeTab === 'tagged'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-5 h-5 mr-2" />
            Tagged
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'posts' && (
        <div>
          {postsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
              <p className="text-gray-600">
                {isOwnProfile 
                  ? 'Share your first post!' 
                  : `${profile.username} hasn't posted anything yet.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
              {posts.map((post) => (
                <div 
                  key={post._id}
                  className="aspect-square relative group cursor-pointer"
                >
                  <img
                    src={post.media[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Heart className="w-5 h-5 mr-1" />
                        <span>{post.likesCount}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-5 h-5 mr-1" />
                        <span>{post.commentsCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Profile