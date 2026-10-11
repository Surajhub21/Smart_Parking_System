import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { fetchParkingLotById } from '../services/api';

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();
  const [favoriteLots, setFavoriteLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFavoriteLots = async () => {
      if (favorites.length === 0) {
        setFavoriteLots([]);
        return;
      }

      setLoading(true);
      setError('');
      try {
        // Fetch details for each favorite lot
        const lotPromises = favorites.map(id => fetchParkingLotById(id));
        const lots = await Promise.all(lotPromises);
        setFavoriteLots(lots);
      } catch (err) {
        setError('Failed to load favorite parking lots.');
        console.error('Error loading favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteLots();
  }, [favorites]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Favorites</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">My Favorite Parking Lots</h1>
        <p className="mt-2 text-gray-600">
          Save your preferred parking lots for quick access.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {favoriteLots.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            You haven't saved any favorite parking lots yet.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Browse Parking Lots
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteLots.map((lot) => (
            <div key={lot.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{lot.name}</h3>
                    <p className="text-sm text-gray-600">{lot.address}</p>
                  </div>
                  <button
                    onClick={() => {
                      removeFavorite(lot.id);
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-600">
                      {lot.availableSlots}/{lot.totalSlots} slots available
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-sm text-gray-600">
                      ${lot.pricePerHour}/hr
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-600">
                      {lot.openingHours}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => {
                      navigate(`/parking-lot/${lot.id}`);
                    }}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;