import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <p className="text-4xl font-extrabold text-indigo-600 mb-2">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-600 mb-6 text-sm">
          The page you are looking for might have been moved, removed, or is temporarily unavailable.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
