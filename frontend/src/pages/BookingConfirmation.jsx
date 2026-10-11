import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserBookings } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookingConfirmation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get booking data from location state (passed from booking creation)
    const bookingData = location.state?.booking;
    if (bookingData) {
      setBooking(bookingData);
      setLoading(false);
    } else {
      // If no booking data in state, try to fetch latest booking
      const fetchLatestBooking = async () => {
        setLoading(true);
        try {
          const bookings = await getUserBookings(user.id);
          if (bookings.length > 0) {
            // Get the most recent booking
            const latestBooking = bookings[0];
            setBooking(latestBooking);
          } else {
            setError('No bookings found');
          }
        } catch (err) {
          setError('Failed to load booking details');
          console.error('Error fetching bookings:', err);
        } finally {
          setLoading(false);
        }
      };

      if (user) {
        fetchLatestBooking();
      } else {
        navigate('/login');
      }
    }
  }, [location, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Confirming your booking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Error</h2>
          <p className="text-gray-600">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <p className="text-gray-600">We couldn't find your booking details.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Confirmed!
            </h2>
            <p className="text-gray-600 mb-6">
              Your parking reservation has been successfully created.
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Booking Details */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Booking Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Booking ID:</span>
                  <span className="text-sm font-medium text-gray-900">#{booking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Parking Lot:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {booking.parkingLot?.name || 'Unknown Parking Lot'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Slot:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {booking.slot?.number || 'Not Assigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Vehicle Type:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {booking.vehicleType || 'Not Specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Start Time:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(booking.startTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">End Time:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(booking.endTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Amount:</span>
                  <span className="text-sm font-medium text-gray-900 font-bold">
                    ${booking.totalAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <span className={`text-sm font-medium ${
                    booking.status === 'ACTIVE' 
                      ? 'text-green-600' 
                      : booking.status === 'CANCELLED' 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-8">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded"
              >
                Go to Home
              </button>
              <button
                onClick={() => navigate('/bookings')}
                className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded"
              >
                View My Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;