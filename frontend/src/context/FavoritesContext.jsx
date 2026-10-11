import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export const useFavorites = () => {
  return useContext(FavoritesContext);
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('favoriteParkingLotIds');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // Save to localStorage whenever favorites change
    localStorage.setItem('favoriteParkingLotIds', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (lotId) => {
    setFavorites(prev => {
      if (!prev.includes(lotId)) {
        return [...prev, lotId];
      }
      return prev;
    });
  };

  const removeFavorite = (lotId) => {
    setFavorites(prev => prev.filter(id => id !== lotId));
  };

  const isFavorite = (lotId) => {
    return favorites.includes(lotId);
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