import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { fetchParkingLots } from '../services/api';

// Custom User GPS Location Marker (Pulsing blue radar dot)
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div class="user-pulse-dot" title="Your Current Location">
      <div class="user-pulse-dot-core"></div>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14]
});

// Custom Parking Lot Pin (P badge with price)
const createParkingLotIcon = (price, isSelected) =>
  L.divIcon({
    className: 'parking-pin-marker',
    html: `
      <div style="
        background: ${isSelected ? '#4f46e5' : '#1e1b4b'};
        color: white;
        padding: 4px 8px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 4px;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        white-space: nowrap;
        transform: translate(-50%, -100%);
      ">
        <span style="background: #fde047; color: #1e1b4b; border-radius: 50%; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900;">P</span>
        <span>₹${price}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -28]
  });

// Map controller to smoothly pan/zoom when user location or selected lot changes
function MapController({ center, selectedCoords }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCoords && selectedCoords.lat != null && selectedCoords.lng != null) {
      map.flyTo([selectedCoords.lat, selectedCoords.lng], 16, { duration: 1.0 });
    } else if (center && center.lat != null && center.lng != null) {
      map.flyTo([center.lat, center.lng], 14, { duration: 1.2 });
    }
  }, [center?.lat, center?.lng, selectedCoords?.lat, selectedCoords?.lng, map]);

  return null;
}

const DriverHome = () => {
  const navigate = useNavigate();
  const [parkingLots, setParkingLots] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5); // Default 5 km
  const [filterByLocation, setFilterByLocation] = useState(true); // Toggle location radius filter
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationSource, setLocationSource] = useState('detecting'); // 'gps' | 'default'
  const [selectedLot, setSelectedLot] = useState(null);

  // Filters state
  const [filterEv, setFilterEv] = useState(false);
  const [filterCovered, setFilterCovered] = useState(false);
  const [filterSecurity, setFilterSecurity] = useState(false);

  // Fetch user current position
  const requestLocation = (force = false) => {
    if (!navigator.geolocation) {
      setSearchLocation((prev) => prev || { lat: 22.5032, lng: 88.4147 });
      setLocationSource('default');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setSearchLocation(coords);
        setLocationSource('gps');
        setSelectedLot(null);
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation unavailable/denied:', err.message);
        if (force) {
          alert('Could not access your location. Please check browser location permissions.');
        }
        // Default to Kolkata user area if GPS denied
        setSearchLocation((prev) => prev || { lat: 22.5032, lng: 88.4147 });
        setLocationSource('default');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    requestLocation(false);
  }, []);

  // Fetch lots from API
  const loadParkingLots = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filterByLocation && searchLocation
        ? {
            latitude: searchLocation.lat,
            longitude: searchLocation.lng,
            radiusKm: searchRadius,
            maxDistance: searchRadius
          }
        : {
            // When location radius filter is disabled, query all approved lots
            latitude: searchLocation ? searchLocation.lat : undefined,
            longitude: searchLocation ? searchLocation.lng : undefined,
            radiusKm: 50,
            maxDistance: 50
          };

      const results = await fetchParkingLots(params);
      setParkingLots(results || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch parking lots');
    } finally {
      setLoading(false);
    }
  }, [searchLocation, searchRadius, filterByLocation]);

  // Trigger search on parameter updates
  useEffect(() => {
    if (searchLocation) {
      loadParkingLots();
    }
  }, [loadParkingLots, searchLocation]);

  // Apply amenity filters
  const filteredParkingLots = parkingLots.filter((lot) => {
    if (filterEv) {
      const hasEv =
        lot.amenities?.some((a) => a.toLowerCase().includes('ev')) ||
        lot.vehicleTypes?.some((v) => v.toLowerCase().includes('ev'));
      if (!hasEv) return false;
    }
    if (filterCovered) {
      const hasCovered = lot.amenities?.some((a) => a.toLowerCase().includes('covered'));
      if (!hasCovered) return false;
    }
    if (filterSecurity) {
      const hasSecurity = lot.amenities?.some(
        (a) => a.toLowerCase().includes('security') || a.toLowerCase().includes('cctv')
      );
      if (!hasSecurity) return false;
    }
    return true;
  });

  if (!searchLocation) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-base font-semibold text-gray-800">Detecting your location...</p>
          <p className="text-sm text-gray-500 mt-1">Please allow location access to find nearby parking spots</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4.25rem)] overflow-hidden bg-slate-100">
      {/* ===================== LEFT SIDEBAR (Controls & Results Section) ===================== */}
      <aside className="w-full lg:w-[430px] xl:w-[470px] flex flex-col h-full bg-white border-r border-gray-200 z-10 shadow-lg">
        {/* Top Controls Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-white flex-shrink-0 space-y-3.5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Find Parking</span>
            </h1>
            <div className="flex items-center gap-2">
              {/* Refresh API Button */}
              <button
                type="button"
                onClick={loadParkingLots}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all shadow-sm"
                title="Refresh parking lots from server"
              >
                <svg
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              {/* Locate Me Button */}
              <button
                type="button"
                onClick={() => requestLocation(true)}
                disabled={locating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all shadow-sm"
                title="Detect and re-center on your current location"
              >
                {locating ? (
                  <div className="h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{locating ? 'Locating...' : 'Locate Me'}</span>
              </button>
            </div>
          </div>

          {/* Location Status Pill & Filter Toggle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                <span className={`w-2 h-2 rounded-full ${locationSource === 'gps' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {locationSource === 'gps' ? 'Live GPS Location' : 'Detected Area'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {searchLocation.lat.toFixed(4)}, {searchLocation.lng.toFixed(4)}
              </span>
            </div>

            {/* Location Radius Filter Toggle Button */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-indigo-50/70 border border-indigo-100 text-xs">
              <span className="text-indigo-900 font-medium">
                {filterByLocation ? `Radius Filter: Active (≤ ${searchRadius} km)` : 'Showing All Kolkata Lots'}
              </span>
              <button
                type="button"
                onClick={() => setFilterByLocation(!filterByLocation)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all shadow-xs ${
                  filterByLocation
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                {filterByLocation ? 'Disable Filter' : 'Enable Filter'}
              </button>
            </div>
          </div>

          {/* Search Radius Slider & 1-10km Quick Buttons */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="radius-slider" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Search Radius
              </label>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {searchRadius} km
              </span>
            </div>

            <input
              id="radius-slider"
              type="range"
              min="1"
              max="10"
              step="1"
              value={searchRadius}
              onChange={(e) => {
                setSearchRadius(parseInt(e.target.value, 10));
                if (!filterByLocation) setFilterByLocation(true);
              }}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            {/* 1 - 10 km Quick Preset Buttons */}
            <div className="grid grid-cols-5 gap-1.5 mt-2">
              {[1, 2, 3, 5, 10].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => {
                    setSearchRadius(km);
                    if (!filterByLocation) setFilterByLocation(true);
                  }}
                  className={`py-1 text-xs font-bold rounded-lg border transition-all text-center ${
                    searchRadius === km && filterByLocation
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-indigo-300'
                  }`}
                  title={`Set radius to ${km} km`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {/* Filter Amenity Chips */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1.5">
              Filters
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                filterEv ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}>
                <input
                  type="checkbox"
                  checked={filterEv}
                  onChange={(e) => setFilterEv(e.target.checked)}
                  className="sr-only"
                />
                <span>⚡ EV Charging</span>
              </label>

              <label className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                filterCovered ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}>
                <input
                  type="checkbox"
                  checked={filterCovered}
                  onChange={(e) => setFilterCovered(e.target.checked)}
                  className="sr-only"
                />
                <span>🏢 Covered</span>
              </label>

              <label className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                filterSecurity ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}>
                <input
                  type="checkbox"
                  checked={filterSecurity}
                  onChange={(e) => setFilterSecurity(e.target.checked)}
                  className="sr-only"
                />
                <span>🛡️ Security</span>
              </label>
            </div>
          </div>
        </div>

        {/* RESULTS SECTION (Scrollable list in the remaining sidebar area) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Results ({filteredParkingLots.length})
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              {filterByLocation ? `Within ${searchRadius} km` : 'All available'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center my-auto">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-3 text-xs text-gray-500">Updating nearby parking lots...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 text-xs text-center border border-red-200 my-auto">
              {error}
            </div>
          ) : filteredParkingLots.length === 0 ? (
            <div className="py-12 px-4 text-center my-auto bg-white rounded-xl border border-dashed border-gray-300">
              <div className="text-3xl mb-2">🅿️</div>
              <p className="text-sm font-semibold text-gray-800">No parking lots within {searchRadius} km</p>
              <p className="text-xs text-gray-500 mt-1">
                Tap <strong>5 km</strong> or <strong>10 km</strong> above, or click <strong>Disable Filter</strong> to view all lots.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredParkingLots.map((lot) => {
                const isSelected = selectedLot?.id === lot.id;
                const distanceStr =
                  lot.distance != null ? `${lot.distance.toFixed(1)} km away` : 'Kolkata';

                return (
                  <div
                    key={lot.id}
                    onClick={() => setSelectedLot(lot)}
                    className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                      isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-base leading-snug truncate">
                          {lot.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{lot.address}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-extrabold text-indigo-700">
                          ₹{lot.pricePerHour}
                        </span>
                        <span className="text-[11px] text-gray-600 block">/ hour</span>
                      </div>
                    </div>

                    {/* Metadata & Availability */}
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded">
                        <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {distanceStr}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-xs ${
                          lot.availableSlots > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${lot.availableSlots > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {lot.availableSlots} / {lot.totalSlots} free
                      </span>
                    </div>

                    {/* Amenities chips */}
                    {lot.amenities && lot.amenities.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {lot.amenities.slice(0, 3).map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                        {lot.amenities.length > 3 && (
                          <span className="px-1.5 py-0.5 text-slate-400 text-[10px] rounded font-medium">
                            +{lot.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLot(lot);
                        }}
                        className="text-xs font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                      >
                        <span>Focus on Map</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/parking-lot/${lot.id}`);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                      >
                        View & Book Slot
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ===================== RIGHT SIDE (Full-Height Interactive Map) ===================== */}
      <main className="flex-1 relative h-full">
        <MapContainer
          center={[searchLocation.lat, searchLocation.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Smooth auto-center controller */}
          <MapController
            center={searchLocation}
            selectedCoords={selectedLot ? { lat: selectedLot.latitude, lng: selectedLot.longitude } : null}
          />

          {/* User's Current GPS Location Marker with Pulsing Beacon */}
          {searchLocation && (
            <Marker position={[searchLocation.lat, searchLocation.lng]} icon={userLocationIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-ping"></span>
                    Your Current Location
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Lat: {searchLocation.lat.toFixed(5)}<br />
                    Lng: {searchLocation.lng.toFixed(5)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Search radius: {searchRadius} km
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Search Radius Circle visually displaying coverage */}
          {searchLocation && filterByLocation && (
            <Circle
              center={[searchLocation.lat, searchLocation.lng]}
              radius={searchRadius * 1000}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 6'
              }}
            />
          )}

          {/* Parking lot markers with distinct price badges */}
          {filteredParkingLots.map((lot) => {
            const isSelected = selectedLot?.id === lot.id;
            return (
              <Marker
                key={lot.id}
                position={[lot.latitude, lot.longitude]}
                icon={createParkingLotIcon(lot.pricePerHour, isSelected)}
                eventHandlers={{
                  click: () => setSelectedLot(lot)
                }}
              >
                <Popup>
                  <div className="max-w-xs p-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">{lot.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{lot.address}</p>

                    <div className="flex justify-between items-center text-xs mb-3 p-2 bg-slate-50 rounded">
                      <span className="font-bold text-indigo-700">₹{lot.pricePerHour} / hour</span>
                      <span className="font-semibold text-emerald-700">
                        {lot.availableSlots} / {lot.totalSlots} slots free
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/parking-lot/${lot.id}`)}
                      className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors"
                    >
                      View & Book Slots
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Map Legend & Quick Controls */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => requestLocation(true)}
            className="flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-md border border-gray-200 text-xs font-bold text-gray-700 hover:text-indigo-600 hover:bg-white transition-all active:scale-95"
            title="Re-center map on your location"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Center on Me</span>
          </button>

          <div className="bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-md border border-gray-200 text-[11px] text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-white shadow"></span>
              <span>Your Location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-900 text-white text-[8px] flex items-center justify-center font-bold">
                P
              </span>
              <span>Kolkata Parking (with rate)</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverHome;