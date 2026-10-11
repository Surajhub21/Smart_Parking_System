import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchParkingLotById, createBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

const VEHICLE_ICONS = {
  CAR: '🚗',
  MOTORCYCLE: '🏍️',
  EV: '⚡',
  BICYCLE: '🚲',
  BUS: '🚌',
  TRUCK: '🚚'
};

const formatINR = (amt) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amt || 0);

const ParkingLotDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const [parkingLot, setParkingLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // In-page Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(2); // hours
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Helper to format ISO datetime to datetime-local input format (YYYY-MM-DDTHH:MM)
  const toLocalInputFormat = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  const loadParkingLot = async () => {
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

  useEffect(() => {
    loadParkingLot();
  }, [id]);

  // When user clicks "Book This Slot"
  const handleOpenBooking = (slot) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const now = new Date();
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    setSelectedSlot(slot);
    setSelectedDuration(2);
    setStartTime(toLocalInputFormat(now));
    setEndTime(toLocalInputFormat(end));
    setVehicleNumber(user.phone ? `WB-${user.phone.slice(-4)}` : 'WB-02-AB1234');
    setBookingError('');
    setConfirmedBooking(null);
    setShowBookingModal(true);
  };

  // Adjust duration via preset pills (1h, 2h, 3h, 4h)
  const handleDurationPreset = (hours) => {
    setSelectedDuration(hours);
    const start = startTime ? new Date(startTime) : new Date();
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    setEndTime(toLocalInputFormat(end));
  };

  // Calculate dynamic duration in hours
  const calculateDurationHours = () => {
    if (!startTime || !endTime) return selectedDuration || 2;
    const diffMs = new Date(endTime) - new Date(startTime);
    if (diffMs <= 0) return 1;
    const hrs = diffMs / (1000 * 60 * 60);
    return Math.max(1, Math.round(hrs * 10) / 10);
  };

  const currentDuration = calculateDurationHours();
  const hourlyRate = parkingLot?.pricePerHour || 30;
  const calculatedTotal = currentDuration * hourlyRate;

  // Handle in-page booking confirmation submit
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!selectedSlot) {
      setBookingError('No slot selected.');
      return;
    }

    const startObj = new Date(startTime);
    const endObj = new Date(endTime);

    if (endObj <= startObj) {
      setBookingError('End time must be after start time.');
      return;
    }

    setBookingLoading(true);

    try {
      const payload = {
        parkingLotId: parkingLot.id,
        slotId: selectedSlot.id,
        durationHours: currentDuration,
        vehicleNumber: vehicleNumber.trim() || 'WB-01-XXXX',
        parkingLot: {
          id: parkingLot.id,
          name: parkingLot.name,
          address: parkingLot.address
        },
        slot: {
          id: selectedSlot.id,
          number: selectedSlot.number || selectedSlot.slotNumber || 'A-1'
        },
        slotNumber: selectedSlot.number || selectedSlot.slotNumber || 'A-1',
        vehicleType: selectedSlot.vehicleType || 'CAR',
        startTime,
        endTime,
        totalAmount: calculatedTotal
      };

      const result = await createBooking(payload);
      setConfirmedBooking(result);

      // Refresh slot occupancy status on current page in background
      await loadParkingLot();
    } catch (err) {
      console.error('Booking submission failed:', err);
      setBookingError(err.message || 'Failed to confirm booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedSlot(null);
    setConfirmedBooking(null);
  };

  if (loading && !parkingLot) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading parking facility details...</p>
      </div>
    );
  }

  if (error || !parkingLot) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{error || 'Parking Lot Not Found'}</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          The requested parking facility could not be retrieved from the database.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
        >
          ← Return to Map Search
        </button>
      </div>
    );
  }

  const isFav = isFavorite(parkingLot.id);

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20 text-slate-800">
      {/* Top Breadcrumb & Navigation */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            <span>←</span> Back to Live Map
          </Link>
          <div className="text-xs font-medium text-slate-500">
            📍 {parkingLot.city || 'Kolkata'}, {parkingLot.state || 'West Bengal'}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ======================================================== */}
          {/* LEFT SIDEBAR: FACILITY DETAILS & PRICING                 */}
          {/* ======================================================== */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    VERIFIED FACILITY
                  </span>
                  <span className="text-xs text-slate-400">ID: {parkingLot.id.slice(-6)}</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {parkingLot.name}
                </h1>
                <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                  <span>📍</span> {parkingLot.address}
                </p>
              </div>

              {/* Favorite Action */}
              <button
                onClick={() => (isFav ? removeFavorite(parkingLot.id) : addFavorite(parkingLot.id))}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isFav
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{isFav ? '❤️ Saved to Favorites' : '🤍 Save to Favorites'}</span>
              </button>

              {/* Pricing & Availability Overview */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100">
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-400">Hourly Rate</div>
                  <div className="text-2xl font-black text-indigo-600 mt-0.5">
                    {formatINR(parkingLot.pricePerHour)}
                    <span className="text-xs font-normal text-slate-500">/hr</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-400">Available Slots</div>
                  <div className="text-2xl font-black text-emerald-600 mt-0.5">
                    {parkingLot.availableSlots}
                    <span className="text-xs font-normal text-slate-500"> / {parkingLot.totalSlots}</span>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-500">Operating Schedule</span>
                <span className="font-bold text-slate-800">🕒 {parkingLot.openingHours || '24/7 Open'}</span>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Facility Amenities
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {parkingLot.amenities && parkingLot.amenities.length > 0 ? (
                    parkingLot.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium"
                      >
                        {amenity}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Covered, Security</span>
                  )}
                </div>
              </div>

              {/* Supported Vehicle Types */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Supported Vehicles
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {parkingLot.vehicleTypes && parkingLot.vehicleTypes.length > 0 ? (
                    parkingLot.vehicleTypes.map((v, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-100 flex items-center gap-1"
                      >
                        <span>{VEHICLE_ICONS[String(v).toUpperCase()] || '🚗'}</span>
                        <span>{v}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Car, Motorcycle</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT MAIN CONTENT: AVAILABLE SLOTS & REAL-TIME BOOKING  */}
          {/* ======================================================== */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-2">About This Parking Lot</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {parkingLot.description ||
                  `Secure automated parking facility with ${parkingLot.totalSlots} designated spaces located in ${parkingLot.city || 'Kolkata'}. Includes round-the-clock surveillance, covered bays, and fast check-in.`}
              </p>
            </div>

            {/* Slots List Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Available Parking Slots</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click "Book This Slot" to reserve your spot with guaranteed timing. Vehicle type is automatically matched.
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                  {parkingLot.availableSlots} Slots Free Now
                </span>
              </div>

              {parkingLot.slots && parkingLot.slots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {parkingLot.slots.map((slot) => {
                    const isFree = slot.status === 'FREE';
                    const isOccupied = slot.status === 'OCCUPIED';
                    const isReserved = slot.status === 'RESERVED';
                    const slotNum = slot.number || slot.slotNumber || 'Slot';
                    const slotVehicle = slot.vehicleType || 'CAR';
                    const icon = VEHICLE_ICONS[slotVehicle.toUpperCase()] || '🚗';

                    return (
                      <div
                        key={slot.id}
                        className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                          isFree
                            ? 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
                            : 'bg-slate-50/70 border-slate-200/60 opacity-80'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{icon}</span>
                              <div>
                                <h3 className="text-lg font-black text-slate-900 leading-tight">
                                  Slot {slotNum}
                                </h3>
                                <p className="text-xs font-semibold text-slate-500">
                                  Vehicle: {slotVehicle}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isFree
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isOccupied
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isFree ? 'bg-emerald-500 animate-pulse' : isOccupied ? 'bg-rose-500' : 'bg-amber-500'
                                }`}
                              />
                              {slot.status}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 mb-4 flex items-center justify-between">
                            <span>Rate: {formatINR(parkingLot.pricePerHour)}/hr</span>
                            <span>Dedicated Bay</span>
                          </div>
                        </div>

                        {/* Booking Action */}
                        {isFree ? (
                          <button
                            onClick={() => handleOpenBooking(slot)}
                            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-sm shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                          >
                            Book This Slot ({slotVehicle})
                          </button>
                        ) : (
                          <div className="w-full py-2 px-4 rounded-xl text-center text-xs font-semibold bg-slate-200/80 text-slate-600 cursor-not-allowed">
                            Currently {isOccupied ? 'Occupied' : 'Reserved'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <div className="text-3xl mb-2">🅿️</div>
                  <p className="font-semibold text-slate-700">No Individual Slots Defined</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Facility has general open capacity of {parkingLot.totalSlots} spaces.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* IN-PAGE POPUP / MODAL: BOOKING WITH TIMING & CONFIRMATION */}
      {/* ======================================================== */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>🅿️</span> {confirmedBooking ? 'Reservation Confirmed' : 'Book Parking Slot'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {parkingLot.name} • Slot {selectedSlot.number || selectedSlot.slotNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 font-bold flex items-center justify-center transition"
              >
                ×
              </button>
            </div>

            {/* Modal Content: Form or Instant Confirmation */}
            {confirmedBooking ? (
              /* SUCCESS STATE (In-page Confirmation Step) */
              <div className="p-6 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  ✓
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Booking Success
                  </span>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">Your Spot is Reserved!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Booking Reference: <strong className="text-slate-800 font-mono text-sm">{confirmedBooking.bookingReference || confirmedBooking.id}</strong>
                  </p>
                </div>

                {/* Booking Receipt Summary Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Facility:</span>
                    <strong className="text-slate-900 text-right">{parkingLot.name}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Reserved Slot:</span>
                    <strong className="text-indigo-600 font-bold">
                      Slot {confirmedBooking.slotNumber || selectedSlot.number} ({selectedSlot.vehicleType})
                    </strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Vehicle Registration:</span>
                    <strong className="font-mono text-slate-800">{confirmedBooking.vehicleNumber || vehicleNumber}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500">Duration:</span>
                    <span>{confirmedBooking.durationHours || currentDuration} hour(s)</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-700 font-bold">Total Amount Paid:</span>
                    <strong className="text-slate-900 font-black text-sm">{formatINR(confirmedBooking.totalAmount || calculatedTotal)}</strong>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Done (Back to Lot)
                  </button>
                  <Link
                    to="/bookings"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition text-center"
                  >
                    View in My Bookings →
                  </Link>
                </div>
              </div>
            ) : (
              /* FORM STATE: TIMING & VEHICLE DETAILS */
              <form onSubmit={handleConfirmBooking} className="p-6 space-y-5">
                {bookingError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <span>⚠️</span> {bookingError}
                  </div>
                )}

                {/* 1. Slot & Auto-selected Vehicle Type Banner */}
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{VEHICLE_ICONS[selectedSlot.vehicleType?.toUpperCase()] || '🚗'}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Slot {selectedSlot.number || selectedSlot.slotNumber}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-medium">
                        Pre-matched for: <strong>{selectedSlot.vehicleType}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">{formatINR(hourlyRate)}/hr</div>
                    <div className="text-[11px] text-slate-500">Hourly Rate</div>
                  </div>
                </div>

                {/* 2. Quick Duration Presets */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Parking Duration
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => handleDurationPreset(hrs)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                          selectedDuration === hrs
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Start & End Time Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                  </div>
                </div>

                {/* 4. Vehicle Number Plate */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Vehicle Registration Number (Plate)
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. WB-02-AB1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                {/* 5. Cost Summary Calculation Bar */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">
                      {currentDuration} hour(s) × {formatINR(hourlyRate)}/hr
                    </div>
                    <div className="text-xs font-bold text-slate-800">Total Reservation Cost</div>
                  </div>
                  <div className="text-xl font-black text-indigo-600">{formatINR(calculatedTotal)}</div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                  >
                    {bookingLoading ? 'Reserving...' : `Confirm Booking • ${formatINR(calculatedTotal)}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingLotDetails;