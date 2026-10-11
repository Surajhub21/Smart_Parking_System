import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Signed In</h2>
          <p className="text-gray-600 mb-6">Please log in to view your profile details.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-indigo-200">Account Overview</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">{user.name || 'User Profile'}</h1>
              <p className="text-indigo-100 text-sm mt-1">{user.email}</p>
            </div>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                Role: {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-100 bg-gray-50/50 rounded-lg p-5">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</span>
              <p className="mt-1 text-base font-semibold text-gray-900">{user.name || 'Not provided'}</p>
            </div>

            <div className="border border-gray-100 bg-gray-50/50 rounded-lg p-5">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</span>
              <p className="mt-1 text-base font-semibold text-gray-900">{user.email}</p>
            </div>

            <div className="border border-gray-100 bg-gray-50/50 rounded-lg p-5">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Role</span>
              <p className="mt-1 text-base font-semibold text-gray-900">{user.role}</p>
            </div>

            <div className="border border-gray-100 bg-gray-50/50 rounded-lg p-5">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</span>
              <p className="mt-1 text-base font-semibold text-gray-900">#{user.id}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-4">
            {user.role === 'OWNER' && (
              <button
                onClick={() => navigate('/owner-dashboard')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors"
              >
                Owner Dashboard
              </button>
            )}
            {user.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors"
              >
                Admin Dashboard
              </button>
            )}
            {user.role === 'DRIVER' && (
              <button
                onClick={() => navigate('/bookings')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors"
              >
                My Bookings
              </button>
            )}
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
