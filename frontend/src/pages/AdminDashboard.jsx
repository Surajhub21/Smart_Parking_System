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
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);

const statusClasses = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
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
        setUsers(usersData);
        setParkingLots(lotsData);
        setBookings(bookingsData);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load the admin dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

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
    } catch (statusError) {
      setError(statusError.message || 'Unable to update the user status.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleApproveLot = async (lotId) => {
    try {
      setError('');
      await approveAdminParkingLot(lotId);
      const lotsData = await getAdminParkingLots();
      setParkingLots(lotsData);
    } catch (approveErr) {
      setError(approveErr.message || 'Unable to approve parking lot.');
    }
  };

  const handleRejectLot = async (lotId) => {
    try {
      setError('');
      await rejectAdminParkingLot(lotId, 'Rejected by platform admin');
      const lotsData = await getAdminParkingLots();
      setParkingLots(lotsData);
    } catch (rejectErr) {
      setError(rejectErr.message || 'Unable to reject parking lot.');
    }
  };

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
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Administration</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor the parking platform and manage user access.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total Users', stats?.totalUsers, 'text-indigo-600'],
          ['Parking Lots', stats?.totalParkingLots, 'text-green-600'],
          ['Active Bookings', stats?.activeBookings, 'text-blue-600'],
          ['Platform Revenue', formatCurrency(stats?.totalRevenue), 'text-purple-600']
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-lg bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-5">
          <nav className="-mb-px flex gap-6" aria-label="Admin sections">
            {[
              ['users', 'Users'],
              ['parkingLots', 'Parking Lots'],
              ['bookings', 'Bookings']
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'users' && (
          <div className="p-5">
            <div className="mb-4">
              <label htmlFor="user-search" className="sr-only">Search users</label>
              <input
                id="user-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, role, or status"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-3">User</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap px-3 py-4">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-600">{user.role}</td>
                      <td className="px-3 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[user.status] || 'bg-gray-100 text-gray-800'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleUserStatusChange(user)}
                          disabled={updatingUserId === user.id}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
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

        {activeTab === 'parkingLots' && (
          <div className="overflow-x-auto p-5">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-3">Parking Lot</th>
                  <th className="px-3 py-3">Owner</th>
                  <th className="px-3 py-3">Slots</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parkingLots.map((lot) => (
                  <tr key={lot.id}>
                    <td className="px-3 py-4">
                      <p className="font-medium text-gray-900">{lot.name}</p>
                      <p className="text-sm text-gray-500">{lot.address}</p>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600">{lot.ownerName}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{lot.availableSlots}/{lot.totalSlots} available</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[lot.status] || 'bg-gray-100 text-gray-800'}`}>
                        {lot.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right space-x-2">
                      {lot.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApproveLot(lot.id)}
                          className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                      )}
                      {lot.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleRejectLot(lot.id)}
                          className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="overflow-x-auto p-5">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3">Parking Lot</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-3 py-4 text-sm text-gray-900">{booking.user.name}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{booking.parkingLot.name}</td>
                    <td className="px-3 py-4 text-sm text-gray-600">{new Date(booking.startTime).toLocaleDateString()}</td>
                    <td className="px-3 py-4 text-sm font-medium text-gray-900">{formatCurrency(booking.totalAmount)}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
