// File: src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass, RefreshCw, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">404</span>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">Page Not Found</h1>
        <p className="text-lg text-neutral-600 mb-8">
          Oops! The page you're looking for seems to have wandered off into the digital void.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>
          
          <Link
            to="/explore"
            className="block w-full py-3 bg-gradient-to-r from-accent-500 to-warning-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center"
          >
            <Compass className="w-5 h-5 mr-2" />
            Explore Content
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="block w-full py-3 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-neutral-50 rounded-xl">
          <p className="text-sm text-neutral-600">
            If you believe this is an error, please contact support or try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;