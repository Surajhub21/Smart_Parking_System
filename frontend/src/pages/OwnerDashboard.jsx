import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOwnerParkingLots, createParkingLot, updateParkingLot, deleteParkingLot, getParkingLotSlots, createSlot, updateSlot, deleteSlot, getOwnerBookings } from '../services/api';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for parking lots
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for selected parking lot (for slots management)
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [lotLoading, setLotLoading] = useState(false);
  
  // State for modals and forms
  const [showAddLotModal, setShowAddLotModal] = useState(false);
  const [showEditLotModal, setShowEditLotModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Form states
  const [lotForm, setLotForm] = useState({
    name: '',
    address: '',
    pricePerHour: '',
    openingHours: '',
    amenities: '',
    vehicleTypes: '',
    totalSlots: ''
  });
  
  const [editLotForm, setEditLotForm] = useState({
    name: '',
    address: '',
    pricePerHour: '',
    openingHours: '',
    amenities: '',
    vehicleTypes: '',
    totalSlots: ''
  });
  
  const [slotForm, setSlotForm] = useState({
    number: '',
    vehicleType: '',
    status: 'FREE'
  });
  
  const [editSlotForm, setEditSlotForm] = useState({
    number: '',
    vehicleType: '',
    status: 'FREE'
  });
  
  // State for bookings
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  
  // Fetch owner's parking lots
  useEffect(() => {
    const fetchOwnerLots = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      setLoading(true);
      setError('');
      try {
        const lots = await getOwnerParkingLots(user.id);
        setParkingLots(lots);
      } catch (err) {
        setError('Failed to load parking lots. Please try again.');
        console.error('Error fetching owner parking lots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerLots();
  }, [user, navigate]);
  
  // Fetch slots for selected lot
  const fetchLotSlots = async (lotId) => {
    setSelectedLotId(lotId);
    setLotLoading(true);
    try {
      const lotSlots = await getParkingLotSlots(lotId);
      setSlots(lotSlots);
    } catch (err) {
      console.error('Error fetching parking lot slots:', err);
    } finally {
      setLotLoading(false);
    }
  };
  
  // Fetch owner's bookings
  const fetchOwnerBookings = async () => {
    if (!user) return;
    
    setBookingsLoading(true);
    try {
      const ownerBookings = await getOwnerBookings(user.id);
      setBookings(ownerBookings);
    } catch (err) {
      console.error('Error fetching owner bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };
  
  // Handle form changes
  const handleLotChange = (e) => {
    const { name, value } = e.target;
    setLotForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditLotChange = (e) => {
    const { name, value } = e.target;
    setEditLotForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    setSlotForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditSlotChange = (e) => {
    const { name, value } = e.target;
    setEditSlotForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submissions
  const handleAddLotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const newLot = {
        ownerId: user.id,
        name: lotForm.name,
        address: lotForm.address,
        pricePerHour: parseFloat(lotForm.pricePerHour),
        openingHours: lotForm.openingHours,
        amenities: lotForm.amenities.split(',').map(a => a.trim()),
        vehicleTypes: lotForm.vehicleTypes.split(',').map(v => v.trim()),
        totalSlots: parseInt(lotForm.totalSlots)
      };
      
      await createParkingLot(newLot);
      setShowAddLotModal(false);
      
      // Refresh parking lots
      const updatedLots = await getOwnerParkingLots(user.id);
      setParkingLots(updatedLots);
      
      // Reset form
      setLotForm({
        name: '',
        address: '',
        pricePerHour: '',
        openingHours: '',
        amenities: '',
        vehicleTypes: '',
        totalSlots: ''
      });
    } catch (err) {
      setError('Failed to create parking lot. Please try again.');
      console.error('Error creating parking lot:', err);
    }
  };
  
  const handleUpdateLotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const updatedLot = {
        id: editLotForm.id,
        name: editLotForm.name,
        address: editLotForm.address,
        pricePerHour: parseFloat(editLotForm.pricePerHour),
        openingHours: editLotForm.openingHours,
        amenities: editLotForm.amenities.split(',').map(a => a.trim()),
        vehicleTypes: editLotForm.vehicleTypes.split(',').map(v => v.trim()),
        totalSlots: parseInt(editLotForm.totalSlots)
      };
      
      await updateParkingLot(updatedLot);
      setShowEditLotModal(false);
      
      // Refresh parking lots
      const updatedLots = await getOwnerParkingLots(user.id);
      setParkingLots(updatedLots);
    } catch (err) {
      setError('Failed to update parking lot. Please try again.');
      console.error('Error updating parking lot:', err);
    }
  };
  
  const handleAddSlotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const newSlot = {
        parkingLotId: selectedLotId,
        number: slotForm.number,
        vehicleType: slotForm.vehicleType,
        status: slotForm.status
      };
      
      await createSlot(newSlot);
      setShowAddSlotModal(false);
      
      // Refresh slots
      const updatedSlots = await getParkingLotSlots(selectedLotId);
      setSlots(updatedSlots);
      
      // Reset form
      setSlotForm({
        number: '',
        vehicleType: '',
        status: 'FREE'
      });
    } catch (err) {
      setError('Failed to create slot. Please try again.');
      console.error('Error creating slot:', err);
    }
  };
  
  const handleUpdateSlotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const updatedSlot = {
        id: editSlotForm.id,
        number: editSlotForm.number,
        vehicleType: editSlotForm.vehicleType,
        status: editSlotForm.status
      };
      
      await updateSlot(updatedSlot);
      setShowEditSlotModal(false);
      
      // Refresh slots
      const updatedSlots = await getParkingLotSlots(selectedLotId);
      setSlots(updatedSlots);
    } catch (err) {
      setError('Failed to update slot. Please try again.');
      console.error('Error updating slot:', err);
    }
  };
  
  // Handle deletions
  const handleDeleteLot = async (lotId) => {
    if (window.confirm('Are you sure you want to delete this parking lot? This will also delete all associated slots and bookings.')) {
      try {
        await deleteParkingLot(lotId);
        
        // Refresh parking lots
        const updatedLots = await getOwnerParkingLots(user.id);
        setParkingLots(updatedLots);
        
        // If we were viewing slots for this lot, clear selection
        if (selectedLotId === lotId) {
          setSelectedLotId(null);
          setSlots([]);
        }
      } catch (err) {
        setError('Failed to delete parking lot. Please try again.');
        console.error('Error deleting parking lot:', err);
      }
    }
  };
  
  const handleDeleteSlot = async (slotId) => {
    if (window.confirm('Are you sure you want to delete this slot?')) {
      try {
        await deleteSlot(slotId);
        
        // Refresh slots
        const updatedSlots = await getParkingLotSlots(selectedLotId);
        setSlots(updatedSlots);
      } catch (err) {
        setError('Failed to delete slot. Please try again.');
        console.error('Error deleting slot:', err);
      }
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
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
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in as an owner to access this dashboard.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */} 
        <aside className="w-64 bg-white border-r border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Owner Dashboard</h2>
            <p className="text-gray-600 mb-6">Welcome back, {user.name || 'Owner'}!</p>
            
            <div className="space-y-4">
              <button
                onClick={() => setShowAddLotModal(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded"
              >
                Add Parking Lot
              </button>
              
              <button
                onClick={() => fetchOwnerBookings()}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded"
              >
                View All Bookings
              </button>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-6">
          {/* Modals */}
          {/* Add Parking Lot Modal */}
          {showAddLotModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96 max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Parking Lot</h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                    {error}
                  </div>
                )}
                <form onSubmit={handleAddLotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={lotForm.name}
                      onChange={handleLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={lotForm.address}
                      onChange={handleLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Hour ($)
                    </label>
                    <input
                      type="number"
                      name="pricePerHour"
                      value={lotForm.pricePerHour}
                      onChange={handleLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opening Hours
                    </label>
                    <input
                      type="text"
                      name="openingHours"
                      value={lotForm.openingHours}
                      onChange={handleLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amenities (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="amenities"
                      value={lotForm.amenities}
                      onChange={handleLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="EV Charging, Covered, Security"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Types (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="vehicleTypes"
                      value={lotForm.vehicleTypes}
                      onChange={handleLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Car, SUV, Motorcycle"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Slots
                    </label>
                    <input
                      type="number"
                      name="totalSlots"
                      value={lotForm.totalSlots}
                      onChange={handleLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowAddLotModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Add Parking Lot
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Edit Parking Lot Modal */}
          {showEditLotModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96 max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Parking Lot</h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                    {error}
                  </div>
                )}
                <form onSubmit={handleUpdateLotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editLotForm.name}
                      onChange={handleEditLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={editLotForm.address}
                      onChange={handleEditLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Hour ($)
                    </label>
                    <input
                      type="number"
                      name="pricePerHour"
                      value={editLotForm.pricePerHour}
                      onChange={handleEditLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opening Hours
                    </label>
                    <input
                      type="text"
                      name="openingHours"
                      value={editLotForm.openingHours}
                      onChange={handleEditLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amenities (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="amenities"
                      value={editLotForm.amenities}
                      onChange={handleEditLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="EV Charging, Covered, Security"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Types (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="vehicleTypes"
                      value={editLotForm.vehicleTypes}
                      onChange={handleEditLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Car, SUV, Motorcycle"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Slots
                    </label>
                    <input
                      type="number"
                      name="totalSlots"
                      value={editLotForm.totalSlots}
                      onChange={handleEditLotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowEditLotModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Update Parking Lot
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Add Slot Modal */}
          {showAddSlotModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96 max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Slot</h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                    {error}
                  </div>
                )}
                <form onSubmit={handleAddSlotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slot Number
                    </label>
                    <input
                      type="text"
                      name="number"
                      value={slotForm.number}
                      onChange={handleSlotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type
                    </label>
                    <input
                      type="text"
                      name="vehicleType"
                      value={slotForm.vehicleType}
                      onChange={handleSlotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={slotForm.status}
                      onChange={handleSlotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="FREE">Free</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowAddSlotModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Add Slot
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Edit Slot Modal */}
          {showEditSlotModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96 max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Slot</h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                    {error}
                  </div>
                )}
                <form onSubmit={handleUpdateSlotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slot Number
                    </label>
                    <input
                      type="text"
                      name="number"
                      value={editSlotForm.number}
                      onChange={handleEditSlotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type
                    </label>
                    <input
                      type="text"
                      name="vehicleType"
                      value={editSlotForm.vehicleType}
                      onChange={handleEditSlotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editSlotForm.status}
                      onChange={handleEditSlotChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="FREE">Free</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowEditSlotModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Update Slot
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Main content area */}
          {selectedLotId ? (
            // Show slots management for selected lot
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Manage Slots</h1>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setSelectedLotId(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    ← Back to Parking Lots
                  </button>
                  <button
                    onClick={() => setShowAddSlotModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Add Slot
                  </button>
                </div>
              </div>
              
              {lotLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {slots.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {slots.map((slot) => (
                        <div key={slot.id} className="p-6 hover:bg-gray-50 transition-background">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${slot.status === 'FREE' ? 'bg-green-500' : slot.status === 'RESERVED' ? 'bg-yellow-500' : slot.status === 'OCCUPIED' ? 'bg-red-500' : slot.status === 'MAINTENANCE' ? 'bg-orange-500' : 'bg-gray-500'}`}></div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    Slot {slot.number}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Vehicle Type: {slot.vehicleType}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0 space-x-3">
                              <button
                                onClick={() => {
                                  setEditSlotForm({
                                    id: slot.id,
                                    number: slot.number,
                                    vehicleType: slot.vehicleType,
                                    status: slot.status
                                  });
                                  setShowEditSlotModal(true);
                                }}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No slots found for this parking lot. Add some slots to get started.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Show parking lots list
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6">My Parking Lots</h1>
              
              {parkingLots.length > 0 ? (
                <div className="space-y-6">
                  {parkingLots.map((lot) => (
                    <div key={lot.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {lot.name}
                          </h2>
                          <p className="text-gray-600 mb-2">
                            {lot.address}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded">
                              {lot.totalSlots} Slots
                            </span>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded">
                              ${lot.pricePerHour}/hr
                            </span>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded">
                              {lot.openingHours}
                            </span>
                          </div>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Amenities</h3>
                            <div className="flex flex-wrap gap-2">
                              {lot.amenities.map((amenity, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-200 text-gray-800 text-sm rounded">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vehicle Types</h3>
                            <div className="flex flex-wrap gap-2">
                              {lot.vehicleTypes.map((type, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-200 text-gray-800 text-sm rounded">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="ml-6 flex-shrink-0 space-y-3">
                          <button
                            onClick={() => {
                              setEditLotForm({
                                id: lot.id,
                                name: lot.name,
                                address: lot.address,
                                pricePerHour: lot.pricePerHour,
                                openingHours: lot.openingHours,
                                amenities: lot.amenities.join(', '),
                                vehicleTypes: lot.vehicleTypes.join(', '),
                                totalSlots: lot.totalSlots
                              });
                              setShowEditLotModal(true);
                            }}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => fetchLotSlots(lot.id)}
                            className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            Manage Slots
                          </button>
                          <button
                            onClick={() => handleDeleteLot(lot.id)}
                            className="w-full mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">No Parking Lots Found</h2>
                  <p className="text-gray-600 mb-6">
                    You haven't added any parking lots yet. Click the button below to get started!
                  </p>
                  <button
                    onClick={() => setShowAddLotModal(true)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded"
                  >
                    Add First Parking Lot
                  </button>
                </div>
              )}
              
              {/* Bookings Section */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
                {bookingsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {bookings.slice(0, 5).map((booking) => (
                          <div key={booking.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {booking.parkingLot?.name || 'Unknown Parking Lot'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Slot {booking.slot?.number || 'Not Assigned'} • 
                                  {booking.vehicleType || 'Not Specified'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(booking.startTime).toLocaleString()} - 
                                  {new Date(booking.endTime).toLocaleString()}
                                </p>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <div className={(booking.status === 'ACTIVE' ? 'px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800' : booking.status === 'CANCELLED' ? 'px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800' : 'px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800')}>
                                  {booking.status}
                                </div>
                                <p className="mt-1 text-sm font-medium text-gray-600">
                                  {formatCurrency(booking.totalAmount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        No recent bookings found.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;