import React, { useEffect, useMemo, useState } from 'react';
import {
  getAdminBookings,
  getAdminParkingLots,
  getAdminStats,
  getAdminUsers,
  updateAdminUserStatus,
  approveAdminParkingLot,
  rejectAdminParkingLot
} from '../services/api';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);

const statusClasses = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  SUSPENDED: 'bg-rose-100 text-rose-800 border border-rose-200',
  PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
  PENDING_APPROVAL: 'bg-sky-100 text-sky-800 border border-sky-300 font-bold',
  APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
  DRAFT: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
  REJECTED: 'bg-rose-100 text-rose-800 border border-rose-200 font-medium',
  CONFIRMED: 'bg-blue-100 text-blue-800 border border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border border-gray-200'
};

const roleClasses = {
  ADMIN: 'bg-purple-100 text-purple-800 font-semibold border border-purple-200',
  OWNER: 'bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200',
  DRIVER: 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200'
};

const getAmenityBadge = (amenity) => {
  const norm = String(amenity).toLowerCase().replace(/_/g, ' ');
  if (norm.includes('cctv')) return { icon: '📹', label: 'CCTV Surveillance' };
  if (norm.includes('cover')) return { icon: '☂️', label: 'Covered Parking' };
  if (norm.includes('ev') || norm.includes('charg')) return { icon: '⚡', label: 'EV Charging' };
  if (norm.includes('guard') || norm.includes('secur')) return { icon: '🛡️', label: '24/7 Security Guard' };
  if (norm.includes('valet')) return { icon: '🅿️', label: 'Valet Service' };
  if (norm.includes('wheel') || norm.includes('access')) return { icon: '♿', label: 'Handicap Accessible' };
  if (norm.includes('light')) return { icon: '💡', label: 'Well Lit' };
  return { icon: '✨', label: amenity };
};

