import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { fetchParkingLotById } from '../services/api';

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

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();
  const [favoriteLots, setFavoriteLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Auto-dismiss notification
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  useEffect(() => {
    const loadFavoriteLots = async () => {
      if (favorites.length === 0) {
        setFavoriteLots([]);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const lotPromises = favorites.map((id) => fetchParkingLotById(id));
        const lots = await Promise.all(lotPromises);
        // Filter out any null or not-found lots
        setFavoriteLots(lots.filter(Boolean));
      } catch (err) {
        setError('Failed to load favorite parking lots.');
        console.error('Error loading favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteLots();
  }, [favorites]);

  const handleRemove = (lotId, lotName) => {
    removeFavorite(lotId);
    setToastMsg(`Removed "${lotName}" from favorites.`);
  };

  if (loading && favoriteLots.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading your saved parking lots...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Top Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Driver Bookmarks
              </span>
              <span className="text-xs text-slate-400">• Kolkata, WB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Favorite Parking Facilities
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Quickly check real-time available bays, hourly rates, and reserve parking at your saved hubs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition"
            >
              <span>+</span> Search More Parking
            </Link>
          </div>
        </div>

        {/* Global Toast */}
        {toastMsg && (
          <div className="p-4 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <span>🤍</span>
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg('')} className="text-slate-400 hover:text-white font-bold">
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-700 hover:text-rose-900 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Empty State */}
        {favoriteLots.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center border border-slate-200/90 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
              🤍
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Favorite Parking Lots Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              When viewing a parking lot on the live map, click "Save to Favorites" to quickly access and book it from here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/30 transition hover:scale-105"
            >
              Browse Kolkata Map
            </Link>
          </div>
        ) : (
          /* Favorites Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteLots.map((lot) => {
              const available = lot.availableSlots || 0;
              const total = lot.totalSlots || 20;
              const isFull = available <= 0;
              const percentFree = Math.min(100, Math.round((available / total) * 100));

              return (
                <div
                  key={lot.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header: Category & Heart Remove Button */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        📍 {lot.city || 'Kolkata'}
                      </span>

                      <button
                        onClick={() => handleRemove(lot.id, lot.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition"
                        title="Remove from favorites"
                      >
                        <span>❤️</span>
                        <span>Remove</span>
                      </button>
                    </div>

                    {/* Facility Name & Address */}
                    <div className="mb-4">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                        {lot.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                        <span className="text-slate-400">📍</span>
                        <span>{lot.address}</span>
                      </p>
                    </div>

                    {/* Key Metrics: Price & Available Slots */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-400">Hourly Rate</div>
                        <div className="text-xl font-black text-indigo-600 mt-0.5">
                          {formatINR(lot.pricePerHour)}
                          <span className="text-xs font-normal text-slate-500">/hr</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-400">Availability</div>
                        <div className="text-xl font-black text-slate-900 mt-0.5">
                          <span className={isFull ? 'text-rose-600' : 'text-emerald-600'}>
                            {available}
                          </span>
                          <span className="text-xs font-normal text-slate-500"> / {total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar of Available Capacity */}
                    <div className="mb-4 space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-500">
                        <span>Space Occupancy</span>
                        <span>{percentFree}% Available</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull ? 'bg-rose-500' : percentFree < 25 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentFree}%` }}
                        />
                      </div>
                    </div>

                    {/* Schedule & Vehicle compatibility */}
                    <div className="space-y-2 mb-5">
                      <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 text-slate-600">
                        <span className="font-semibold text-slate-500">Hours</span>
                        <span className="font-bold text-slate-800">🕒 {lot.openingHours || '24/7'}</span>
                      </div>

                      {lot.vehicleTypes && lot.vehicleTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {lot.vehicleTypes.slice(0, 3).map((v, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1"
                            >
                              <span>{VEHICLE_ICONS[String(v).toUpperCase()] || '🚗'}</span>
                              <span>{v}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => navigate(`/parking-lot/${lot.id}`)}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
                    >
                      <span>View Details & Book Slots</span>
                      <span>→</span>
                    </button>
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

export default Favorites;