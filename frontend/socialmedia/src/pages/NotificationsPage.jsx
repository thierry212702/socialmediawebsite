import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../utils/api';
import { FaHeart, FaComment, FaUserPlus, FaShare, FaBell, FaCheck } from 'react-icons/fa';

const NotificationsPage = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationAPI.getNotifications();
            if (response.data.success) {
                setNotifications(response.data.notifications || []);
            } else {
                // Mock data for testing
                setNotifications([
                    {
                        _id: '1',
                        type: 'like',
                        user: { username: 'johndoe', profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg' },
                        post: { _id: '1', preview: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809' },
                        message: 'liked your post',
                        createdAt: new Date(Date.now() - 3600000).toISOString(),
                        read: false,
                    },
                    {
                        _id: '2',
                        type: 'comment',
                        user: { username: 'janedoe', profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg' },
                        post: { _id: '1', preview: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750' },
                        message: 'commented on your post: "Great shot!"',
                        createdAt: new Date(Date.now() - 7200000).toISOString(),
                        read: true,
                    },
                    {
                        _id: '3',
                        type: 'follow',
                        user: { username: 'alexsmith', profilePicture: 'https://randomuser.me/api/portraits/men/3.jpg' },
                        message: 'started following you',
                        createdAt: new Date(Date.now() - 10800000).toISOString(),
                        read: false,
                    },
                ]);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            setNotifications(prev => prev.map(notif =>
                notif._id === notificationId ? { ...notif, read: true } : notif
            ));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like': return <FaHeart className="text-red-500" />;
            case 'comment': return <FaComment className="text-blue-500" />;
            case 'follow': return <FaUserPlus className="text-green-500" />;
            case 'share': return <FaShare className="text-purple-500" />;
            default: return <FaBell className="text-gray-500" />;
        }
    };

    const filteredNotifications = notifications.filter(notif => {
        if (activeFilter === 'unread') return !notif.read;
        if (activeFilter === 'follows') return notif.type === 'follow';
        if (activeFilter === 'likes') return notif.type === 'like';
        if (activeFilter === 'comments') return notif.type === 'comment';
        return true;
    });

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600">Stay updated with your activity</p>
                </div>
                <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Mark all as read
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'unread', label: 'Unread' },
                    { id: 'follows', label: 'Follows' },
                    { id: 'likes', label: 'Likes' },
                    { id: 'comments', label: 'Comments' },
                ].map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${activeFilter === filter.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications</h3>
                        <p className="text-gray-500">You're all caught up!</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`bg-white rounded-xl shadow-sm p-4 flex items-start space-x-3 transition-all ${!notification.read ? 'border-l-4 border-primary' : ''
                                }`}
                        >
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2">
                                        <img
                                            src={notification.user.profilePicture || '/default-avatar.png'}
                                            alt={notification.user.username}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <div>
                                            <h4 className="font-semibold">{notification.user.username}</h4>
                                            <p className="text-gray-600">
                                                {notification.message}
                                                {notification.post?.preview && (
                                                    <span className="ml-1 text-primary hover:underline cursor-pointer">
                                                        View post
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {formatTime(notification.createdAt)}
                                    </span>
                                </div>

                                {/* Post Preview */}
                                {notification.post?.preview && (
                                    <div className="mt-3">
                                        <img
                                            src={notification.post.preview}
                                            alt="Post preview"
                                            className="w-20 h-20 rounded-lg object-cover"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            {!notification.read && (
                                <button
                                    onClick={() => markAsRead(notification._id)}
                                    className="p-2 text-gray-500 hover:text-primary transition-colors"
                                    title="Mark as read"
                                >
                                    <FaCheck />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;