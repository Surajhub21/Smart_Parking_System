import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { fetchParkingLots } from '../services/api';
import useRealtime from '../hooks/useRealtime';

// Custom marker icon
const parkingIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const DriverHome = () => {
  const navigate = useNavigate();
  const [parkingLots, setParkingLots] = useState([]);
  const [searchLocation, setSearchLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5); // Default 5 km
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get user's current location with safety fallback
  useEffect(() => {
    let fallbackTimer = setTimeout(() => {
      setSearchLocation((prev) => prev || { lat: 40.7128, lng: -74.0060 });
    }, 4000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(fallbackTimer);
          setSearchLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation unavailable, using default coordinates:', error);
          clearTimeout(fallbackTimer);
          setSearchLocation({ lat: 40.7128, lng: -74.0060 }); // Default
        },
        { timeout: 4000, maximumAge: 60000 }
      );
    } else {
      clearTimeout(fallbackTimer);
      setSearchLocation({ lat: 40.7128, lng: -74.0060 }); // Default
    }

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Fetch parking lots in real-time when radius changes
  const { data: lots, loading: realtimeLoading, error: realtimeError } = useRealtime(
    () => fetchParkingLots({ maxDistance: searchRadius }),
    5000 // Update every 5 seconds
  );

  // Update state from hook
  useEffect(() => {
    setParkingLots(lots || []);
    setLoading(realtimeLoading);
    setError(realtimeError || '');
  }, [lots, realtimeLoading, realtimeError]);

  if (!searchLocation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Detecting your location...</p>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Find Parking</h2>
            
            {/* Search controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Radius
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {searchRadius} km
                  </span>
                </div>
              </div>
              
              {/* Filter controls */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filters
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="filter-ev"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="filter-ev" className="ml-2 block text-sm text-gray-900">
                      EV Charging
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="filter-covered"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="filter-covered" className="ml-2 block text-sm text-gray-900">
                      Covered
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="filter-security"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="filter-security" className="ml-2 block text-sm text-gray-900">
                      Security
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results count */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                {parkingLots.length} parking lots found
              </p>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Map */}
          <div className="h-[28rem] w-full lg:h-[calc(100vh-4rem)]">
            <MapContainer
              center={[searchLocation.lat, searchLocation.lng]}
              zoom={13}
              style={{ height: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* User location marker */}
              {searchLocation && (
                <Marker position={[searchLocation.lat, searchLocation.lng]} icon={parkingIcon}>
                  <Popup>
                    <strong>Your Location</strong>
                  </Popup>
                </Marker>
              )}
              
              {/* Parking lot markers */}
              {parkingLots.map((lot) => (
                <Marker
                  key={lot.id}
                  position={[lot.latitude, lot.longitude]}
                  icon={parkingIcon}
                >
                  <Popup>
                    <div className="max-w-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {lot.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {lot.address}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <span>•</span>
                        <span>{lot.availableSlots}/{lot.totalSlots} slots available</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <span>•</span>
                        <span>${lot.pricePerHour}/hr</span>
                      </div>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            navigate(`/parking-lot/${lot.id}`);
                          }}
                          className="w-full text-left bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2 rounded"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          
          {/* Results list */}
          <div className="w-full border-t border-gray-200 bg-white lg:border-l lg:border-t-0">
            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Results</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-600 py-8">
                  {error}
                </div>
              ) : parkingLots.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No parking lots found in this area.
                </div>
              ) : (
                <div className="space-y-4">
                  {parkingLots.map((lot) => (
                    <div
                      key={lot.id}
                      onClick={() => navigate('/parking-lot/' + lot.id)}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {lot.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {lot.address}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-medium text-indigo-600">
                            ${lot.pricePerHour}/hr
                          </p>
                          <p className="text-sm text-gray-600">
                            {lot.availableSlots}/{lot.totalSlots} slots
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {lot.amenities.map((amenity, index) => (
                          <span key={index} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverHome;