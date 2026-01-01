import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Context Providers
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import ExplorePage from './pages/ExplorePage';
import ReelsPage from './pages/ReelsPage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
// Protected Route
import ProtectedRoute from './components/auth/ProtectedRoute';
// Toast
import Toast from './components/common/Toast';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Toast />
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Navbar />
                  <div className="flex pt-16">
                    <Sidebar />
                    <main className="flex-1 p-4 md:p-6 md:ml-64 min-h-[calc(100vh-4rem)]">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/profile/:username" element={<ProfilePage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/explore" element={<ExplorePage />} />
                        <Route path="/reels" element={<ReelsPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/saved" element={<Navigate to="/profile/me/saved" />} />
                        <Route path="/friends" element={<Navigate to="/profile/me/friends" />} />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;