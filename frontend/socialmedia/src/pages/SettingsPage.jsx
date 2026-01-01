import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';  // Changed from '../'
import { FaUser, FaLock, FaBell, FaEye, FaEyeSlash, FaCamera } from 'react-icons/fa';

const SettingsPage = () => {
    const { user, updateProfile, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        username: user?.username || '',
        email: user?.email || '',
        bio: user?.bio || '',
        website: user?.website || '',
        location: user?.location || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewImage, setPreviewImage] = useState(user?.profilePicture || '');

    const handleProfileChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value,
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('fullName', formData.fullName);
        data.append('bio', formData.bio);
        data.append('website', formData.website);
        data.append('location', formData.location);

        if (profilePicture) {
            data.append('profilePicture', profilePicture);
        }

        const result = await updateProfile(data);
        setLoading(false);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        // Implement password change logic
        console.log('Password change:', passwordData);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <FaUser /> },
        { id: 'password', label: 'Password', icon: <FaLock /> },
        { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="md:flex">
                    {/* Sidebar */}
                    <div className="md:w-1/3 border-r border-border-color">
                        <nav className="p-4 space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-primary text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="text-lg">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="md:w-2/3 p-6">
                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileSubmit}>
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Profile</h2>

                                    {/* Profile Picture */}
                                    <div className="flex items-center space-x-6 mb-6">
                                        <div className="relative">
                                            <img
                                                src={previewImage || '/default-avatar.png'}
                                                alt="Profile"
                                                className="w-24 h-24 rounded-full border-4 border-white shadow"
                                            />
                                            <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                                                <FaCamera />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Profile Picture</h3>
                                            <p className="text-sm text-gray-500">Click the camera icon to change</p>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleProfileChange}
                                                disabled
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleProfileChange}
                                                disabled
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bio
                                            </label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleProfileChange}
                                                rows="3"
                                                maxLength="150"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                                placeholder="Tell us about yourself..."
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/150</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Website
                                            </label>
                                            <input
                                                type="url"
                                                name="website"
                                                value={formData.website}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                placeholder="https://example.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                placeholder="City, Country"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            fullName: user?.fullName || '',
                                            bio: user?.bio || '',
                                            website: user?.website || '',
                                            location: user?.location || '',
                                        })}
                                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordSubmit}>
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>

                                <div className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'notifications' && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Push Notifications</h3>
                                            <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Email Notifications</h3>
                                            <p className="text-sm text-gray-500">Receive email notifications</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Message Notifications</h3>
                                            <p className="text-sm text-gray-500">Get notified about new messages</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-red-200">
                <h2 className="text-xl font-semibold text-red-700 mb-4">Danger Zone</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-gray-900">Delete Account</h3>
                        <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                    </div>
                    <button
                        onClick={logout}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;