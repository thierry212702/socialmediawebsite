import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../utils/api';
import { FaSearch, FaHeart, FaComment, FaShare } from 'react-icons/fa';

const ExplorePage = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [trendingHashtags, setTrendingHashtags] = useState([
        '#webdev', '#reactjs', '#programming', '#design', '#socialmedia',
        '#javascript', '#coding', '#developer', '#uiux', '#tech'
    ]);

    useEffect(() => {
        fetchExplorePosts();
    }, []);

    const fetchExplorePosts = async () => {
        try {
            const response = await postAPI.getExplorePosts();
            if (response.data.success) {
                setPosts(response.data.posts || []);
            }
        } catch (error) {
            console.error('Error fetching explore posts:', error);
            // Mock data for testing
            setPosts([
                {
                    _id: '1',
                    user: { username: 'webdev', profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg' },
                    caption: 'Beautiful UI design!',
                    media: ['https://images.unsplash.com/photo-1558655146-364adaf1fcc9'],
                    likesCount: 245,
                    commentsCount: 12,
                    createdAt: new Date().toISOString(),
                },
                {
                    _id: '2',
                    user: { username: 'designer', profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg' },
                    caption: 'React is awesome!',
                    media: ['https://images.unsplash.com/photo-1555099962-4199c345e5dd'],
                    likesCount: 189,
                    commentsCount: 8,
                    createdAt: new Date().toISOString(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (postId) => {
        try {
            await postAPI.toggleLikePost(postId);
            setPosts(prev => prev.map(post =>
                post._id === postId
                    ? { ...post, likesCount: post.likesCount + 1, isLiked: true }
                    : post
            ));
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Explore</h1>
                <p className="text-gray-600">Discover amazing content from creators worldwide</p>

                {/* Search Bar */}
                <div className="relative max-w-xl mt-6">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search posts, hashtags, users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
            </div>

            {/* Trending Hashtags */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Trending Now</h2>
                <div className="flex flex-wrap gap-3">
                    {trendingHashtags.map((tag, index) => (
                        <a
                            key={index}
                            href={`/explore?tag=${tag.substring(1)}`}
                            className="px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        >
                            {tag}
                        </a>
                    ))}
                </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts.map((post) => (
                    <div key={post._id} className="group relative overflow-hidden rounded-xl cursor-pointer">
                        <img
                            src={post.media[0] || '/placeholder-image.jpg'}
                            alt={post.caption}
                            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex items-center space-x-6 text-white">
                                <div className="flex items-center space-x-2">
                                    <FaHeart className="text-xl" />
                                    <span>{post.likesCount}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FaComment className="text-xl" />
                                    <span>{post.commentsCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Suggested Users */}
            <div className="mt-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Popular Creators</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="text-center">
                            <div className="w-20 h-20 mx-auto mb-2">
                                <img
                                    src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i}.jpg`}
                                    alt={`User ${i}`}
                                    className="w-full h-full rounded-full border-4 border-white shadow-lg"
                                />
                            </div>
                            <h3 className="font-medium text-gray-900">user{i}</h3>
                            <p className="text-sm text-gray-500">Web Developer</p>
                            <button className="mt-2 px-4 py-1 bg-primary text-white text-sm rounded-full hover:bg-primary/90 transition-colors">
                                Follow
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExplorePage;