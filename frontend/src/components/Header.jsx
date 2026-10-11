import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex">
            <Link to="/" className="brand-mark flex-shrink-0 text-xl font-semibold">
              Smart Parking Finder
            </Link>
          </div>
          <div className="w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-1 md:ml-10 md:gap-2">
              <Link to="/" className="nav-link px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              {user ? (
                <>
                  {user.role === 'ADMIN' ? (
                    <>
                      <Link to="/admin-dashboard" className="nav-link px-3 py-2 rounded-md text-sm font-medium">
                        Admin Dashboard
                      </Link>
                      <Link to="/profile" className="nav-link px-3 py-2 rounded-md text-sm font-medium">
                        Profile
                      </Link>
                    </>
                  ) : user.role === 'OWNER' ? (
                    <>
                      <Link to="/owner-dashboard" className="nav-link px-3 py-2 rounded-md text-sm font-medium">
                        Owner Dashboard
                      </Link>
                      <Link to="/profile" className="nav-link px-3 py-2 rounded-md text-sm font-medium">
                        Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/bookings" className="nav-link px-3 py-2 rounded-md text-sm font-medium">
                        My Bookings
                      </Link>
                      <Link to="/favorites" className="nav-link px-3 py-2 rounded-md text-sm font-medium">
                        Favorites
                      </Link>
                      <Link to="/profile" className="nav-link px-3 py-2 rounded-md text-sm font-medium">
                        Profile
                      </Link>
                    </>
                  )}
                  <button onClick={handleLogout} className="nav-link px-3 py-2 rounded-md text-sm font-medium">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link px-3 py-2 rounded-md text-sm font-medium">
                    Login
                  </Link>
                  <Link to="/register" className="nav-link nav-link-strong px-3 py-2 rounded-md text-sm font-medium">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;