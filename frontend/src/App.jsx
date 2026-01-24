import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import CreatePost from './pages/CreatePost'
import PostDetail from './pages/PostDetail'
import Settings from './pages/Settings'
import Saved from './pages/Saved'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/profile/:username?" element={<Profile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/messages/:userId" element={<Messages />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/create" element={<CreatePost />} />
                  <Route path="/post/:postId" element={<PostDetail />} />
                  <Route path="/saved" element={<Saved />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App