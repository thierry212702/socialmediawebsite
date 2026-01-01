import React from 'react';

const Loader = () => {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin animation-delay-200"></div>
                </div>
            </div>
        </div>
    );
};

export default Loader;