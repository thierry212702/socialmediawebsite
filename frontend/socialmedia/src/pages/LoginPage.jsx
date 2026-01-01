import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';  // Changed from '../'
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaFacebook, FaGoogle } from 'react-icons/fa';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            navigate('/');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
            <div className="max-w-6xl w-full flex bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Left Side - Welcome */}
                <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary to-secondary p-12 text-white flex-col justify-center">
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
                        <p className="text-lg opacity-90">Sign in to connect with friends and share your moments.</p>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📸</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">Share Photos</h3>
                                <p className="opacity-90">Share your favorite moments</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">💬</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">Real-time Chat</h3>
                                <p className="opacity-90">Instant messaging with friends</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">👥</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">Connect</h3>
                                <p className="opacity-90">Discover new connections</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="flex-1 p-8 md:p-12">
                    <div className="max-w-md mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
                            <p className="text-gray-600 mt-2">Welcome back to SocialConnect</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FaEnvelope className="inline mr-2" />
                                    Email or Username
                                </label>
                                <input
                                    type="text"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email or username"
                                    required
                                    disabled={loading}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FaLock className="inline mr-2" />
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        required
                                        disabled={loading}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors pr-12"
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

                            <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                                        disabled={loading}
                                    />
                                    <span className="text-sm text-gray-600">Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !formData.email || !formData.password}
                                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    disabled={loading}
                                    className="flex items-center justify-center space-x-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <FaGoogle className="text-red-500" />
                                    <span>Google</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={loading}
                                    className="flex items-center justify-center space-x-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <FaFacebook className="text-blue-600" />
                                    <span>Facebook</span>
                                </button>
                            </div>
                        </form>

                        <div className="text-center mt-8">
                            <p className="text-gray-600">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-primary font-semibold hover:text-primary/80">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;