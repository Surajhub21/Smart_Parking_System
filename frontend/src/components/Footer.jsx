import React from 'react';

const Footer = () => {
  return (
    <footer className="site-footer text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <p>&copy; {new Date().getFullYear()} Smart Parking Finder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;