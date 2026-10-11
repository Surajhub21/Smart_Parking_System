import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getOwnerParkingLots,
  createParkingLot,
  updateParkingLot,
  deleteParkingLot,
  getParkingLotSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  getOwnerBookings,
  submitParkingLotForApproval
} from '../services/api';

const VEHICLE_OPTIONS = [
  { id: 'CAR', label: 'Car', icon: '🚗' },
  { id: 'MOTORCYCLE', label: 'Motorcycle / Bike', icon: '🏍️' },
  { id: 'EV', label: 'Electric Vehicle', icon: '⚡' },
  { id: 'BICYCLE', label: 'Bicycle', icon: '🚲' },
  { id: 'BUS', label: 'Bus', icon: '🚌' },
  { id: 'TRUCK', label: 'Truck', icon: '🚚' }
];

const AMENITY_OPTIONS = [
  { id: 'COVERED', label: 'Covered Roof', icon: '🛡️' },
  { id: 'CCTV', label: '24/7 CCTV', icon: '📹' },
  { id: 'EV_CHARGING', label: 'EV Charging', icon: '⚡' },
  { id: 'SECURITY_GUARD', label: 'Security Guard', icon: '👮' },
  { id: 'RESTROOM', label: 'Restrooms', icon: '🚻' },
  { id: 'WHEELCHAIR_ACCESSIBLE', label: 'Wheelchair Ramp', icon: '♿' },
  { id: 'LIGHTING', label: 'Night Lighting', icon: '💡' },
  { id: 'CAR_WASH', label: 'Car Wash', icon: '🧼' },
  { id: 'VALET', label: 'Valet Service', icon: '🤵' }
];

const KOLKATA_PRESETS = [
  { name: 'Mukundapur / EM Bypass', lat: 22.5032, lng: 88.4147, pincode: '700099', address: 'EM Bypass, Mukundapur, Kolkata' },
  { name: 'Park Street', lat: 22.5511, lng: 88.3524, pincode: '700016', address: 'Park Street Commercial Hub, Kolkata' },
  { name: 'Salt Lake Sector V', lat: 22.5804, lng: 88.4378, pincode: '700091', address: 'Sector V, Bidhannagar, Kolkata' },
  { name: 'New Town Eco Park', lat: 22.5867, lng: 88.4754, pincode: '700156', address: 'Major Arterial Road, New Town, Kolkata' },
  { name: 'Howrah Station Area', lat: 22.5850, lng: 88.3432, pincode: '711101', address: 'Station Approach Road, Howrah' }
];

