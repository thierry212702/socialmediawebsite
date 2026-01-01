import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, postAPI } from '../utils/api';
import { FaEdit, FaCamera, FaUserPlus, FaCheck, FaEllipsisH, FaTh, FaVideo, FaBookmark, FaTag } from 'react-icons/fa';

const ProfilePage = () => {
    const { username } = useParams();
    const { user: currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [username]);

    const fetchProfile = async () => {
        try {
            setLoading(true);

            // Get user by username
            const userResponse = await userAPI.getUserByUsername(username);
            if (userResponse.data.success) {
                const userData = userResponse.data.user;
                setProfileUser(userData);
                setIsFollowing(userData.isFollowing);

                // Fetch user posts
                const postsResponse = await postAPI.getUserPosts(username);
                if (postsResponse.data.success) {
                    setPosts(postsResponse.data.posts || []);
                } else {
                    // Use mock data if endpoint fails
                    setPosts([
                        {
                            _id: '1',
                            user: userData,
                            caption: 'Welcome to my profile!',
                            media: ['https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500'],
                            likesCount: 42,
                            commentsCount: 5,
                            createdAt: new Date().toISOString(),
                        },
                    ]);
                }
            } else {
                console.error('User not found:', username);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!profileUser) return;

        try {
            if (isFollowing) {
                const response = await userAPI.unfollowUser(profileUser._id);
                if (response.data.success) {
                    setIsFollowing(false);
                    setProfileUser(prev => ({
                        ...prev,
                        followersCount: response.data.followersCount
                    }));
                }
            } else {
                const response = await userAPI.followUser(profileUser._id);
                if (response.data.success) {
                    setIsFollowing(true);
                    setProfileUser(prev => ({
                        ...prev,
                        followersCount: response.data.followersCount
                    }));
                }
            }
        } catch (error) {
            console.error('Error following/unfollowing user:', error);
        }
    };

    if (loading || !profileUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const isOwnProfile = profileUser._id === currentUser?._id;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-start space-x-6">
                    {/* Profile Picture */}
                    <div className="relative">
                        <img
                            src={profileUser.profilePicture || '/default-avatar.png'}
                            alt={profileUser.username}
                            className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                            onError={(e) => e.target.src = '/default-avatar.png'}
                        />
                        {isOwnProfile && (
                            <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-colors">
                                <FaCamera />
                            </button>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold">{profileUser.username || 'Unknown'}</h1>
                                <p className="text-gray-600">{profileUser.fullName || 'No Name'}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                {isOwnProfile ? (
                                    <>
                                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                                            <FaEdit />
                                            <span>Edit Profile</span>
                                        </button>
                                        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            <FaEllipsisH />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleFollow}
                                            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${isFollowing
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'bg-primary text-white hover:bg-primary/90'
                                                }`}
                                        >
                                            {isFollowing ? <FaCheck /> : <FaUserPlus />}
                                            <span>{isFollowing ? 'Following' : 'Follow'}</span>
                                        </button>
                                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                            Message
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex space-x-8 mb-4">
                            <div className="text-center">
                                <span className="block text-xl font-bold">{posts.length}</span>
                                <span className="text-gray-600">Posts</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xl font-bold">{profileUser.followersCount || 0}</span>
                                <span className="text-gray-600">Followers</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xl font-bold">{profileUser.followingCount || 0}</span>
                                <span className="text-gray-600">Following</span>
                            </div>
                        </div>

                        {/* Bio */}
                        {profileUser.bio && (
                            <div className="mb-3">
                                <p className="text-gray-800">{profileUser.bio}</p>
                            </div>
                        )}

                        {/* Website */}
                        {profileUser.website && (
                            <div>
                                <a
                                    href={profileUser.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {profileUser.website}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${activeTab === 'posts'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <FaTh />
                        <span>Posts</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('reels')}
                        className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${activeTab === 'reels'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <FaVideo />
                        <span>Reels</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${activeTab === 'saved'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <FaBookmark />
                        <span>Saved</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('tagged')}
                        className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${activeTab === 'tagged'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <FaTag />
                        <span>Tagged</span>
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            {activeTab === 'posts' && (
                <div>
                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h3>
                            <p className="text-gray-500">
                                {isOwnProfile ? 'Create your first post!' : 'This user has no posts yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1">
                            {posts.map(post => (
                                <div key={post._id} className="aspect-square relative group cursor-pointer">
                                    <img
                                        src={post.media?.[0] || '/placeholder-image.jpg'}
                                        alt="Post"
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.src = '/placeholder-image.jpg'}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="flex items-center space-x-4 text-white">
                                            <div className="flex items-center space-x-1">
                                                <FaCheck className="text-xl" />
                                                <span>{post.likesCount || 0}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <FaTh className="text-xl" />
                                                <span>{post.commentsCount || 0}</span>
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
    );
};

export default ProfilePage;