import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, postAPI } from '../utils/api';
import { FaSearch, FaUser, FaHashtag, FaImage } from 'react-icons/fa';

const SearchPage = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchQuery.trim()) {
            handleSearch();
        }
    }, [searchQuery]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            // Search users
            const usersResponse = await userAPI.searchUsers(searchQuery);
            if (usersResponse.data.success) {
                setUsers(usersResponse.data.users || []);
            }

            // Search posts
            const postsResponse = await postAPI.searchPosts(searchQuery);
            if (postsResponse.data.success) {
                setPosts(postsResponse.data.posts || []);
            }

            // Mock hashtags (replace with actual API call)
            setHashtags([
                { tag: '#webdev', count: 1254 },
                { tag: '#reactjs', count: 894 },
                { tag: '#programming', count: 2345 },
                { tag: '#socialmedia', count: 567 },
            ]);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'all', label: 'All', icon: <FaSearch /> },
        { id: 'users', label: 'Users', icon: <FaUser /> },
        { id: 'tags', label: 'Tags', icon: <FaHashtag /> },
        { id: 'posts', label: 'Posts', icon: <FaImage /> },
    ];

    const renderContent = () => {
        if (!searchQuery.trim()) {
            return (
                <div className="text-center py-12">
                    <FaSearch className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Search for users, posts, or hashtags</h3>
                    <p className="text-gray-500">Enter keywords in the search bar above</p>
                </div>
            );
        }

        if (loading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            );
        }

        switch (activeTab) {
            case 'users':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.map((user) => (
                            <div key={user._id} className="bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3">
                                <img
                                    src={user.profilePicture || '/default-avatar.png'}
                                    alt={user.username}
                                    className="w-12 h-12 rounded-full"
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold">{user.username}</h4>
                                    <p className="text-sm text-gray-500">{user.fullName}</p>
                                </div>
                                <button className="px-4 py-1 bg-primary text-white rounded-full text-sm hover:bg-primary/90 transition-colors">
                                    Follow
                                </button>
                            </div>
                        ))}
                    </div>
                );

            case 'tags':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {hashtags.map((hashtag, index) => (
                            <a
                                key={index}
                                href={`/explore?tag=${hashtag.tag.substring(1)}`}
                                className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition-shadow"
                            >
                                <FaHashtag className="text-3xl text-primary mx-auto mb-2" />
                                <h4 className="font-semibold">{hashtag.tag}</h4>
                                <p className="text-sm text-gray-500">{hashtag.count.toLocaleString()} posts</p>
                            </a>
                        ))}
                    </div>
                );

            case 'posts':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {posts.map((post) => (
                            <div key={post._id} className="relative group overflow-hidden rounded-xl">
                                <img
                                    src={post.media?.[0] || '/placeholder-image.jpg'}
                                    alt={post.caption}
                                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex items-center space-x-4 text-white">
                                        <div className="flex items-center space-x-1">
                                            <FaSearch className="text-xl" />
                                            <span>{post.likesCount || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default: // 'all'
                return (
                    <div className="space-y-6">
                        {/* Users Section */}
                        {users.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Users</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {users.slice(0, 4).map((user) => (
                                        <div key={user._id} className="bg-white rounded-xl p-3 flex items-center space-x-3">
                                            <img
                                                src={user.profilePicture || '/default-avatar.png'}
                                                alt={user.username}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-medium">{user.username}</h4>
                                                <p className="text-xs text-gray-500">{user.fullName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Posts Section */}
                        {posts.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Posts</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {posts.slice(0, 6).map((post) => (
                                        <div key={post._id} className="aspect-square">
                                            <img
                                                src={post.media?.[0] || '/placeholder-image.jpg'}
                                                alt=""
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hashtags Section */}
                        {hashtags.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hashtags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {hashtags.map((hashtag, index) => (
                                        <a
                                            key={index}
                                            href={`/explore?tag=${hashtag.tag.substring(1)}`}
                                            className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                        >
                                            {hashtag.tag}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Search Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Search</h1>

                {/* Search Input */}
                <div className="relative max-w-2xl">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users, hashtags, posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary text-primary font-medium'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {renderContent()}
        </div>
    );
};

export default SearchPage;