import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { postAPI, userAPI } from "../utils/api";
import CreatePost from '../components/posts/CreatePost';
import Post from '../components/posts/Post';
import Loader from '../components/common/Loader';
import { FaPlus, FaSearch, FaUserPlus, FaFire, FaUsers } from 'react-icons/fa';

const HomePage = () => {
    const { user, showToast } = useAuth();
    const { socket, onlineUsers, toggleLikePost, toggleFollow } = useSocket();
    const [posts, setPosts] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchFeed();
        fetchSuggestedUsers();

        // Listen for socket events
        if (socket) {
            socket.on('postLiked', handlePostLiked);
            socket.on('postCommented', handlePostCommented);
            socket.on('newPostCreated', handleNewPostFromSocket);
            socket.on('followUpdated', handleFollowUpdated);

            return () => {
                socket.off('postLiked', handlePostLiked);
                socket.off('postCommented', handlePostCommented);
                socket.off('newPostCreated', handleNewPostFromSocket);
                socket.off('followUpdated', handleFollowUpdated);
            };
        }
    }, []);

    const fetchFeed = async () => {
        try {
            const response = await postAPI.getFeedPosts(page, 10);
            if (response.data.success) {
                setPosts(response.data.posts || []);
                setHasMore(response.data.posts.length === 10);
            }
        } catch (error) {
            console.error('Error fetching feed:', error);
            showToast('Failed to load feed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestedUsers = async () => {
        try {
            const response = await userAPI.getSuggestedUsers();
            if (response.data.success) {
                setSuggestedUsers(response.data.users || []);
            }
        } catch (error) {
            console.error('Error fetching suggested users:', error);
        }
    };

    // In HomePage.jsx
    const handleLike = async (postId) => {
        try {
            // Optimistic update
            setPosts(prev => prev.map(post =>
                post._id === postId
                    ? {
                        ...post,
                        likes: [...(post.likes || []), user._id],
                        likesCount: (post.likesCount || 0) + 1,
                        isLiked: true
                    }
                    : post
            ));

            // Send via socket (CORRECTED)
            toggleLikePost(postId); // Only pass postId

            // Also call API
            await postAPI.toggleLikePost(postId);

        } catch (error) {
            console.error('Error liking post:', error);
            showToast('Failed to like post', 'error');
        }
    };

    const handleFollow = async (userId) => {
        try {
            // Optimistic update
            setSuggestedUsers(prev => prev.map(u =>
                u._id === userId
                    ? { ...u, isFollowing: true, followersCount: (u.followersCount || 0) + 1 }
                    : u
            ));

            // Send via socket (CORRECTED)
            toggleFollow(userId); // Only pass userId

            // Also call API
            await userAPI.followUser(userId);

            showToast('Followed successfully', 'success');
        } catch (error) {
            console.error('Error following user:', error);
            showToast('Failed to follow user', 'error');
        }
    };
    const handleUnfollow = async (userId) => {
        try {
            setSuggestedUsers(prev => prev.map(u =>
                u._id === userId
                    ? { ...u, isFollowing: false, followersCount: Math.max(0, (u.followersCount || 1) - 1) }
                    : u
            ));

            await userAPI.unfollowUser(userId);
            showToast('Unfollowed successfully', 'info');
        } catch (error) {
            console.error('Error unfollowing user:', error);
            showToast('Failed to unfollow user', 'error');
        }
    };

    const handleNewPostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev]);
        setShowCreatePost(false);
        showToast('Post created successfully', 'success');
    };

    // Socket event handlers
    const handlePostLiked = (data) => {
        setPosts(prev => prev.map(post =>
            post._id === data.postId
                ? { ...post, likesCount: data.likesCount }
                : post
        ));
    };

    const handlePostCommented = (data) => {
        setPosts(prev => prev.map(post =>
            post._id === data.postId
                ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
                : post
        ));
    };

    const handleNewPostFromSocket = (postData) => {
        if (postData.user._id !== user._id) {
            setPosts(prev => [postData, ...prev]);
        }
    };

    const handleFollowUpdated = (data) => {
        if (data.targetUserId === user._id) {
            // Someone followed/unfollowed current user
            showToast(`${data.following ? 'Started following you' : 'Unfollowed you'}`,
                data.following ? 'success' : 'info');
        }
    };

    const loadMore = async () => {
        if (!hasMore || loading) return;

        setPage(prev => prev + 1);
        try {
            const response = await postAPI.getFeedPosts(page + 1, 10);
            if (response.data.success) {
                setPosts(prev => [...prev, ...response.data.posts]);
                setHasMore(response.data.posts.length === 10);
            }
        } catch (error) {
            console.error('Error loading more posts:', error);
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Home Feed</h1>
                    <p className="text-gray-600">Discover posts from people you follow</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreatePost(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 font-medium"
                    >
                        <FaPlus />
                        <span>Create Post</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Feed - 2/3 width */}
                <div className="lg:w-2/3">
                    {posts.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
                                <FaUsers className="text-4xl text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No posts yet</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Follow some users or create your first post to see content here!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => setShowCreatePost(true)}
                                    className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                >
                                    Create Your First Post
                                </button>
                                <a
                                    href="/explore"
                                    className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Explore Posts
                                </a>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-6">
                                {posts.map(post => (
                                    <Post
                                        key={post._id}
                                        post={post}
                                        onLike={handleLike}
                                        currentUser={user}
                                        socket={socket}
                                    />
                                ))}
                            </div>

                            {hasMore && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={loadMore}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors font-medium"
                                    >
                                        Load More Posts
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar - 1/3 width */}
                <div className="lg:w-1/3 space-y-6">
                    {/* User Stats Card */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="relative">
                                <img
                                    src={user?.profilePicture || '/default-avatar.png'}
                                    alt={user?.username}
                                    className="w-16 h-16 rounded-full border-4 border-white shadow"
                                    onError={(e) => {
                                        e.target.src = '/default-avatar.png';
                                    }}
                                />
                                {onlineUsers.includes(user?._id) && (
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{user?.username}</h3>
                                <p className="text-sm text-gray-500">{user?.fullName}</p>
                                <div className="flex space-x-4 mt-2">
                                    <div className="text-center">
                                        <div className="font-bold">{user?.followersCount || 0}</div>
                                        <div className="text-xs text-gray-500">Followers</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold">{user?.followingCount || 0}</div>
                                        <div className="text-xs text-gray-500">Following</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold">{user?.postsCount || 0}</div>
                                        <div className="text-xs text-gray-500">Posts</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a
                            href={`/profile/${user?.username}`}
                            className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                        >
                            View Profile
                        </a>
                    </div>

                    {/* Suggested Users */}
                    {suggestedUsers.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center">
                                    <FaUserPlus className="mr-2 text-primary" />
                                    Suggested For You
                                </h3>
                                <span className="text-sm text-gray-500">
                                    {suggestedUsers.length} users
                                </span>
                            </div>
                            <div className="space-y-4">
                                {suggestedUsers.map(suggestedUser => (
                                    <div key={suggestedUser._id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <img
                                                    src={suggestedUser.profilePicture || '/default-avatar.png'}
                                                    alt={suggestedUser.username}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                {onlineUsers.includes(suggestedUser._id) && (
                                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm text-gray-900">
                                                    {suggestedUser.username}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {suggestedUser.followersCount || 0} followers
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                suggestedUser.isFollowing
                                                    ? handleUnfollow(suggestedUser._id)
                                                    : handleFollow(suggestedUser._id)
                                            }
                                            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${suggestedUser.isFollowing
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                : 'bg-primary text-white hover:bg-primary/90'
                                                }`}
                                        >
                                            {suggestedUser.isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trending */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                            <FaFire className="mr-2 text-orange-500" />
                            Trending Now
                        </h3>
                        <div className="space-y-3">
                            {['#webdev', '#reactjs', '#javascript', '#programming', '#design'].map((tag, index) => (
                                <a
                                    key={tag}
                                    href={`/explore?tag=${tag.substring(1)}`}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-gray-400 text-sm font-medium w-6 text-center">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <h4 className="font-medium text-sm group-hover:text-primary">
                                                {tag}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {Math.floor(Math.random() * 1000) + 500} posts
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-primary font-medium">
                                        Trending
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Online Users */}
                    {onlineUsers.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Online Now</h3>
                            <div className="flex flex-wrap gap-2">
                                {onlineUsers.slice(0, 10).map(userId => {
                                    const onlineUser = suggestedUsers.find(u => u._id === userId) ||
                                        { _id: userId, profilePicture: '/default-avatar.png' };
                                    return (
                                        <div key={onlineUser._id} className="relative group" title={onlineUser.username}>
                                            <img
                                                src={onlineUser.profilePicture || '/default-avatar.png'}
                                                alt={onlineUser.username || 'User'}
                                                className="w-10 h-10 rounded-full border-2 border-green-500"
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        </div>
                                    );
                                })}
                                {onlineUsers.length > 10 && (
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                                        +{onlineUsers.length - 10}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Post Modal */}
            {showCreatePost && (
                <CreatePost
                    onClose={() => setShowCreatePost(false)}
                    onSuccess={handleNewPostCreated}
                />
            )}
        </div>
    );
};

export default HomePage;