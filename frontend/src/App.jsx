import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import DriverHome from './pages/DriverHome';
import Login from './pages/Login';
import Register from './pages/Register';
import ParkingLotDetails from './pages/ParkingLotDetails';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingHistory from './pages/BookingHistory';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Favorites from './pages/Favorites';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';

function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <BrowserRouter>
          <div className="app-shell min-h-screen">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<DriverHome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/parking-lot/:id" element={<ParkingLotDetails />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/bookings" element={<BookingHistory />} />
                <Route path="/owner-dashboard" element={<OwnerDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/favorites" element={<Favorites />} />
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