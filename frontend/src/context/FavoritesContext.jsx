import React, { createContext, useContext, useState, useEffect } from 'react';
import { addFavoriteLot, removeFavoriteLot, getFavoriteLots } from '../services/api';

const FavoritesContext = createContext();

export const useFavorites = () => {
  return useContext(FavoritesContext);
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('favoriteParkingLotIds');
      return saved ? JSON.parse(saved).map(String) : [];
    } catch {
      return [];
    }
  });

  // Try to load favorites from backend on mount
  useEffect(() => {
    let isMounted = true;
    const syncWithBackend = async () => {
      try {
        const backendFavs = await getFavoriteLots();
        if (isMounted && Array.isArray(backendFavs) && backendFavs.length > 0) {
          const ids = backendFavs.map(f => String(f.parkingLotId || f.id || f));
          setFavorites(ids);
        }
      } catch {
        // Not authenticated or offline
      }
    };
    syncWithBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('favoriteParkingLotIds', JSON.stringify(favorites));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [favorites]);

  const addFavorite = async (lotId) => {
    const idStr = String(lotId);
    setFavorites(prev => {
      const stringified = prev.map(String);
      if (!stringified.includes(idStr)) {
        return [...stringified, idStr];
      }
      return stringified;
    });

    try {
      await addFavoriteLot(idStr);
    } catch (err) {
      console.warn('Backend favorite sync warning:', err.message);
    }
  };

  const removeFavorite = async (lotId) => {
    const idStr = String(lotId);
    setFavorites(prev => prev.filter(id => String(id) !== idStr));

    try {
      await removeFavoriteLot(idStr);
    } catch (err) {
      console.warn('Backend favorite remove warning:', err.message);
    }
  };

  const isFavorite = (lotId) => {
    const idStr = String(lotId);
    return favorites.some(id => String(id) === idStr);
  };

  const value = {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};