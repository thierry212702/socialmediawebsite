import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './common/Sidebar'
import MobileNav from './common/MobileNav'
import RightSidebar from './common/RightSidebar'
import { useAuth } from '../contexts/AuthContext'

const Layout = () => {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar - Desktop */}
      <Sidebar />
      
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0 md:ml-16 lg:ml-64 p-4 md:p-6 max-w-4xl mx-auto">
        <Outlet />
      </main>

      {/* Right Sidebar - Desktop */}
      <RightSidebar 
        isOpen={isRightSidebarOpen}
        onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
      />
    </div>
  )
}

export default Layout