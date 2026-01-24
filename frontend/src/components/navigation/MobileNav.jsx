// File: src/components/navigation/MobileNav.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Compass, 
  MessageSquare, 
  Heart, 
  PlusSquare,
  User,
  Search,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const MobileNav = () => {
  const { user } = useAuth()

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
    { path: '/notifications', icon: Heart, label: 'Alerts', badge: 3 },
    { path: '/messages', icon: MessageSquare, label: 'Chat' },
    { path: `/profile/${user?.username}`, icon: User, label: 'Profile' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 z-50 safe-bottom">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 scale-110'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400'
              }`
            }
          >
            <div className="relative">
              <item.icon className="w-6 h-6" />
              {item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{item.label}</span>
            {({ isActive }) => isActive && (
              <div className="absolute -top-1 w-1 h-1 bg-primary-500 rounded-full"></div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default MobileNav