import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchParkingLotById, createBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

const ParkingLotDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [parkingLot, setParkingLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    vehicleType: '',
    startTime: '',
    endTime: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchLot = async () => {
      setLoading(true);
      setError('');
      try {
        const lot = await fetchParkingLotById(id);
        setParkingLot(lot);
      } catch (err) {
        setError('Failed to load parking lot details. Please try again.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLot();
  }, [id]);

  const handleBookSlot = (slot) => {
    setBookingForm({
      vehicleType: slot.vehicleType,
      startTime: new Date().toISOString().slice(0, 16), // Local datetime format
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16) // 2 hours later
    });
    setBookingModal(true);
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess(false);
    setBookingLoading(true);

    try {
      // Validate form
      if (!bookingForm.vehicleType) {
        setBookingError('Please select a vehicle type');
        return;
      }

      if (!bookingForm.startTime || !bookingForm.endTime) {
        setBookingError('Please select start and end times');
        return;
      }

      const startTime = new Date(bookingForm.startTime);
      const endTime = new Date(bookingForm.endTime);
      const now = new Date();

      if (startTime < now) {
        setBookingError('Start time cannot be in the past');
        return;
      }

      if (endTime <= startTime) {
        setBookingError('End time must be after start time');
        return;
      }

      // Create booking
      const bookingData = {
        parkingLotId: parkingLot.id,
        slotNumber: bookingForm.slotNumber || 'A1', // In a real app, this would come from slot selection
        vehicleType: bookingForm.vehicleType,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime
      };

      const booking = await createBooking(bookingData);
      setBookingSuccess(true);
      setBookingModal(false);
      
      // Redirect to booking confirmation page with booking data
      navigate('/booking-confirmation', { state: { booking } });
    } catch (err) {
      setBookingError('Failed to create booking. Please try again.');
      console.error('Booking error:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading parking lot details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Details</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!parkingLot) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Parking Lot Not Found</h2>
          <p className="text-gray-600">The requested parking lot could not be found.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full border-b border-gray-200 bg-white lg:w-72 lg:border-b-0 lg:border-r">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{parkingLot.name}</h2>
            <p className="text-gray-600 mb-4">{parkingLot.address}</p>
            
            {/* Favorite button */}
            <div className="mb-4">
              <button
                onClick={() => {
                  if (isFavorite(parkingLot.id)) {
                    removeFavorite(parkingLot.id);
                  } else {
                    addFavorite(parkingLot.id);
                  }
                }}
                className={`w-full flex items-center justify-start gap-2 px-3 py-2 text-sm font-medium 
                  ${isFavorite(parkingLot.id) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'} 
                  rounded hover:${isFavorite(parkingLot.id) ? 'bg-indigo-700' : 'bg-gray-300'}`}
              >
                {isFavorite(parkingLot.id) ? 'Remove from Favorites' : 'Save to Favorites'}
              </button>
            </div>
            
            {/* Info cards */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Availability</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {parkingLot.availableSlots}/{parkingLot.totalSlots} slots
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {parkingLot.availableSlots > 0 ? 'Available' : 'Full'}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pricing</h3>
                <p className="text-2xl font-bold text-indigo-600">
                  ${parkingLot.pricePerHour}/hr
                </p>
                <p className="text-sm text-gray-500 mt-1">Hourly rate</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Hours</h3>
                <p className="text-lg font-medium text-gray-900">
                  {parkingLot.openingHours}
                </p>
              </div>
            </div>
            
            {/* Amenities */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {parkingLot.amenities.map((amenity, index) => (
                  <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Vehicle Types */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Types</h3>
              <div className="flex flex-wrap gap-2">
                {parkingLot.vehicleTypes.map((type, index) => (
                  <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* Booking Modal */}
          {bookingModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96 max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Book a Parking Slot</h2>
                {bookingError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                    {bookingError}
                  </div>
                )}
                {bookingSuccess && (
                  <div className="mb-4 p-3 bg-green-50 text-green-600 rounded">
                    Booking confirmed! Your reservation is active.
                  </div>
                )}
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type
                    </label>
                    <select
                      name="vehicleType"
                      value={bookingForm.vehicleType}
                      onChange={handleBookingChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select vehicle type</option>
                      {parkingLot.vehicleTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      name="startTime"
                      type="datetime-local"
                      value={bookingForm.startTime}
                      onChange={handleBookingChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      name="endTime"
                      type="datetime-local"
                      value={bookingForm.endTime}
                      onChange={handleBookingChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setBookingModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Parking Lot Details */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">About This Parking Lot</h2>
                <p className="text-gray-600">
                  Secure parking facility with {parkingLot.totalSlots} spaces located in the heart of the city.
                  Features include {parkingLot.amenities.join(', ')} and 24/7 security monitoring.
                </p>
              </div>
              
              {/* Slots */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Available Slots</h2>
                {parkingLot.slots && parkingLot.slots.length > 0 ? (
                  <div className="space-y-3">
                    {parkingLot.slots.map((slot) => (
                      <div key={slot.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              Slot {slot.number}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Vehicle Type: {slot.vehicleType}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${slot.status === 'FREE' ? 'bg-green-500' : slot.status === 'RESERVED' ? 'bg-yellow-500' : slot.status === 'OCCUPIED' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                            <span className="text-sm font-medium text-gray-900">
                              {slot.status}
                            </span>
                          </div>
                        </div>
                        {slot.status === 'FREE' && (
                          <button
                            onClick={() => handleBookSlot(slot)}
                            className="mt-3 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
                          >
                            Book This Slot
                          </button>
                        )}
                        {slot.status !== 'FREE' && (
                          <p className="mt-2 text-sm text-gray-500">
                            Currently {slot.status.toLowerCase()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Slot information not available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ParkingLotDetails;