import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getUserBookings, cancelBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

const BookingHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingBookingId, setCancelingBookingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const fetchBookings = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userBookings = await getUserBookings(user.id);
      setBookings(userBookings || []);
    } catch (err) {
      setError('Failed to load booking history. Please try again.');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleCancelBooking = async (bookingId, slotName) => {
    if (!window.confirm(`Are you sure you want to cancel your reservation for ${slotName || 'this slot'}?`)) {
      return;
    }

    setCancelingBookingId(bookingId);
    try {
      await cancelBooking(bookingId);
      setSuccessMsg('Reservation cancelled successfully.');
      await fetchBookings();
    } catch (err) {
      setError(err.message || 'Failed to cancel booking. Please try again.');
      console.error('Error cancelling booking:', err);
    } finally {
      setCancelingBookingId(null);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = String(status).toUpperCase();
    if (s === 'CONFIRMED' || s === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          CONFIRMED
        </span>
      );
    }
    if (s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
          COMPLETED
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
          CANCELLED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
        {s}
      </span>
    );
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Retrieving your reservations...</p>
      </div>
    );
  }

  const activeCount = bookings.filter(
    (b) => String(b.status).toUpperCase() === 'CONFIRMED' || String(b.status).toUpperCase() === 'ACTIVE'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Driver Portal
              </span>
              <span className="text-xs text-slate-400">• Kolkata, WB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Parking Bookings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              View active reservations, timing windows, assigned slots, and payment receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition"
            >
              <span>+</span> Find Parking
            </Link>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold">
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-700 hover:text-rose-900 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Status Filter Bar */}
        <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs font-bold text-slate-800">
            Total Bookings: {bookings.length}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
            Active / Confirmed: {activeCount}
          </span>
        </div>

        {/* Empty State */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mx-auto mb-4">
              🅿️
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Parking Bookings Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              You haven't reserved any parking spots yet. Search for facilities in Kolkata on the interactive map to book your first slot.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/30 transition hover:scale-105"
            >
              Search Available Lots Now
            </Link>
          </div>
        ) : (
          /* Bookings Card List */
          <div className="space-y-4">
            {bookings.map((booking) => {
              const statusUpper = String(booking.status).toUpperCase();
              const isCancelable = statusUpper === 'CONFIRMED' || statusUpper === 'ACTIVE';
              const vehicleUpper = String(booking.vehicleType || 'CAR').toUpperCase();
              const vehicleIcon = VEHICLE_ICONS[vehicleUpper] || '🚗';
              const slotLabel = booking.slot?.number || booking.slotNumber || 'Assigned Bay';
              const facilityName = booking.parkingLot?.name || 'Kolkata Parking Facility';
              const facilityAddress =
                booking.parkingLot?.address && booking.parkingLot.address !== 'Address not available'
                  ? booking.parkingLot.address
                  : 'Kolkata, West Bengal';

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-indigo-300 shadow-sm transition-all"
                >
                  {/* Top Row: Icon, Titles, and Status Pill */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3.5">
                      {/* Facility Icon Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">
                        {vehicleIcon}
                      </div>

                      {/* Main Title & Reference */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">
                            {facilityName}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                            #{booking.bookingReference || String(booking.id).slice(-8).toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <span>📍</span> {facilityAddress}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="self-start sm:self-auto flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>

                  {/* Timing Schedule Ribbon */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400">🕒 RESERVED WINDOW:</span>
                      <span className="font-semibold text-slate-800">
                        {formatDateTime(booking.startTime)}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-slate-800">
                        {formatDateTime(booking.endTime)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      Booked on: {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  {/* Grid of Key Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-t border-b border-slate-100 text-xs">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400">Assigned Slot</div>
                      <div className="text-sm font-extrabold text-indigo-600 mt-0.5">
                        Slot {slotLabel}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400">Vehicle Type</div>
                      <div className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                        <span>{vehicleIcon}</span>
                        <span>{booking.vehicleType || 'Car'}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400">License Plate</div>
                      <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                        {booking.vehicleNumber || 'WB-01-XXXX'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-400">Total Paid</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {formatINR(booking.totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Bottom Toolbar */}
                  <div className="pt-4 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400">
                      Payment Status: <strong className="text-emerald-600 font-bold">Completed (Online)</strong>
                    </div>

                    {isCancelable && (
                      <button
                        onClick={() => handleCancelBooking(booking.id, `Slot ${slotLabel}`)}
                        disabled={cancelingBookingId === booking.id}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition disabled:opacity-50"
                      >
                        {cancelingBookingId === booking.id ? 'Cancelling...' : 'Cancel Reservation'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;