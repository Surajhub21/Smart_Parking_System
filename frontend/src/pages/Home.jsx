import React from 'react';

const Home = () => {
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Welcome to Smart Parking Finder
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Find and reserve parking spots with ease.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Parking</h2>
            <p className="text-gray-600">
              Search for available parking spots near you or in a specific location.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reserve a Spot</h2>
            <p className="text-gray-600">
              Reserve a parking spot in advance and guarantee your space.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Your Bookings</h2>
            <p className="text-gray-600">
              View, modify, or cancel your existing parking reservations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;