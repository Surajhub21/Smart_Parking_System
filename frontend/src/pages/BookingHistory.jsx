import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBookings, cancelBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookingHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingBookingId, setCancelingBookingId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      setLoading(true);
      setError('');
      try {
        const userBookings = await getUserBookings(user.id);
        setBookings(userBookings);
      } catch (err) {
        setError('Failed to load booking history. Please try again.');
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  const handleCancelBooking = async (bookingId) => {
    setCancelingBookingId(bookingId);
    try {
      await cancelBooking(bookingId);
      // Refresh bookings after cancellation
      const updatedBookings = await getUserBookings(user.id);
      setBookings(updatedBookings);
    } catch (err) {
      setError('Failed to cancel booking. Please try again.');
      console.error('Error cancelling booking:', err);
    } finally {
      setCancelingBookingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Bookings</h2>
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

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Bookings Found</h2>
          <p className="text-gray-600">
            You haven't made any bookings yet. Start by finding a parking lot!
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Find Parking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">
            View and manage your parking reservations
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50 transition-background">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-600 text-lg font-bold">#{booking.id}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.parkingLot?.name || 'Unknown Parking Lot'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Slot {booking.slot?.number || 'Not Assigned'} • 
                          {booking.vehicleType || 'Not Specified'}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-600">
                      {booking.parkingLot?.address || 'Address not available'}
                    </p>
                  </div>
                  <div className="ml-6 flex-shrink-0 space-y-2 text-right">
                    <div className="text-sm font-medium">
                      {formatDate(booking.startTime)} - {formatDate(booking.endTime)}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </div>
                    {booking.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancelingBookingId === booking.id}
                        className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {cancelingBookingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Amount:</span>
                      <p className="font-medium">${booking.totalAmount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Booking Date:</span>
                      <p className="font-medium">
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className="font-medium">
                        {booking.status === 'ACTIVE' ? 'Active' : 'Cancelled'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment:</span>
                      <p className="font-medium">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded"
          >
            Find More Parking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingHistory;