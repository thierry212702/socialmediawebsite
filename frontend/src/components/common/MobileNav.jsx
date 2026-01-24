import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Compass, 
  MessageSquare, 
  Heart, 
  PlusSquare,
  User
} from 'lucide-react'

const MobileNav = () => {
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/create', icon: PlusSquare, label: 'Create' },
    { path: '/notifications', icon: Heart, label: 'Notifications' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default MobileNav