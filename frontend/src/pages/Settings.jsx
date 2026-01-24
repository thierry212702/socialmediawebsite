import React, { useState } from 'react'
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Eye,
  Mail,
  Globe,
  Save,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

const Settings = () => {
  const { user, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    website: user?.website || '',
    location: user?.location || '',
    isPrivate: user?.isPrivate || false,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await updateProfile(formData)
    if (result.success) {
      toast.success('Profile updated successfully')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64">
          <div className="card space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center w-full p-3 rounded-lg ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5 mr-3" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center w-full p-3 rounded-lg ${
                activeTab === 'privacy'
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <Shield className="w-5 h-5 mr-3" />
              Privacy
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center w-full p-3 rounded-lg ${
                activeTab === 'notifications'
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <Bell className="w-5 h-5 mr-3" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center w-full p-3 rounded-lg ${
                activeTab === 'security'
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <Lock className="w-5 h-5 mr-3" />
              Security
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Edit Profile</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="input-field min-h-[100px] resize-none"
                    placeholder="Tell us about yourself"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="City, Country"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    name="isPrivate"
                    checked={formData.isPrivate}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700">
                    Private Account
                  </label>
                  <span className="ml-2 text-gray-400 text-sm">
                    (Only approved followers can see your posts)
                  </span>
                </div>

                <button type="submit" className="btn-primary">
                  <Save className="w-5 h-5 mr-2 inline" />
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="card space-y-6">
              <div>
                <h3 className="font-bold mb-4">Account Privacy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Private Account</p>
                      <p className="text-sm text-gray-500">
                        Only people you approve can see your photos and videos
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Story Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Hide Story From</p>
                      <p className="text-sm text-gray-500">
                        You can hide your story from specific people
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card space-y-6">
              <div>
                <h3 className="font-bold mb-4">Login Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Enable
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input type="password" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input type="password" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input type="password" className="input-field" />
                  </div>
                  <button className="btn-primary">Change Password</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings