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

        <button
          onClick={loadDashboard}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 shadow-sm transition"
        >
          <span>🔄</span> Refresh Data
        </button>
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
                      <tr key={lot.id} className="hover:bg-amber-50/30 transition">
                        <td className="px-4 py-4">
                          <p className="font-bold text-gray-900 text-sm">{lot.name}</p>
                          <p className="text-xs text-gray-500">{lot.address}</p>
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
                        <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
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
                      <tr key={lot.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-4 py-4">
                          <p className="font-bold text-gray-900 text-sm">{lot.name}</p>
                          <p className="text-xs text-gray-500">{lot.address}</p>
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
                        <td className="px-4 py-4 text-right">
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
                      <tr key={lot.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-4 py-4">
                          <p className="font-bold text-gray-900 text-sm">{lot.name}</p>
                          <p className="text-xs text-gray-500">{lot.address}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{lot.ownerName || lot.contactEmail || 'Bob Owner'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{lot.availableSlots}/{lot.totalSlots} available</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[lot.status] || 'bg-gray-100 text-gray-800'}`}>
                            {lot.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {isPending && (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleApproveLot(lot.id, lot.name)}
                                className="px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectLot(lot.id, lot.name)}
                                className="px-3 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {isDraft && (
                            <span className="text-xs text-slate-400 italic">
                              Owner Draft (Awaiting Submission)
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
    </div>
  );
};

export default AdminDashboard;