const getVehicleBadge = (vType) => {
  const norm = String(vType).toUpperCase();
  if (norm.includes('CAR')) return { icon: '🚗', label: 'Cars / Sedans' };
  if (norm.includes('MOTOR') || norm.includes('BIKE')) return { icon: '🏍️', label: 'Motorcycles / Two-Wheelers' };
  if (norm.includes('SUV')) return { icon: '🚙', label: 'SUVs & Vans' };
  if (norm.includes('TRUCK') || norm.includes('HEAVY')) return { icon: '🚚', label: 'Trucks / Commercial' };
  return { icon: '🚙', label: vType };
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return dateStr;
  }
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('requests'); // Default to 'requests' so pending items are immediately visible
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [processingLotId, setProcessingLotId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState('');
  const [buttonPressed, setButtonPressed] = useState(false);
  const [reviewLot, setReviewLot] = useState(null);

  // Close review popup with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && reviewLot) {
        setReviewLot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewLot]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, usersData, lotsData, bookingsData] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminParkingLots(),
        getAdminBookings()
      ]);
      setStats(statsData);
      setUsers(usersData || []);
      setParkingLots(lotsData || []);
      setBookings(bookingsData || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load the admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setButtonPressed(true);
    setTimeout(() => setButtonPressed(false), 200);

    try {
      await loadDashboard();
      const now = new Date();
      setLastRefreshedAt(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setSuccessMsg('Admin dashboard refreshed with live system data.');
    } catch (err) {
      // handled by loadDashboard
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 700);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Filtered lists for Parking Lots
  const pendingLots = useMemo(() => {
    return parkingLots.filter((lot) => lot.status === 'PENDING_APPROVAL');
  }, [parkingLots]);

  const approvedLots = useMemo(() => {
    return parkingLots.filter((lot) => lot.status === 'APPROVED');
  }, [parkingLots]);

  const draftLots = useMemo(() => {
    return parkingLots.filter((lot) => lot.status === 'DRAFT');
  }, [parkingLots]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.email, user.role, user.status].some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [search, users]);

  const handleUserStatusChange = async (user) => {
    const nextStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      setUpdatingUserId(user.id);
      const updatedUser = await updateAdminUserStatus(user.id, nextStatus);
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === updatedUser.id ? updatedUser : currentUser
        )
      );
      setSuccessMsg(`User status updated to ${nextStatus}.`);
    } catch (statusError) {
      setError(statusError.message || 'Unable to update the user status.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleApproveLot = async (lotId, lotName) => {
    try {
      setProcessingLotId(lotId);
      setError('');
      await approveAdminParkingLot(lotId);
      setSuccessMsg(`"${lotName || 'Parking lot'}" has been approved and is now active for drivers!`);
      const lotsData = await getAdminParkingLots();
      setParkingLots(lotsData);
    } catch (approveErr) {
      setError(approveErr.message || 'Unable to approve parking lot.');
    } finally {
      setProcessingLotId(null);
    }
  };

  const handleRejectLot = async (lotId, lotName) => {
    const reason = window.prompt(
      `Enter reason for rejecting "${lotName || 'this lot'}":`,
      'Listing does not meet platform standards'
    );
    if (reason === null) return; // User cancelled

    try {
      setProcessingLotId(lotId);
      setError('');
      await rejectAdminParkingLot(lotId, reason);
      setSuccessMsg(`"${lotName || 'Parking lot'}" has been rejected.`);
      const lotsData = await getAdminParkingLots();
      setParkingLots(lotsData);
    } catch (rejectErr) {
      setError(rejectErr.message || 'Unable to reject parking lot.');
    } finally {
      setProcessingLotId(null);
    }
  };

  if (loading && parkingLots.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-gray-600">Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-purple-100 text-purple-800 border border-purple-200">
              Platform Administration
            </span>
            <span className="text-xs text-gray-500">Kolkata Operations</span>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review submitted owner parking listings, manage verified facilities, and oversee user access.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            id="admin-refresh-button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm border transition-all duration-150 transform cursor-pointer select-none ${
              isRefreshing
                ? 'bg-purple-100/90 text-purple-800 border-purple-300 ring-2 ring-purple-200 cursor-wait scale-95 shadow-inner'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 hover:shadow active:scale-90 active:bg-purple-100 active:ring-2 active:ring-purple-300'
            } ${buttonPressed ? 'scale-90 ring-2 ring-purple-400' : ''}`}
            title="Click to refresh admin dashboard data"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-700 ease-in-out ${
                isRefreshing
                  ? 'animate-spin text-purple-600'
                  : 'text-purple-600 group-hover:rotate-180 group-active:rotate-90'
              }`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="font-semibold">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
          {lastRefreshedAt && (
            <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Last updated: {lastRefreshedAt}
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 flex items-center justify-between shadow-sm animate-fade-in" role="alert">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-700 hover:text-rose-900 font-bold">×</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200/80">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Users</p>
          <p className="mt-2 text-2xl font-black text-indigo-600">{stats?.totalUsers || users.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200/80">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Requests</p>
            {pendingLots.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {pendingLots.length}
            <span className="text-xs font-normal text-gray-500 ml-1.5">needs review</span>
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200/80">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved Parking Lots</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{approvedLots.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200/80">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Platform Revenue</p>
          <p className="mt-2 text-2xl font-black text-purple-600">{formatCurrency(stats?.totalRevenue)}</p>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-200/90 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 px-5 bg-gray-50/50">
          <nav className="-mb-px flex gap-4 sm:gap-6 overflow-x-auto" aria-label="Admin sections">
            {/* 1. Approval Requests Tab (Pending Approval Only) */}
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`border-b-2 px-1 py-4 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'requests'
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span>⏳ Approval Requests</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                pendingLots.length > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {pendingLots.length}
              </span>
            </button>

            {/* 2. Approved Lots Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('approvedLots')}
              className={`border-b-2 px-1 py-4 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'approvedLots'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span>✅ Approved Lots</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {approvedLots.length}
              </span>
            </button>

            {/* 3. All / Drafts Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('allLots')}
              className={`border-b-2 px-1 py-4 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'allLots'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span>📁 All Listings</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                {parkingLots.length}
              </span>
            </button>

            {/* 4. Users Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`border-b-2 px-1 py-4 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'users'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span>👥 Users</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                {users.length}
              </span>
            </button>

            {/* 5. Bookings Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className={`border-b-2 px-1 py-4 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'bookings'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span>📋 Bookings</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                {bookings.length}
              </span>
            </button>
          </nav>
        </div>

        {/* TAB 1: APPROVAL REQUESTS (PENDING_APPROVAL ONLY) */}
        {activeTab === 'requests' && (
          <div className="p-5">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Pending Parking Lot Approval Requests ({pendingLots.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Only parking lots submitted by owners with status <span className="font-semibold text-sky-700">PENDING_APPROVAL</span> are shown here for review. Owner drafts are excluded.
                </p>
              </div>
            </div>

            {pendingLots.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h4 className="text-base font-bold text-gray-800">No Pending Requests</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  All submitted owner listings have been reviewed. When an owner submits a new lot for approval, it will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50/50">
                      <th className="px-4 py-3">Parking Lot</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Capacity & Rate</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingLots.map((lot) => (
                      <tr 
                        key={lot.id} 
                        onClick={() => setReviewLot(lot)}
                        className="hover:bg-amber-50/50 transition cursor-pointer group"
                        title="Click to inspect and review complete parking lot details"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-sm group-hover:text-purple-700 transition">
                              {lot.name}
                            </p>
                            <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 group-hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full transition inline-flex items-center gap-1">
                              <span>🔍</span> Review Details
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{lot.address}</p>
                          {lot.city && (
                            <span className="text-[11px] text-gray-400">
                              📍 {lot.city}, {lot.state} {lot.pincode ? `(${lot.pincode})` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <span className="font-medium">{lot.ownerName || lot.contactEmail || 'Bob Owner'}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600">
                          <div><strong className="text-gray-900">{lot.totalSlots}</strong> slots total</div>
                          <div className="text-indigo-600 font-bold mt-0.5">{formatCurrency(lot.pricePerHour)}/hr</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses[lot.status] || 'bg-gray-100 text-gray-800'}`}>
                            {lot.status}
                          </span>
                        </td>
                        <td 
                          className="px-4 py-4 text-right space-x-2 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setReviewLot(lot)}
                            className="px-3 py-1.5 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg shadow-xs transition"
                            title="Inspect all parameters and photos in modal"
                          >
                            👁️ Review
                          </button>
                          <button
                            onClick={() => handleApproveLot(lot.id, lot.name)}
                            disabled={processingLotId === lot.id}
                            className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                          >
                            {processingLotId === lot.id ? 'Approving...' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectLot(lot.id, lot.name)}
                            disabled={processingLotId === lot.id}
                            className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-sm transition disabled:opacity-50"
                          >
                            ✕ Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPROVED LOTS (APPROVED ONLY) */}
        {activeTab === 'approvedLots' && (
          <div className="p-5">
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Verified & Approved Parking Lots ({approvedLots.length})
              </h3>
              <p className="text-xs text-gray-500">
                These parking facilities are active, verified by admin, and available for driver searches and bookings.
              </p>
            </div>

            {approvedLots.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <div className="text-3xl mb-2">🅿️</div>
                <p className="font-semibold text-gray-700">No Approved Parking Lots Yet</p>
                <p className="text-xs text-gray-500 mt-1">Approve pending listings from the "Approval Requests" tab.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50/50">
                      <th className="px-4 py-3">Parking Facility</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Capacity & Occupancy</th>
                      <th className="px-4 py-3">Hourly Rate</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {approvedLots.map((lot) => (
                      <tr 
                        key={lot.id} 
                        onClick={() => setReviewLot(lot)}
                        className="hover:bg-purple-50/30 transition cursor-pointer group"
                        title="Click to view full parking lot details"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-sm group-hover:text-purple-700 transition">
                              {lot.name}
                            </p>
                            <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                              <span>👁️</span> Details
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{lot.address}</p>
                          <span className="text-[11px] text-gray-400">
                            🌐 {lot.latitude?.toFixed(4)}, {lot.longitude?.toFixed(4)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <span className="font-medium">{lot.ownerName || lot.contactEmail || 'Bob Owner'}</span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <span className="font-bold text-emerald-700">{lot.availableSlots}</span> / {lot.totalSlots} available
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-900">
                          {formatCurrency(lot.pricePerHour)}/hr
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            APPROVED
                          </span>
                        </td>
                        <td 
                          className="px-4 py-4 text-right space-x-2 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setReviewLot(lot)}
                            className="text-xs font-semibold text-purple-700 hover:text-purple-900 px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 border border-purple-200 transition"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleRejectLot(lot.id, lot.name)}
                            disabled={processingLotId === lot.id}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-md hover:bg-rose-50 transition"
                          >
                            Revoke / Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ALL LISTINGS (INCLUDING DRAFTS) */}
        {activeTab === 'allLots' && (
          <div className="p-5">
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-900">
                All Platform Listings ({parkingLots.length})
              </h3>
              <p className="text-xs text-gray-500">
                Comprehensive overview of all facilities in the database, including owner drafts, pending requests, and approved lots.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50/50">
                    <th className="px-4 py-3">Parking Lot</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Slots</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Review Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parkingLots.map((lot) => {
                    const isDraft = lot.status === 'DRAFT';
                    const isPending = lot.status === 'PENDING_APPROVAL';

                    return (
                      <tr 
                        key={lot.id} 
                        onClick={() => setReviewLot(lot)}
                        className="hover:bg-purple-50/30 transition cursor-pointer group"
                        title="Click to view full parking lot details"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-sm group-hover:text-purple-700 transition">
                              {lot.name}
                            </p>
                            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                              Details
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{lot.address}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{lot.ownerName || lot.contactEmail || 'Bob Owner'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{lot.availableSlots}/{lot.totalSlots} available</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[lot.status] || 'bg-gray-100 text-gray-800'}`}>
                            {lot.status}
                          </span>
                        </td>
                        <td 
                          className="px-4 py-4 text-right whitespace-nowrap space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setReviewLot(lot)}
                            className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
                          >
                            Review
                          </button>
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApproveLot(lot.id, lot.name)}
                                className="px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectLot(lot.id, lot.name)}
                                className="px-3 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isDraft && (
                            <span className="text-xs text-slate-400 italic">
                              Owner Draft
                            </span>
                          )}
                          {lot.status === 'APPROVED' && (
                            <span className="text-xs font-semibold text-emerald-600">
                              ✓ Live & Active
                            </span>
                          )}
                          {lot.status === 'REJECTED' && (
                            <span className="text-xs font-semibold text-rose-500">
                              Rejected
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USERS TAB */}
        {activeTab === 'users' && (
          <div className="p-5">
            <div className="mb-4">
              <label htmlFor="user-search" className="sr-only">Search users</label>
              <input
                id="user-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, role, or status..."
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50/50">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition">
                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${roleClasses[user.role] || 'bg-gray-100 text-gray-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[user.status] || 'bg-gray-100 text-gray-800'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleUserStatusChange(user)}
                          disabled={updatingUserId === user.id}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition disabled:opacity-50"
                        >
                          {updatingUserId === user.id
                            ? 'Updating...'
                            : user.status === 'SUSPENDED'
                              ? 'Activate'
                              : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">No users match your search.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="overflow-x-auto p-5">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50/50">
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">Parking Lot</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">{booking.user?.name || 'Driver'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{booking.parkingLot?.name || 'Parking Facility'}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{new Date(booking.startTime).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">No driver bookings recorded yet.</p>
            )}
          </div>
        )}
      </div>

      {/* COMPREHENSIVE PARKING LOT REVIEW MODAL POPUP */}
      {reviewLot && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setReviewLot(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <div 
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-auto flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white flex items-start justify-between gap-4 border-b border-purple-900/40">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Admin Review & Inspection
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusClasses[reviewLot.status] || 'bg-gray-100 text-gray-800'}`}>
                    {reviewLot.status}
                  </span>
                </div>
                <h2 id="review-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {reviewLot.name}
                </h2>
                <p className="text-xs text-purple-200/90 mt-1 flex items-center gap-1">
                  <span>📍</span> {reviewLot.address}{reviewLot.city ? `, ${reviewLot.city}` : ''}{reviewLot.state ? `, ${reviewLot.state}` : ''}{reviewLot.pincode ? ` (${reviewLot.pincode})` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewLot(null)}
                className="text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2 transition cursor-pointer"
                title="Close modal (Esc)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-5 text-gray-700">
              {/* Key Metrics Highlight Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Capacity</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-black text-gray-900">{reviewLot.totalSlots}</span>
                    <span className="text-xs text-gray-500 font-medium">slots total</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                    {reviewLot.availableSlots} currently open
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Hourly Tariff</span>
                  <div className="mt-1 text-xl font-black text-purple-700">
                    {formatCurrency(reviewLot.pricePerHour)}
                    <span className="text-xs font-normal text-gray-500">/hr</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Standard flat rate</div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Operating Hours</span>
                  <div className="mt-1 text-base font-bold text-gray-900">
                    {reviewLot.openingHours || '24/7'}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Access window</div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">GPS Location</span>
                  <div className="mt-1 text-xs font-semibold text-gray-800">
                    {reviewLot.latitude?.toFixed(4)}, {reviewLot.longitude?.toFixed(4)}
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${reviewLot.latitude},${reviewLot.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold mt-0.5 inline-flex items-center gap-1 hover:underline"
                  >
                    Open Google Maps ↗
                  </a>
                </div>
              </div>

              {/* Owner Details Card */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2.5 flex items-center gap-1.5">
                  <span>👤</span> Owner & Facility Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 font-medium">Owner Name:</span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{reviewLot.ownerName || 'Bob Owner'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Contact Email:</span>
                    <p className="font-semibold text-gray-800 mt-0.5">{reviewLot.contactEmail || 'owner@smartparking.com'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Contact Phone:</span>
                    <p className="font-semibold text-gray-800 mt-0.5">{reviewLot.contactPhone || '+91 98765 43210'}</p>
                  </div>
                </div>
              </div>

              {/* Facility Description */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Facility Description
                </h3>
                <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {reviewLot.description || (
                    <span className="italic text-gray-400">
                      The owner did not provide a custom description for this parking facility. Standard location and pricing rules apply.
                    </span>
                  )}
                </div>
              </div>

              {/* Vehicle Types & Amenities Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Permitted Vehicle Types */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
                    <span>🚗</span> Permitted Vehicle Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(reviewLot.rawSupportedVehicles?.length > 0 ? reviewLot.rawSupportedVehicles : reviewLot.vehicleTypes || ['Car']).map((veh, i) => {
                      const info = getVehicleBadge(veh);
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
                        >
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Security & Amenities */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
                    <span>🛡️</span> Security & Amenities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(reviewLot.rawAmenities?.length > 0 ? reviewLot.rawAmenities : reviewLot.amenities || ['Covered', 'Security']).map((amen, i) => {
                      const info = getAmenityBadge(amen);
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Slot Breakdown Layout (if slots array populated) */}
              {reviewLot.slots && reviewLot.slots.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
                    <span>🅿️</span> Configured Slots Breakdown ({reviewLot.slots.length} slots)
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1">
                    {reviewLot.slots.map((s, idx) => (
                      <div 
                        key={s.id || idx}
                        className={`p-2 rounded-lg text-center border text-xs font-bold ${
                          s.status === 'FREE' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <div className="text-[10px] text-gray-400 font-normal">{s.vehicleType || 'Car'}</div>
                        <div>{s.slotNumber || s.number || `S-${idx + 1}`}</div>
                        <div className="text-[9px] mt-0.5 font-medium">{s.status || 'FREE'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images preview if any */}
              {reviewLot.images && reviewLot.images.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                    <span>📷</span> Facility Photos ({reviewLot.images.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {reviewLot.images.map((imgUrl, idx) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt={`Facility photo ${idx + 1}`}
                        className="w-full h-28 object-cover rounded-xl border border-gray-200 shadow-2xs"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Status Reason Banner if available */}
              {reviewLot.statusReason && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="font-bold">Prior Status Reason / Admin Notes:</span>
                    <p className="mt-0.5">{reviewLot.statusReason}</p>
                  </div>
                </div>
              )}

              {/* Metadata IDs & Timestamps */}
              <div className="bg-gray-50 rounded-xl p-3 text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-2 border border-gray-200/60">
                <div>
                  <span className="font-semibold text-gray-600">Listing ID:</span>{' '}
                  <code className="bg-gray-200/80 px-1.5 py-0.5 rounded text-gray-800 text-[10px] font-mono">{reviewLot.id}</code>
                </div>
                {reviewLot.createdAt && (
                  <div>
                    <span className="font-semibold text-gray-600">Created:</span> {formatDateTime(reviewLot.createdAt)}
                  </div>
                )}
                {reviewLot.updatedAt && (
                  <div>
                    <span className="font-semibold text-gray-600">Last Modified:</span> {formatDateTime(reviewLot.updatedAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-500 font-medium text-center sm:text-left">
                {reviewLot.status === 'PENDING_APPROVAL' ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                    <span>⏳</span> Awaiting Admin Review. Approving will publish this facility live for drivers.
                  </span>
                ) : reviewLot.status === 'APPROVED' ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <span>✓</span> Facility verified and currently active on the platform.
                  </span>
                ) : (
                  <span>Current Status: <strong>{reviewLot.status}</strong></span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setReviewLot(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Close
                </button>

                {reviewLot.status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        const targetId = reviewLot.id;
                        const targetName = reviewLot.name;
                        setReviewLot(null);
                        await handleRejectLot(targetId, targetName);
                      }}
                      disabled={processingLotId === reviewLot.id}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-2xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <span>✕</span> Reject Listing
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const targetId = reviewLot.id;
                        const targetName = reviewLot.name;
                        setReviewLot(null);
                        await handleApproveLot(targetId, targetName);
                      }}
                      disabled={processingLotId === reviewLot.id}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {processingLotId === reviewLot.id ? (
                        'Approving...'
                      ) : (
                        <>
                          <span>✓</span> Approve & Publish
                        </>
                      )}
                    </button>
                  </>
                )}

                {reviewLot.status === 'APPROVED' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const targetId = reviewLot.id;
                      const targetName = reviewLot.name;
                      setReviewLot(null);
                      await handleRejectLot(targetId, targetName);
                    }}
                    disabled={processingLotId === reviewLot.id}
                    className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    Revoke Approval
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
