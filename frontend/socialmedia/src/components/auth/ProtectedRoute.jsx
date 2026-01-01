import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import Loader from '../common/Loader';
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return <Loader />;
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    return children;
};
export default ProtectedRoute;