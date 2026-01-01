import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import {
    FaHome,
    FaSearch,
    FaCompass,
    FaVideo,
    FaHeart,
    FaPlusSquare,
    FaUserCircle,
    FaComment,
    FaCog,
    FaBookmark,
    FaUsers
} from 'react-icons/fa';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();

    const navItems = [
        { icon: <FaHome />, label: 'Home', path: '/' },
        { icon: <FaSearch />, label: 'Search', path: '/search' },
        { icon: <FaCompass />, label: 'Explore', path: '/explore' },
        { icon: <FaVideo />, label: 'Reels', path: '/reels' },
        { icon: <FaComment />, label: 'Messages', path: '/chat' },
        { icon: <FaHeart />, label: 'Notifications', path: '/notifications' },
        { icon: <FaPlusSquare />, label: 'Create', path: '/create' },
        { icon: <FaUserCircle />, label: 'Profile', path: `/profile/${user?.username}` },
    ];

    const secondaryItems = [
        { icon: <FaBookmark />, label: 'Saved', path: '/saved' },
        { icon: <FaUsers />, label: 'Friends', path: '/friends' },
        { icon: <FaCog />, label: 'Settings', path: '/settings' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="hidden md:block w-64 border-r border-border-color bg-white h-[calc(100vh-4rem)] fixed top-16 overflow-y-auto">
            {/* User Profile */}
            <div className="p-6 border-b border-border-color">
                <Link to={`/profile/${user?.username}`} className="flex items-center space-x-3">
                    <img
                        src={user?.profilePicture || '/default-avatar.png'}
                        alt={user?.username}
                        className="w-12 h-12 rounded-full border-2 border-white shadow"
                        onError={(e) => {
                            e.target.src = '/default-avatar.png';
                        }}
                    />
                    <div>
                        <h3 className="font-semibold text-gray-900">{user?.fullName}</h3>
                        <p className="text-sm text-gray-500">@{user?.username}</p>
                    </div>
                </Link>
            </div>

            {/* Main Navigation */}
            <div className="p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                    Menu
                </h4>
                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-primary bg-opacity-10 text-primary font-semibold'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span className={`text-lg ${isActive(item.path) ? 'text-primary' : 'text-gray-500'}`}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Secondary Navigation */}
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-3">
                    More
                </h4>
                <nav className="space-y-1">
                    {secondaryItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-primary bg-opacity-10 text-primary font-semibold'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span className={`text-lg ${isActive(item.path) ? 'text-primary' : 'text-gray-500'}`}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-color">
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <a href="/about" className="hover:text-primary">About</a>
                    <a href="/help" className="hover:text-primary">Help</a>
                    <a href="/privacy" className="hover:text-primary">Privacy</a>
                    <a href="/terms" className="hover:text-primary">Terms</a>
                </div>
                <p className="text-xs text-gray-400 mt-3">© 2024 SocialConnect</p>
            </div>
        </aside>
    );
};

export default Sidebar;