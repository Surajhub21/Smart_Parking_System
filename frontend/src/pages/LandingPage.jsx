import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Project Academic Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md shadow-inner">
            <span>🎓 College Final Project</span>
            <span>•</span>
            <span>Smart Urban Mobility System</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Smart Parking Finder &{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
              Facility Management
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            An intelligent, IoT-ready parking ecosystem for <strong className="text-white">Kolkata City</strong>. Connecting commuters to live available parking spaces, empowering facility owners, and eliminating urban cruising traffic.
          </p>

          {/* Core Call to Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 text-center"
            >
              🚀 Sign In to Portal
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 shadow-md transition-all hover:scale-105 active:scale-95 text-center"
            >
              ✍️ Create New Account
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            🔒 Authentication required to access live map search, booking services, and owner management tools.
          </p>
        </div>

        {/* Demo Credentials Card */}
        <div className="mt-14 max-w-4xl mx-auto bg-slate-800/70 backdrop-blur-md rounded-2xl p-6 border border-slate-700/80 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-700/60">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Project Evaluation Guide</span>
              <h3 className="text-lg font-bold text-white">Pre-configured Role Demonstration Accounts</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
              Password: Password@123
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🚗</span>
                <span className="font-bold text-sm text-emerald-400">Driver Portal</span>
              </div>
              <p className="text-xs font-mono text-slate-300">alice@test.com</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Search Kolkata map, test 1–10km radius filters, reserve slots, and view booking receipts.
              </p>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🅿️</span>
                <span className="font-bold text-sm text-indigo-400">Facility Owner</span>
              </div>
              <p className="text-xs font-mono text-slate-300">bob@test.com</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Register lots, auto-detect GPS, manage slots (Car/Bike/EV), and submit for admin approval.
              </p>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🛡️</span>
                <span className="font-bold text-sm text-purple-400">Platform Admin</span>
              </div>
              <p className="text-xs font-mono text-slate-300">admin@smartparking.com</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Review pending listing approval queue, inspect approved facilities, and manage user roles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. LIVE METRICS & KOLKATA HUBS                           */}
      {/* ======================================================== */}
      <section className="py-12 bg-slate-950/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-indigo-400">8+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">Verified Kolkata Hubs</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Park St, Salt Lake, New Town, Mukundapur</div>
            </div>

            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">100+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">Monitored Slots</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Automated Real-time Status Tracking</div>
            </div>

            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-sky-400">1-10 km</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">GPS Radius Search</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Haversine Distance & Spatial Indexing</div>
            </div>

            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-purple-400">₹ INR</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">Transparent Pricing</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Per-hour Rates & Digital Reservations</div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. PROBLEM & SOLUTION                                    */}
      {/* ======================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">The Urban Challenge</span>
          <h2 className="text-3xl font-extrabold text-white mt-1">Why Smart Parking in Kolkata?</h2>
          <p className="text-sm text-slate-400 mt-2">
            Urban congestion in metropolitan corridors like EM Bypass, Salt Lake, and Park Street leads to heavy delays, fuel waste, and pollution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-800/40 rounded-2xl p-8 border border-rose-500/20 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-2xl mb-4">
              ⚠️
            </div>
            <h3 className="text-xl font-bold text-white mb-2">The Traditional Problem</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span><strong>Cruising Congestion:</strong> Over 30% of downtown traffic is simply searching for a free parking spot.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span><strong>Underutilized Private Lots:</strong> Many private garages and basement facilities remain empty without digital exposure.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span><strong>Uncertain Rates & Availability:</strong> No transparency on hourly charges, vehicle compatibility, or security amenities.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/40 rounded-2xl p-8 border border-emerald-500/20 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl mb-4">
              💡
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Our Smart Solution</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Live Geospatial Finder:</strong> Real-time OpenStreetMap with GPS radar detecting spaces within 1 to 10 kilometers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Owner Monetization & Approval:</strong> Facility owners register and manage slots, reviewed and authorized by Platform Admins.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Instant Guaranteed Booking:</strong> Real-time slot locking ensures your reserved bay is waiting before departure.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. THREE PILLARS / ROLE PORTALS                          */}
      {/* ======================================================== */}
      <section className="py-20 bg-slate-950/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Role-Based Architecture</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">Designed for All Urban Stakeholders</h2>
            <p className="text-sm text-slate-400 mt-2">
              Three synchronized user experiences powered by Spring Boot Security role authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Driver Feature Card */}
            <div className="bg-slate-800/50 hover:bg-slate-800/80 rounded-2xl p-6 border border-slate-700/70 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl mb-4">
                  🚗
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Driver Experience</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Effortless spot discovery and reservations on mobile and desktop.
                </p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li>• Interactive Leaflet map with pulsing user GPS</li>
                  <li>• Dynamic 1–10 km search distance filters</li>
                  <li>• Hourly pricing breakdown in ₹ INR</li>
                  <li>• Digital booking records & favorites list</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/60">
                <Link to="/login" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  Access Driver Portal →
                </Link>
              </div>
            </div>

            {/* Owner Feature Card */}
            <div className="bg-slate-800/50 hover:bg-slate-800/80 rounded-2xl p-6 border border-slate-700/70 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-2xl mb-4">
                  🅿️
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Property Owner Portal</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Monetize and monitor your parking spaces with automated slot management.
                </p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li>• Kolkata location presets & GPS auto-detect</li>
                  <li>• Multi-vehicle support (Car, Bike, EV Charging)</li>
                  <li>• Visual slot grid (Free, Occupied, Reserved)</li>
                  <li>• Formal submission for Admin verification</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/60">
                <Link to="/login" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  Access Owner Dashboard →
                </Link>
              </div>
            </div>

            {/* Admin Feature Card */}
            <div className="bg-slate-800/50 hover:bg-slate-800/80 rounded-2xl p-6 border border-slate-700/70 hover:border-purple-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl mb-4">
                  🛡️
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Administration Hub</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Supervise platform listings, maintain safety standards, and view revenue.
                </p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li>• Dedicated Approval Requests review queue</li>
                  <li>• Verified approved listings registry</li>
                  <li>• User suspension & activation management</li>
                  <li>• Platform-wide booking audit logging</li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/60">
                <Link to="/login" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  Access Admin Console →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. TECH STACK SPECIFICATION                              */}
      {/* ======================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Technical Foundation</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Full-Stack Architecture</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 text-center">
            <div className="text-2xl mb-1">☕</div>
            <div className="text-sm font-bold text-white">Spring Boot 3.4</div>
            <div className="text-xs text-slate-400 mt-1">Java 21, REST APIs, Session Security</div>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 text-center">
            <div className="text-2xl mb-1">🍃</div>
            <div className="text-sm font-bold text-white">MongoDB 8</div>
            <div className="text-xs text-slate-400 mt-1">2dsphere Geospatial Indexing, Aggregations</div>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 text-center">
            <div className="text-2xl mb-1">⚛️</div>
            <div className="text-sm font-bold text-white">React 19 & Vite</div>
            <div className="text-xs text-slate-400 mt-1">SPA, Context API, Reactive State</div>
          </div>

          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 text-center">
            <div className="text-2xl mb-1">🗺️</div>
            <div className="text-sm font-bold text-white">Leaflet & Tailwind</div>
            <div className="text-xs text-slate-400 mt-1">OpenStreetMap, GPS Radar, Modern UI</div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. BOTTOM CALL TO ACTION                                 */}
      {/* ======================================================== */}
      <section className="py-16 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-t border-indigo-900/40">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to explore the Smart Parking System?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Sign in with an existing account or register as a driver or parking facility owner to get started.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              Sign In to Portal
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all hover:scale-105 active:scale-95"
            >
              Register New Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
