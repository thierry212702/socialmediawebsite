// File: src/components/navigation/Navbar.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { 
  Menu, 
  Search, 
  Bell, 
  MessageSquare, 
  User,
  LogOut,
  Sun,
  Moon,
  Palette,
  Sparkles,
  X,
  Home,
  Compass,
  PlusSquare,
  Heart
} from 'lucide-react'

const Navbar = ({ onMenuClick, onRightSidebarToggle, isRightSidebarOpen }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(3) // Mock data

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  const quickLinks = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: Heart, label: 'Notifications', path: '/notifications', badge: unreadCount },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 z-40 h-16 safe-top">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left side - Logo and Menu button */}
        <div className="flex items-center space-x-4">
          {/* Menu button for mobile */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <Sparkles className="text-white" size={22} />
            </div>
            <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent hidden sm:block">
              SocialSphere
            </span>
          </Link>
        </div>

        {/* Center - Quick Actions */}
        <div className="hidden md:flex items-center space-x-1">
          {quickLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${
                location.pathname === item.path
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="relative">
                <item.icon size={22} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Right side - Icons and User menu */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-accent-500" />
            ) : (
              <Moon size={20} className="text-primary-600" />
            )}
          </button>

          {/* Customize Background */}
          <Link
            to="/customize"
            className="p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
            aria-label="Customize background"
          >
            <Palette size={20} className="text-secondary-500" />
          </Link>

          {/* Search Toggle for mobile */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
            aria-label="Search"
          >
            {showSearch ? <X size={20} /> : <Search size={20} />}
          </button>

          {/* Search bar (desktop) */}
          <div className="hidden md:block relative">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people, posts, or hashtags..."
                className="input-glass pl-10 pr-4 w-64"
              />
            </form>
          </div>

          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center animate-ping-slow">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold shadow-lg">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden lg:block text-sm font-medium">
                {user?.username || 'User'}
              </span>
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 border border-gray-200/50 dark:border-gray-700/50 animate-scale-in">
                  <Link 
                    to={`/profile/${user?.username}`}
                    className="flex items-center px-4 py-3 text-sm hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <User size={18} className="mr-3 text-primary-500" />
                    Profile
                  </Link>
                  <Link 
                    to="/customize"
                    className="flex items-center px-4 py-3 text-sm hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Palette size={18} className="mr-3 text-secondary-500" />
                    Customize Theme
                  </Link>
                  <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-2"></div>
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      handleLogout()
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50/50 dark:hover:bg-danger-900/20 transition-colors"
                  >
                    <LogOut size={18} className="mr-3" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="md:hidden px-4 pb-4 animate-slide-down">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, posts, or hashtags..."
              className="input-glass pl-10 pr-4 w-full"
              autoFocus
            />
          </form>
        </div>
      )}
    </nav>
  )
}

export default Navbar