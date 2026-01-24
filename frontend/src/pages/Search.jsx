// File: src/pages/Search.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, Users, Hash, MapPin, Image, Video, Filter,
  Clock, TrendingUp, X, Loader2, Globe, UserCheck,
  MessageSquare, Heart, Share2, Bookmark, Play
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import postService from '../services/post.service';
import userService from '../services/user.service';
import { useDebounce } from '../hooks/useDebounce';
import { formatDistanceToNow } from 'date-fns';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    type: 'all',
    date: 'all',
    sort: 'relevance'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);

  const debouncedQuery = useDebounce(query, 500);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Update URL when query changes
  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
    }
  }, [debouncedQuery, setSearchParams]);

  // Search for users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['search-users', debouncedQuery],
    queryFn: () => userService.searchUsers(debouncedQuery),
    enabled: debouncedQuery.length > 0 && (activeTab === 'all' || activeTab === 'users'),
  });

  // Search for posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['search-posts', debouncedQuery, filters],
    queryFn: () => postService.searchPosts(debouncedQuery),
    enabled: debouncedQuery.length > 0 && (activeTab === 'all' || activeTab === 'posts'),
  });

  // Handle search
  const handleSearch = useCallback((searchQuery) => {
    if (searchQuery.trim()) {
      setQuery(searchQuery);
      
      // Add to search history
      const newHistory = [
        searchQuery,
        ...searchHistory.filter(item => item !== searchQuery)
      ].slice(0, 10);
      
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  }, [searchHistory]);

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setSearchParams({});
  };

  // Trending searches (mock data)
  useEffect(() => {
    const mockTrending = [
      { query: '#SocialMedia', count: 12500, type: 'hashtag' },
      { query: 'Web Development', count: 8900, type: 'topic' },
      { query: '@ReactJS', count: 7600, type: 'user' },
      { query: '#JavaScript', count: 5400, type: 'hashtag' },
      { query: 'UI/UX Design', count: 4200, type: 'topic' },
    ];
    setTrendingSearches(mockTrending);
  }, []);

  const users = usersData?.users || usersData || [];
  const posts = postsData?.posts || postsData || [];

  const isLoading = usersLoading || postsLoading;
  const hasResults = users.length > 0 || posts.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-accent-50/30">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search users, posts, hashtags, locations..."
              className="w-full pl-12 pr-12 py-3 bg-white dark:bg-neutral-900 
                       border border-neutral-200 dark:border-neutral-800 
                       rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                       outline-none text-lg"
              autoFocus
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === 'users'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === 'posts'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                <Image className="w-4 h-4 inline mr-2" />
                Posts
              </button>
              <button
                onClick={() => setActiveTab('hashtags')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === 'hashtags'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                <Hash className="w-4 h-4 inline mr-2" />
                Hashtags
              </button>
              <button
                onClick={() => setActiveTab('locations')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === 'locations'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                Locations
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="input-field"
                  >
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="text">Text Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <select
                    value={filters.date}
                    onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                    className="input-field"
                  >
                    <option value="all">Any Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                    className="input-field"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Results */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : query ? (
              hasResults ? (
                <div className="space-y-6">
                  {/* Users Results */}
                  {(activeTab === 'all' || activeTab === 'users') && users.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-primary-500" />
                        Users ({users.length})
                      </h3>
                      <div className="space-y-3">
                        {users.slice(0, 5).map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                alt={user.username}
                                className="w-12 h-12 rounded-full"
                              />
                              <div>
                                <p className="font-bold">{user.username}</p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {user.fullName}
                                </p>
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className="text-xs text-neutral-500">
                                    {user.followersCount || 0} followers
                                  </span>
                                  <span className="text-xs text-neutral-500">
                                    {user.postsCount || 0} posts
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium">
                              Follow
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts Results */}
                  {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Image className="w-5 h-5 mr-2 text-primary-500" />
                        Posts ({posts.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {posts.slice(0, 6).map((post) => (
                          <div
                            key={post._id}
                            className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => navigate(`/post/${post._id}`)}
                          >
                            {post.media?.[0] ? (
                              <div className="relative aspect-square">
                                {post.mediaType === 'video' ? (
                                  <>
                                    <img
                                      src={post.thumbnail || post.media[0]}
                                      alt={post.caption}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                      <Play className="w-3 h-3 inline mr-1" />
                                      Video
                                    </div>
                                  </>
                                ) : (
                                  <img
                                    src={post.media[0]}
                                    alt={post.caption}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="aspect-square bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
                                <Image className="w-12 h-12 text-primary-500" />
                              </div>
                            )}
                            <div className="p-4">
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                {post.caption}
                              </p>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center space-x-4 text-xs text-neutral-500">
                                  <span className="flex items-center">
                                    <Heart className="w-3 h-3 mr-1" />
                                    {post.likesCount || 0}
                                  </span>
                                  <span className="flex items-center">
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    {post.commentsCount || 0}
                                  </span>
                                </div>
                                <span className="text-xs text-neutral-500">
                                  {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {!hasResults && (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 mx-auto mb-6 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                        <Search className="w-12 h-12 text-neutral-400" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">No Results Found</h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Try different keywords or check your spelling
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                    <Search className="w-12 h-12 text-neutral-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Results Found</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Try different keywords or check your spelling
                  </p>
                </div>
              )
            ) : (
              /* Empty State - Show suggestions */
              <div className="space-y-8">
                {/* Search History */}
                {searchHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-neutral-500" />
                      Recent Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(item)}
                          className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center"
                        >
                          <Search className="w-4 h-4 mr-2 text-neutral-400" />
                          {item}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setSearchHistory([]);
                          localStorage.removeItem('searchHistory');
                        }}
                        className="px-4 py-2 text-danger-600 hover:text-danger-700 text-sm"
                      >
                        Clear History
                      </button>
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-accent-500" />
                    Trending Now
                  </h3>
                  <div className="space-y-3">
                    {trendingSearches.map((trend, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(trend.query)}
                        className="w-full flex items-center justify-between p-3 hover:bg-white dark:hover:bg-neutral-800 rounded-xl transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{trend.query}</p>
                            <p className="text-sm text-neutral-500">
                              {trend.count.toLocaleString()} searches
                            </p>
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded">
                          {trend.type}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Tips */}
                <div className="card">
                  <h3 className="text-lg font-bold mb-4">Search Tips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <Users className="w-8 h-8 text-primary-500 mb-2" />
                      <p className="font-medium">Find Users</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Search by username or full name
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <Hash className="w-8 h-8 text-secondary-500 mb-2" />
                      <p className="font-medium">Explore Hashtags</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Start with # to search hashtags
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <MapPin className="w-8 h-8 text-accent-500 mb-2" />
                      <p className="font-medium">Discover Locations</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Search posts by location
                      </p>
                    </div>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <Filter className="w-8 h-8 text-success-500 mb-2" />
                      <p className="font-medium">Use Filters</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        Filter by type, date, and popularity
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Search Stats */}
              <div className="card">
                <h3 className="font-bold mb-4">Search Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 dark:text-neutral-400">Total Results</span>
                    <span className="font-bold">
                      {users.length + posts.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 dark:text-neutral-400">Users Found</span>
                    <span className="font-bold">{users.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 dark:text-neutral-400">Posts Found</span>
                    <span className="font-bold">{posts.length}</span>
                  </div>
                </div>
              </div>

              {/* Popular Hashtags */}
              <div className="card">
                <h3 className="font-bold mb-4">Popular Hashtags</h3>
                <div className="space-y-2">
                  {[
                    '#SocialMedia',
                    '#WebDev',
                    '#ReactJS',
                    '#JavaScript',
                    '#Programming',
                    '#UIUX',
                    '#Design',
                    '#Tech',
                  ].map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(tag)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <span className="text-primary-600 dark:text-primary-400">{tag}</span>
                      <span className="text-xs text-neutral-500">{(index + 1) * 1000}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Search */}
              <div className="card bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                <h3 className="font-bold mb-3">Try Voice Search</h3>
                <p className="text-sm opacity-90 mb-4">
                  Speak your search query for faster results
                </p>
                <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-colors">
                  🎤 Start Voice Search
                </button>
              </div>

              {/* Save Search */}
              {query && (
                <div className="card">
                  <h3 className="font-bold mb-4">Save This Search</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    Save "{query}" to quickly access it later
                  </p>
                  <button className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                    💾 Save Search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;