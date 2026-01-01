import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';  // Changed from '../'
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: '',
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        const userData = {
            username: formData.username,
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
        };

        const result = await signup(userData);

        if (result.success) {
            navigate('/');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="md:flex">
                    {/* Left Side - Welcome */}
                    <div className="md:w-2/5 bg-gradient-to-br from-primary to-secondary p-8 text-white">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-4">Join SocialConnect</h1>
                            <p className="opacity-90">Create your account and start connecting today.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <span className="text-xl">🌟</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Free Forever</h3>
                                    <p className="text-sm opacity-90">No credit card required</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <span className="text-xl">🔒</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Secure & Private</h3>
                                    <p className="text-sm opacity-90">Your data is protected</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <span className="text-xl">📱</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Cross Platform</h3>
                                    <p className="text-sm opacity-90">Access from any device</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Signup Form */}
                    <div className="md:w-3/5 p-8">
                        <div className="max-w-md mx-auto">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                                <p className="text-gray-600 mt-2">Fill in your details to get started</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <FaUser className="inline mr-2" />
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Choose a username"
                                        required
                                        disabled={loading}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.username ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.username && (
                                        <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter your full name"
                                        required
                                        disabled={loading}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.fullName && (
                                        <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <FaEnvelope className="inline mr-2" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        required
                                        disabled={loading}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <FaLock className="inline mr-2" />
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Create a password"
                                            required
                                            disabled={loading}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors pr-12 ${errors.password ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm your password"
                                            required
                                            disabled={loading}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors pr-12 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                        >
                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                                    )}
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        required
                                        disabled={loading}
                                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                                    />
                                    <label className="ml-2 text-sm text-gray-600">
                                        I agree to the{' '}
                                        <a href="/terms" className="text-primary hover:underline">
                                            Terms of Service
                                        </a>{' '}
                                        and{' '}
                                        <a href="/privacy" className="text-primary hover:underline">
                                            Privacy Policy
                                        </a>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </form>

                            <div className="text-center mt-6">
                                <p className="text-gray-600">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-primary font-semibold hover:text-primary/80">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;