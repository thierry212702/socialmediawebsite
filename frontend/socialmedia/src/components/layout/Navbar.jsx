import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import {
    FaHome,
    FaSearch,
    FaPlusSquare,
    FaComment,
    FaBell,
    FaUserCircle,
    FaCog,
    FaSignOutAlt,
    FaCompass,
    FaVideo
} from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, onlineUsers } = useSocket();
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${searchQuery}`);
            setSearchQuery('');
        }
    };

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
    };

    const markAllNotificationsAsRead = () => {
        // Implement mark all as read functionality
        console.log('Mark all as read');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 h-16 shadow-sm">
            <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                    <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        SocialConnect
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-2xl mx-8">
                    <form onSubmit={handleSearch} className="relative">
                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users, posts, hashtags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-500"
                        />
                    </form>
                </div>

                {/* Navigation Icons */}
                <div className="flex items-center space-x-6">
                    <Link to="/" className="text-gray-700 hover:text-primary transition-colors relative p-2">
                        <FaHome className="text-xl" />
                    </Link>

                    <Link to="/explore" className="text-gray-700 hover:text-primary transition-colors p-2">
                        <FaCompass className="text-xl" />
                    </Link>

                    <Link to="/reels" className="text-gray-700 hover:text-primary transition-colors p-2">
                        <FaVideo className="text-xl" />
                    </Link>

                    <div className="relative">
                        <Link to="/chat" className="text-gray-700 hover:text-primary transition-colors p-2">
                            <FaComment className="text-xl" />
                        </Link>
                        {/* Online status dot */}
                        {onlineUsers.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-2 h-2"></span>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="text-gray-700 hover:text-primary transition-colors p-2 relative"
                        >
                            <FaBell className="text-xl" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in max-h-96 overflow-y-auto">
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllNotificationsAsRead}
                                                    className="text-sm text-primary hover:text-primary/80"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <FaBell className="text-4xl text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">No notifications yet</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {notifications.slice(0, 10).map(notification => (
                                                <div
                                                    key={notification._id || Date.now()}
                                                    className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white">
                                                            {notification.type === 'follow' && '👤'}
                                                            {notification.type === 'like' && '❤️'}
                                                            {notification.type === 'comment' && '💬'}
                                                            {notification.type === 'message' && '📨'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-800">
                                                                {notification.type === 'follow' && `${notification.from?.username || 'Someone'} started following you`}
                                                                {notification.type === 'like' && `${notification.from?.username || 'Someone'} liked your post`}
                                                                {notification.type === 'comment' && `${notification.from?.username || 'Someone'} commented on your post`}
                                                                {notification.type === 'message' && `New message from ${notification.from?.username || 'Someone'}`}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {new Date(notification.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {notifications.length > 10 && (
                                        <div className="p-3 border-t border-gray-100 text-center">
                                            <Link
                                                to="/notifications"
                                                className="text-sm text-primary hover:text-primary/80"
                                                onClick={() => setShowNotifications(false)}
                                            >
                                                See all notifications
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Create Post */}
                    <Link to="/create" className="text-gray-700 hover:text-primary transition-colors p-2">
                        <FaPlusSquare className="text-xl" />
                    </Link>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center space-x-2 focus:outline-none"
                        >
                            <div className="relative">
                                <img
                                    src={user?.profilePicture || '/default-avatar.png'}
                                    alt={user?.username}
                                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-primary transition-colors"
                                    onError={(e) => {
                                        e.target.src = '/default-avatar.png';
                                    }}
                                />
                                {onlineUsers.includes(user?._id) && (
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                            </div>
                        </button>

                        {showDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowDropdown(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in">
                                    <Link
                                        to={`/profile/${user?.username}`}
                                        className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 rounded-t-xl transition-colors"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        <FaUserCircle className="text-gray-600" />
                                        <span>Profile</span>
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 transition-colors"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        <FaCog className="text-gray-600" />
                                        <span>Settings</span>
                                    </Link>
                                    <div className="border-t border-gray-200" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-xl w-full text-left transition-colors"
                                    >
                                        <FaSignOutAlt />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;