const INITIAL_LOT_FORM = {
  name: '',
  description: '',
  address: '',
  city: 'Kolkata',
  state: 'West Bengal',
  pincode: '700099',
  latitude: 22.5032,
  longitude: 88.4147,
  pricePerHour: 30,
  openingHours: '24/7',
  totalSlots: 20,
  vehicleTypes: ['CAR', 'MOTORCYCLE'],
  amenities: ['COVERED', 'CCTV']
};

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tab & Data state
  const [activeTab, setActiveTab] = useState('lots'); // 'lots' | 'bookings'
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState('');
  
  // Feedback alerts
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Slots management
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [lotLoading, setLotLoading] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Modals
  const [showAddLotModal, setShowAddLotModal] = useState(false);
  const [showEditLotModal, setShowEditLotModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showEditSlotModal, setShowEditSlotModal] = useState(false);

  // Forms state
  const [lotForm, setLotForm] = useState(INITIAL_LOT_FORM);
  const [editLotForm, setEditLotForm] = useState(INITIAL_LOT_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [slotForm, setSlotForm] = useState({
    number: '',
    vehicleType: 'CAR',
    status: 'FREE'
  });
  const [editSlotForm, setEditSlotForm] = useState({
    id: '',
    number: '',
    vehicleType: 'CAR',
    status: 'FREE'
  });
  const [slotFormError, setSlotFormError] = useState('');
  const [slotSubmitting, setSlotSubmitting] = useState(false);

  // Auto-dismiss alerts
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(''), 7000);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // Fetch Owner's Parking Lots
  const loadOwnerLots = async () => {
    if (!user) return;
    setLoading(true);
    setInitialError('');
    try {
      const lots = await getOwnerParkingLots(user.id);
      setParkingLots(lots);
    } catch (err) {
      console.error('Error fetching owner lots:', err);
      setInitialError(err.message || 'Failed to load your parking lots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOwnerLots();
    fetchBookings();
  }, [user]);

  // Fetch slots for selected lot
  const fetchLotSlots = async (lotId) => {
    setSelectedLotId(lotId);
    setLotLoading(true);
    setActionError('');
    try {
      const lotSlots = await getParkingLotSlots(lotId);
      setSlots(lotSlots);
    } catch (err) {
      console.error('Error fetching parking lot slots:', err);
      setActionError('Could not load slots for this parking lot.');
    } finally {
      setLotLoading(false);
    }
  };

  // Fetch Bookings
  const fetchBookings = async () => {
    if (!user) return;
    setBookingsLoading(true);
    try {
      const res = await getOwnerBookings(user.id);
      setBookings(res);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  // GPS Current Location Detection
  const handleDetectLocation = (isEdit = false) => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    setFormError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        if (isEdit) {
          setEditLotForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
        } else {
          setLotForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
        }
        setDetectingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setDetectingLocation(false);
        setFormError('Could not auto-detect location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Apply Kolkata Area Preset
  const handleApplyPreset = (preset, isEdit = false) => {
    if (isEdit) {
      setEditLotForm(prev => ({
        ...prev,
        address: prev.address ? prev.address : preset.address,
        pincode: preset.pincode,
        latitude: preset.lat,
        longitude: preset.lng
      }));
    } else {
      setLotForm(prev => ({
        ...prev,
        address: prev.address ? prev.address : preset.address,
        pincode: preset.pincode,
        latitude: preset.lat,
        longitude: preset.lng
      }));
    }
  };

  // Vehicle Pill Toggle
  const toggleVehicleType = (id, isEdit = false) => {
    const updater = isEdit ? setEditLotForm : setLotForm;
    updater(prev => {
      const current = prev.vehicleTypes || [];
      if (current.includes(id)) {
        if (current.length === 1) return prev; // Keep at least one
        return { ...prev, vehicleTypes: current.filter(v => v !== id) };
      } else {
        return { ...prev, vehicleTypes: [...current, id] };
      }
    });
  };

  // Amenity Pill Toggle
  const toggleAmenity = (id, isEdit = false) => {
    const updater = isEdit ? setEditLotForm : setLotForm;
    updater(prev => {
      const current = prev.amenities || [];
      if (current.includes(id)) {
        return { ...prev, amenities: current.filter(a => a !== id) };
      } else {
        return { ...prev, amenities: [...current, id] };
      }
    });
  };

  // Open Edit Modal with lot's parsed data
  const handleOpenEditLot = (lot) => {
    // Map existing lot properties
    const mappedVehicles = (lot.rawSupportedVehicles && lot.rawSupportedVehicles.length > 0)
      ? lot.rawSupportedVehicles
      : (lot.vehicleTypes && lot.vehicleTypes.length > 0)
        ? lot.vehicleTypes.map(v => v.toUpperCase())
        : ['CAR'];

    const mappedAmenities = (lot.rawAmenities && lot.rawAmenities.length > 0)
      ? lot.rawAmenities
      : (lot.amenities && lot.amenities.length > 0)
        ? lot.amenities.map(a => a.toUpperCase().replace(/\s+/g, '_'))
        : ['COVERED'];

    setEditLotForm({
      id: lot.id,
      name: lot.name || '',
      description: lot.description || '',
      address: lot.address || '',
      city: lot.city || 'Kolkata',
      state: lot.state || 'West Bengal',
      pincode: lot.pincode || '700099',
      latitude: lot.latitude != null ? lot.latitude : 22.5032,
      longitude: lot.longitude != null ? lot.longitude : 88.4147,
      pricePerHour: lot.pricePerHour != null ? lot.pricePerHour : 30,
      openingHours: lot.openingHours || '24/7',
      totalSlots: lot.totalSlots || 20,
      vehicleTypes: mappedVehicles,
      amenities: mappedAmenities
    });
    setFormError('');
    setShowEditLotModal(true);
  };

  // Submit Add Lot
  const handleAddLotSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!lotForm.name?.trim()) {
      setFormError('Please enter a parking lot name.');
      return;
    }
    if (!lotForm.address?.trim()) {
      setFormError('Please enter a complete address.');
      return;
    }
    if (!lotForm.latitude || !lotForm.longitude) {
      setFormError('Valid latitude and longitude coordinates are required.');
      return;
    }
    if (!lotForm.vehicleTypes || lotForm.vehicleTypes.length === 0) {
      setFormError('Select at least one supported vehicle type.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: lotForm.name.trim(),
        description: lotForm.description.trim() || 'Secure and convenient parking facility.',
        address: lotForm.address.trim(),
        city: lotForm.city.trim() || 'Kolkata',
        state: lotForm.state.trim() || 'West Bengal',
        pincode: lotForm.pincode.trim() || '700099',
        latitude: parseFloat(lotForm.latitude),
        longitude: parseFloat(lotForm.longitude),
        totalSlots: parseInt(lotForm.totalSlots, 10) || 20,
        pricePerHour: parseFloat(lotForm.pricePerHour) || 30.0,
        openingHours: lotForm.openingHours.trim() || '24/7',
        vehicleTypes: lotForm.vehicleTypes,
        amenities: lotForm.amenities
      };

      const created = await createParkingLot(payload);
      setShowAddLotModal(false);
      setLotForm(INITIAL_LOT_FORM);
      setActionSuccess(`Parking lot "${created.name || payload.name}" created successfully as DRAFT! Submit it for admin approval when ready.`);
      await loadOwnerLots();
    } catch (err) {
      console.error('Error creating parking lot:', err);
      setFormError(err.message || 'Failed to create parking lot. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Lot
  const handleUpdateLotSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!editLotForm.name?.trim()) {
      setFormError('Please enter a parking lot name.');
      return;
    }
    if (!editLotForm.address?.trim()) {
      setFormError('Please enter an address.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: editLotForm.id,
        name: editLotForm.name.trim(),
        description: editLotForm.description.trim() || 'Secure and convenient parking facility.',
        address: editLotForm.address.trim(),
        city: editLotForm.city.trim() || 'Kolkata',
        state: editLotForm.state.trim() || 'West Bengal',
        pincode: editLotForm.pincode.trim() || '700099',
        latitude: parseFloat(editLotForm.latitude),
        longitude: parseFloat(editLotForm.longitude),
        totalSlots: parseInt(editLotForm.totalSlots, 10) || 20,
        pricePerHour: parseFloat(editLotForm.pricePerHour) || 30.0,
        openingHours: editLotForm.openingHours.trim() || '24/7',
        vehicleTypes: editLotForm.vehicleTypes,
        amenities: editLotForm.amenities
      };

      await updateParkingLot(payload);
      setShowEditLotModal(false);
      setActionSuccess(`Parking lot "${payload.name}" updated successfully.`);
      await loadOwnerLots();
    } catch (err) {
      console.error('Error updating parking lot:', err);
      setFormError(err.message || 'Failed to update parking lot.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Listing for Admin Approval
  const handleSubmitApproval = async (lotId, lotName) => {
    try {
      setActionError('');
      await submitParkingLotForApproval(lotId);
      setActionSuccess(`"${lotName}" submitted for Admin review. Once approved, it will be visible to drivers.`);
      await loadOwnerLots();
    } catch (err) {
      console.error('Submit for approval failed:', err);
      setActionError(err.message || 'Failed to submit parking lot for approval.');
    }
  };

  // Delete / Deactivate Lot
  const handleDeleteLot = async (lotId, lotName) => {
    if (!window.confirm(`Are you sure you want to deactivate "${lotName}"? It will no longer receive driver bookings.`)) {
      return;
    }
    try {
      setActionError('');
      await deleteParkingLot(lotId);
      setActionSuccess(`"${lotName}" has been deactivated.`);
      if (selectedLotId === lotId) {
        setSelectedLotId(null);
        setSlots([]);
      }
      await loadOwnerLots();
    } catch (err) {
      console.error('Error deleting lot:', err);
      setActionError(err.message || 'Failed to deactivate parking lot.');
    }
  };

  // Add Slot Submit
  const handleAddSlotSubmit = async (e) => {
    e.preventDefault();
    setSlotFormError('');

    if (!slotForm.number?.trim()) {
      setSlotFormError('Please enter a slot identifier (e.g. A-1).');
      return;
    }

    setSlotSubmitting(true);
    try {
      await createSlot({
        parkingLotId: selectedLotId,
        number: slotForm.number.trim(),
        vehicleType: slotForm.vehicleType,
        status: slotForm.status
      });
      setShowAddSlotModal(false);
      setSlotForm({ number: '', vehicleType: 'CAR', status: 'FREE' });
      setActionSuccess(`Slot ${slotForm.number} added successfully.`);
      const updatedSlots = await getParkingLotSlots(selectedLotId);
      setSlots(updatedSlots);
    } catch (err) {
      console.error('Error adding slot:', err);
      setSlotFormError(err.message || 'Failed to add slot.');
    } finally {
      setSlotSubmitting(false);
    }
  };

  // Update Slot Status
  const handleQuickStatusChange = async (slotId, newStatus) => {
    try {
      await updateSlot({ id: slotId, status: newStatus });
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, status: newStatus } : s));
      setActionSuccess('Slot status updated.');
    } catch (err) {
      console.error('Error updating slot status:', err);
      setActionError('Failed to change slot status.');
    }
  };

  // Delete Slot
  const handleDeleteSlot = async (slotId, slotNum) => {
    if (!window.confirm(`Delete slot ${slotNum}?`)) return;
    try {
      await deleteSlot(slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
      setActionSuccess(`Slot ${slotNum} deleted.`);
    } catch (err) {
      console.error('Error deleting slot:', err);
      setActionError('Failed to delete slot.');
    }
  };

  // Calculations for KPI Cards
  const totalLotsCount = parkingLots.length;
  const approvedLotsCount = parkingLots.filter(l => l.status === 'APPROVED').length;
  const pendingLotsCount = parkingLots.filter(l => l.status === 'PENDING_APPROVAL').length;
  const draftLotsCount = parkingLots.filter(l => l.status === 'DRAFT' || !l.status).length;
  const totalCapacitySum = parkingLots.reduce((acc, curr) => acc + (curr.totalSlots || 0), 0);

  // Selected Lot object if in slot management mode
  const currentSelectedLot = parkingLots.find(l => l.id === selectedLotId);

  // Format INR Currency
  const formatINR = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  if (loading && parkingLots.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-600 text-sm">P</div>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-800">Loading Owner Dashboard</h3>
        <p className="text-sm text-slate-500">Fetching your parking lots and properties in Kolkata...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20 text-slate-800">
      {/* Top Banner Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border-b border-indigo-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Owner Portal
                </span>
                <span className="text-xs text-slate-400">📍 Kolkata, West Bengal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Property & Parking Lot Manager
              </h1>
              <p className="text-sm text-slate-300 mt-0.5">
                Welcome back, <strong className="text-white">{user?.name || user?.email || 'Bob'}</strong>. Manage your facilities, slots, and track bookings.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                id="btn-add-parking-lot"
                onClick={() => {
                  setLotForm(INITIAL_LOT_FORM);
                  setFormError('');
                  setShowAddLotModal(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="text-lg leading-none">+</span>
                <span>Add Parking Lot</span>
              </button>

              <button
                type="button"
                onClick={loadOwnerLots}
                title="Refresh listings"
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-90 active:bg-slate-600 text-slate-300 hover:text-white border border-slate-700 transition-all shadow-sm cursor-pointer"
              >
                <svg
                  className="w-4 h-4 transition-transform duration-500 hover:rotate-180 active:rotate-90 text-slate-300 hover:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-xs font-medium text-slate-400">Total Properties</div>
              <div className="text-2xl font-black text-white mt-0.5">{totalLotsCount}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-xs font-medium text-slate-400">Active / Approved</div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">{approvedLotsCount}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-xs font-medium text-slate-400">Pending Review</div>
              <div className="text-2xl font-black text-sky-400 mt-0.5">{pendingLotsCount}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
              <div className="text-xs font-medium text-slate-400">Drafts</div>
              <div className="text-2xl font-black text-amber-400 mt-0.5">{draftLotsCount}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50 col-span-2 sm:col-span-1">
              <div className="text-xs font-medium text-slate-400">Total Slots</div>
              <div className="text-2xl font-black text-indigo-300 mt-0.5">{totalCapacitySum} slots</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Global Toast / Feedback Alerts */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-xl">✅</span>
              <p className="text-sm font-medium">{actionSuccess}</p>
            </div>
            <button
              onClick={() => setActionSuccess('')}
              className="text-emerald-600 hover:text-emerald-800 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {actionError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-medium">{actionError}</p>
            </div>
            <button
              onClick={() => setActionError('')}
              className="text-rose-600 hover:text-rose-800 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {initialError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-semibold">{initialError}</p>
              <p className="text-xs text-amber-600 mt-0.5">Please check backend connectivity or session validity.</p>
            </div>
            <button
              onClick={loadOwnerLots}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* View Mode: If Managing Slots for a Lot */}
        {selectedLotId ? (
          <div className="space-y-6">
            {/* Slot View Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <button
                  onClick={() => setSelectedLotId(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-2 transition"
                >
                  <span>←</span> Back to All Parking Lots
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {currentSelectedLot?.name || 'Parking Lot Slots'}
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {slots.length} Slots
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  📍 {currentSelectedLot?.address} • Rate: {formatINR(currentSelectedLot?.pricePerHour)}/hr
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSlotForm({ number: `S-${slots.length + 1}`, vehicleType: 'CAR', status: 'FREE' });
                    setSlotFormError('');
                    setShowAddSlotModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition"
                >
                  <span>+</span> Add Slot
                </button>
              </div>
            </div>

            {/* Slots Grid */}
            {lotLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-slate-500 mt-3">Loading slots layout...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                <div className="text-4xl mb-3">🅿️</div>
                <h3 className="text-lg font-bold text-slate-800">No Parking Slots Configured</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  You haven't defined individual parking slots yet. Add your first slot or configure slots to monitor real-time vehicle occupancy.
                </p>
                <button
                  onClick={() => {
                    setSlotForm({ number: 'A-1', vehicleType: 'CAR', status: 'FREE' });
                    setShowAddSlotModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  + Add First Slot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {slots.map((slot) => {
                  const isFree = slot.status === 'FREE';
                  const isOccupied = slot.status === 'OCCUPIED';
                  const isReserved = slot.status === 'RESERVED';

                  return (
                    <div
                      key={slot.id}
                      className={`relative rounded-xl p-4 border transition-all shadow-sm ${
                        isFree
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : isOccupied
                          ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                          : isReserved
                          ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {slot.vehicleType || 'CAR'}
                        </span>
                        <button
                          onClick={() => handleDeleteSlot(slot.id, slot.number)}
                          title="Delete Slot"
                          className="text-slate-400 hover:text-rose-600 text-sm"
                        >
                          ×
                        </button>
                      </div>

                      <div className="text-xl font-black tracking-tight">{slot.number}</div>

                      {/* Status Dropdown */}
                      <div className="mt-3">
                        <select
                          value={slot.status}
                          onChange={(e) => handleQuickStatusChange(slot.id, e.target.value)}
                          className="w-full text-xs font-semibold py-1 px-2 rounded-lg bg-white border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="FREE">🟢 Free</option>
                          <option value="OCCUPIED">🔴 Occupied</option>
                          <option value="RESERVED">🟡 Reserved</option>
                          <option value="MAINTENANCE">⚪ Maintenance</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Normal Dashboard View: Lots List & Bookings Tab */
          <div className="space-y-6">
            {/* Tab navigation */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('lots')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                    activeTab === 'lots'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  🅿️ My Parking Lots ({parkingLots.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('bookings');
                    fetchBookings();
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                    activeTab === 'bookings'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  📋 Driver Bookings ({bookings.length})
                </button>
              </div>

              <div className="text-xs text-slate-500 hidden sm:block">
                Showing Kolkata area registered properties
              </div>
            </div>

            {/* Parking Lots Tab */}
            {activeTab === 'lots' && (
              <div>
                {parkingLots.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                      🚗
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No Parking Lots Added Yet</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
                      Add your first parking property in Kolkata to begin hosting drivers and receiving parking reservations.
                    </p>
                    <button
                      onClick={() => {
                        setLotForm(INITIAL_LOT_FORM);
                        setShowAddLotModal(true);
                      }}
                      className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/30 transition hover:scale-105"
                    >
                      + Add Parking Lot Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {parkingLots.map((lot) => {
                      const isApproved = lot.status === 'APPROVED';
                      const isPending = lot.status === 'PENDING_APPROVAL';
                      const isDraft = lot.status === 'DRAFT' || !lot.status;
                      const isRejected = lot.status === 'REJECTED';

                      return (
                        <div
                          key={lot.id}
                          className="bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top: Title & Status Badge */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                  {lot.name}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                  <span>📍</span> {lot.address}
                                </p>
                              </div>

                              <div>
                                {isApproved && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    APPROVED
                                  </span>
                                )}
                                {isPending && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                    PENDING REVIEW
                                  </span>
                                )}
                                {isDraft && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    <span>📝</span> DRAFT
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <span>❌</span> REJECTED
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Coordinates and Location Pill */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 mt-2 mb-4">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-700">
                                🌐 {lot.latitude?.toFixed(4)}, {lot.longitude?.toFixed(4)}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100">
                                🏙️ {lot.city || 'Kolkata'} {lot.pincode ? `(${lot.pincode})` : ''}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100">
                                🕒 {lot.openingHours || '24/7'}
                              </span>
                            </div>

                            {/* Core Specs: Capacity & Price */}
                            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                              <div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase">Rate per Hour</div>
                                <div className="text-xl font-extrabold text-indigo-600">
                                  {formatINR(lot.pricePerHour)}
                                  <span className="text-xs text-slate-500 font-normal"> /hr</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] font-semibold text-slate-400 uppercase">Capacity / Slots</div>
                                <div className="text-xl font-extrabold text-slate-800">
                                  {lot.totalSlots}
                                  <span className="text-xs text-slate-500 font-normal"> Total</span>
                                </div>
                              </div>
                            </div>

                            {/* Amenities and Supported Vehicles Badges */}
                            <div className="space-y-2 mb-6">
                              <div>
                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                  Supported Vehicles
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {lot.vehicleTypes && lot.vehicleTypes.length > 0 ? (
                                    lot.vehicleTypes.map((v, i) => (
                                      <span
                                        key={i}
                                        className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100"
                                      >
                                        {v}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-400">Cars, Motorcycles</span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                  Amenities
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {lot.amenities && lot.amenities.length > 0 ? (
                                    lot.amenities.map((a, i) => (
                                      <span
                                        key={i}
                                        className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                                      >
                                        {a}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-400">Covered, Security</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons Toolbar */}
                          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Submit for Approval if Draft */}
                              {isDraft && (
                                <button
                                  onClick={() => handleSubmitApproval(lot.id, lot.name)}
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
                                >
                                  🚀 Submit for Approval
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEditLot(lot)}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                onClick={() => fetchLotSlots(lot.id)}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                              >
                                🅿️ Manage Slots
                              </button>
                            </div>

                            <button
                              onClick={() => handleDeleteLot(lot.id, lot.name)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                              title="Deactivate listing"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Driver Reservations & Bookings</h3>
                    <p className="text-xs text-slate-500">Live booking records for your parking spaces.</p>
                  </div>
                  <button
                    onClick={fetchBookings}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Refresh Bookings
                  </button>
                </div>

                {bookingsLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-500 mt-2">Fetching bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-3xl mb-2">📅</div>
                    <p className="font-semibold text-slate-700">No Bookings Yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Once drivers find and reserve slots in your approved Kolkata lots, they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {b.parkingLot?.name || 'Kolkata Parking Lot'}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Slot: <span className="font-semibold text-slate-700">{b.slotNumber || 'A-1'}</span> •{' '}
                            Vehicle: <span className="font-semibold text-slate-700">{b.vehicleType}</span> •{' '}
                            Plate: {b.vehicleNumber || 'WB-01-XXXX'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            From: {new Date(b.startTime).toLocaleString()}
                          </div>
                        </div>

                        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            b.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {b.status}
                          </span>
                          <span className="text-sm font-extrabold text-slate-900 mt-1">
                            {formatINR(b.totalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* ADD PARKING LOT MODAL                                    */}
      {/* ======================================================== */}
      {showAddLotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-100 overflow-hidden">
            {/* Modal Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>🅿️</span> Add New Parking Lot
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register your parking facility in Kolkata with coordinates and pricing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLotModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 font-bold flex items-center justify-center transition"
              >
                ×
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddLotSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span> {formError}
                </div>
              )}

              {/* 1. Facility Name & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Parking Facility Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lotForm.name}
                    onChange={(e) => setLotForm({ ...lotForm, name: e.target.value })}
                    placeholder="e.g. Mukundapur Metro Parking Hub"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={lotForm.description}
                    onChange={(e) => setLotForm({ ...lotForm, description: e.target.value })}
                    placeholder="e.g. Secure multi-level basement parking with CCTV and EV chargers"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              {/* 2. Address, City, Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lotForm.address}
                    onChange={(e) => setLotForm({ ...lotForm, address: e.target.value })}
                    placeholder="e.g. 100 EM Bypass, Mukundapur"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={lotForm.pincode}
                    onChange={(e) => setLotForm({ ...lotForm, pincode: e.target.value })}
                    placeholder="700099"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              {/* 3. Location & GPS Coordinates with Presets */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      GPS Coordinates (Latitude & Longitude)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Required so drivers can find your lot on the interactive map.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDetectLocation(false)}
                    disabled={detectingLocation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                  >
                    {detectingLocation ? '📍 Detecting...' : '📍 Use My GPS'}
                  </button>
                </div>

                {/* Kolkata Area Quick Presets */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                    Or select Kolkata location preset:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {KOLKATA_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(p, false)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 font-medium transition"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Latitude (°N) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lotForm.latitude}
                      onChange={(e) => setLotForm({ ...lotForm, latitude: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Longitude (°E) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lotForm.longitude}
                      onChange={(e) => setLotForm({ ...lotForm, longitude: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Rates & Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Price per Hour (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={lotForm.pricePerHour}
                      onChange={(e) => setLotForm({ ...lotForm, pricePerHour: e.target.value })}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Total Slots / Capacity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={lotForm.totalSlots}
                    onChange={(e) => setLotForm({ ...lotForm, totalSlots: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={lotForm.openingHours}
                    onChange={(e) => setLotForm({ ...lotForm, openingHours: e.target.value })}
                    placeholder="24/7 or 6:00 AM - 11:00 PM"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              {/* 5. Supported Vehicle Types Pills */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Supported Vehicles (Tap to toggle) <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_OPTIONS.map((v) => {
                    const isSelected = lotForm.vehicleTypes?.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVehicleType(v.id, false)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span>{v.icon}</span>
                        <span>{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Amenities Pills */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Facility Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((a) => {
                    const isSelected = lotForm.amenities?.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAmenity(a.id, false)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span>{a.icon}</span>
                        <span>{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddLotModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Parking Lot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT PARKING LOT MODAL                                   */}
      {/* ======================================================== */}
      {showEditLotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>✏️</span> Edit Parking Lot
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update details, pricing, and operating rules for this facility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditLotModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 font-bold flex items-center justify-center transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateLotSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Parking Facility Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editLotForm.name}
                    onChange={(e) => setEditLotForm({ ...editLotForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editLotForm.description}
                    onChange={(e) => setEditLotForm({ ...editLotForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editLotForm.address}
                    onChange={(e) => setEditLotForm({ ...editLotForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={editLotForm.pincode}
                    onChange={(e) => setEditLotForm({ ...editLotForm, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    GPS Coordinates
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDetectLocation(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    📍 Use My Location
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editLotForm.latitude}
                      onChange={(e) => setEditLotForm({ ...editLotForm, latitude: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editLotForm.longitude}
                      onChange={(e) => setEditLotForm({ ...editLotForm, longitude: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Price per Hour (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={editLotForm.pricePerHour}
                      onChange={(e) => setEditLotForm({ ...editLotForm, pricePerHour: e.target.value })}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Total Slots <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editLotForm.totalSlots}
                    onChange={(e) => setEditLotForm({ ...editLotForm, totalSlots: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    value={editLotForm.openingHours}
                    onChange={(e) => setEditLotForm({ ...editLotForm, openingHours: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              {/* Supported Vehicles */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Supported Vehicles
                </label>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_OPTIONS.map((v) => {
                    const isSelected = editLotForm.vehicleTypes?.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVehicleType(v.id, true)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span>{v.icon}</span>
                        <span>{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((a) => {
                    const isSelected = editLotForm.amenities?.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAmenity(a.id, true)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span>{a.icon}</span>
                        <span>{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditLotModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD SLOT MODAL                                           */}
      {/* ======================================================== */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Add Parking Slot</h3>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {slotFormError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                ⚠️ {slotFormError}
              </div>
            )}

            <form onSubmit={handleAddSlotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Slot Identifier (Number / Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slotForm.number}
                  onChange={(e) => setSlotForm({ ...slotForm, number: e.target.value })}
                  placeholder="e.g. A-01, B-12"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={slotForm.vehicleType}
                  onChange={(e) => setSlotForm({ ...slotForm, vehicleType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CAR">🚗 Car</option>
                  <option value="MOTORCYCLE">🏍️ Motorcycle</option>
                  <option value="EV">⚡ EV</option>
                  <option value="BICYCLE">🚲 Bicycle</option>
                  <option value="BUS">🚌 Bus</option>
                  <option value="TRUCK">🚚 Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Initial Status
                </label>
                <select
                  value={slotForm.status}
                  onChange={(e) => setSlotForm({ ...slotForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="FREE">🟢 Free (Available)</option>
                  <option value="OCCUPIED">🔴 Occupied</option>
                  <option value="RESERVED">🟡 Reserved</option>
                  <option value="MAINTENANCE">⚪ Maintenance</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slotSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  {slotSubmitting ? 'Adding...' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;