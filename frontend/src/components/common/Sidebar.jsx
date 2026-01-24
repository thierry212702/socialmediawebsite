import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Compass, 
  MessageSquare, 
  Heart, 
  PlusSquare,
  User,
  Bookmark,
  Settings,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/notifications', icon: Heart, label: 'Notifications' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
    { path: `/profile/${user?.username}`, icon: User, label: 'Profile' },
    { path: '/saved', icon: Bookmark, label: 'Saved' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">SocialApp</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer">
          <img
            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username}&background=random`}
            alt={user?.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.fullName}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar