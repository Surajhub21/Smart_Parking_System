import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import DriverHome from './pages/DriverHome';
import Login from './pages/Login';
import Register from './pages/Register';
import ParkingLotDetails from './pages/ParkingLotDetails';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingHistory from './pages/BookingHistory';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';

/**
 * Root Route handler:
 * - If unauthenticated: shows Project Introduction / Landing Page.
 * - If logged in as Driver: renders DriverHome (interactive map & search).
 * - If logged in as Owner: redirects to /owner-dashboard.
 * - If logged in as Admin: redirects to /admin-dashboard.
 */
const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Initializing Smart Parking System...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (user.role === 'OWNER') {
    return <Navigate to="/owner-dashboard" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <DriverHome />;
};

/**
 * Public Only Route for Login / Register:
 * Redirects already authenticated users away to their role dashboard.
 */
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    if (user.role === 'OWNER') return <Navigate to="/owner-dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <BrowserRouter>
          <div className="app-shell min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                {/* Root Route: Introduction page for guests, DriverHome / role redirect for logged-in users */}
                <Route path="/" element={<RootRoute />} />

                {/* Direct Driver Map Route (Protected) */}
                <Route
                  path="/find-parking"
                  element={
                    <ProtectedRoute allowedRoles={['DRIVER', 'ADMIN', 'OWNER']}>
                      <DriverHome />
                    </ProtectedRoute>
                  }
                />

                {/* Public Auth Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <Login />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <Register />
                    </PublicOnlyRoute>
                  }
                />

                {/* Protected Driver & Shared Routes */}
                <Route
                  path="/parking-lot/:id"
                  element={
                    <ProtectedRoute>
                      <ParkingLotDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking-confirmation"
                  element={
                    <ProtectedRoute allowedRoles={['DRIVER', 'ADMIN']}>
                      <BookingConfirmation />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute allowedRoles={['DRIVER', 'ADMIN']}>
                      <BookingHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute allowedRoles={['DRIVER', 'ADMIN']}>
                      <Favorites />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Owner Dashboard */}
                <Route
                  path="/owner-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
                      <OwnerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Dashboard */}
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </FavoritesProvider>
    </AuthProvider>
  );
}

export default App;