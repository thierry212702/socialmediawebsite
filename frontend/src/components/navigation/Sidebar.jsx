// File: src/components/navigation/Sidebar.jsx
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Home, 
  Compass, 
  MessageSquare, 
  Heart, 
  PlusSquare,
  User,
  Bookmark,
  Settings,
  LogOut,
  Users,
  Video,
  Hash,
  TrendingUp,
  Camera,
  Bell,
  Search,
  Zap,
  Star,
  Sparkles,
  X  // ADD THIS IMPORT - It was missing!
} from 'lucide-react'

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Home', color: 'text-primary-500' },
    { path: '/explore', icon: Compass, label: 'Explore', color: 'text-secondary-500' },
    { path: '/messages', icon: MessageSquare, label: 'Messages', color: 'text-info-500' },
    { path: '/notifications', icon: Heart, label: 'Notifications', color: 'text-danger-500', badge: 3 },
    { path: '/create', icon: PlusSquare, label: 'Create', color: 'text-success-500' },
    { path: `/profile/${user?.username}`, icon: User, label: 'Profile', color: 'text-accent-500' },
    { path: '/saved', icon: Bookmark, label: 'Saved', color: 'text-warning-500' },
    { path: '/search', icon: Search, label: 'Search', color: 'text-purple-500' },
  ]

  const exploreItems = [
    { icon: TrendingUp, label: 'Trending', color: 'text-success-500' },
    { icon: Video, label: 'Videos', color: 'text-secondary-500' },
    { icon: Camera, label: 'Photos', color: 'text-primary-500' },
    { icon: Users, label: 'People', color: 'text-info-500' },
    { icon: Hash, label: 'Hashtags', color: 'text-purple-500' },
  ]

  return (
    <div className="h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col">
      {/* Mobile header with close button */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <h2 className="text-lg font-bold text-gradient">Menu</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <X size={24} /> {/* This line was causing the error */}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {/* Main navigation */}
        <div className="mb-6">
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Navigation
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium transition-all duration-300 mx-2 rounded-xl ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-600 dark:text-primary-400 border-l-4 border-primary-500'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                  }`
                }
                onClick={onClose}
              >
                <item.icon size={20} className={`mr-3 ${item.color}`} />
                {item.label}
                {item.badge && (
                  <span className="ml-auto w-6 h-6 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Explore Categories */}
        <div className="mb-6">
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Explore
          </h3>
          <nav className="space-y-1">
            {exploreItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors w-full text-left mx-2 rounded-xl"
                onClick={onClose}
              >
                <item.icon size={20} className={`mr-3 ${item.color}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User stats */}
        <div className="px-4 mb-6">
          <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-2xl p-4 border border-primary-200/50 dark:border-primary-800/50">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-primary-500" />
              Your Stats
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-lg font-bold text-primary-600 dark:text-primary-400">42</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Friends</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-secondary-600 dark:text-secondary-400">156</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-accent-600 dark:text-accent-400">1.2K</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Likes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - User info */}
      <div className="border-t border-gray-200/50 dark:border-gray-800/50 p-4">
        <div className="flex items-center mb-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold shadow-lg">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-semibold">{user?.username || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <NavLink
            to="/settings"
            className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
            onClick={onClose}
          >
            <Settings size={18} className="mr-3 text-gray-500" />
            Settings
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 w-full text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50/50 dark:hover:bg-danger-900/20 rounded-xl transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar