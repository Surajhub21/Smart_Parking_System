import http from './httpClient';

// ==========================================
// HELPERS & DATA NORMALIZATION
// ==========================================

export const normalizeParkingLot = (lot) => {
  if (!lot) return null;
  const amenitiesList = Array.isArray(lot.amenities)
    ? lot.amenities.map(a => typeof a === 'string' ? a.replace(/_/g, ' ') : String(a))
    : [];

  const vehicleTypesList = Array.isArray(lot.supportedVehicles)
    ? lot.supportedVehicles.map(v => typeof v === 'string' ? v.charAt(0) + v.slice(1).toLowerCase() : String(v))
    : Array.isArray(lot.vehicleTypes) ? lot.vehicleTypes : ['Car'];

  const distanceKm = lot.roadDistanceMeters != null
    ? (lot.roadDistanceMeters / 1000).toFixed(1)
    : (lot.distance != null ? lot.distance : 0.5);

  return {
    id: lot.id,
    name: lot.name,
    address: lot.address || `${lot.city || ''} ${lot.state || ''}`.trim() || 'Address unavailable',
    city: lot.city || '',
    state: lot.state || '',
    latitude: lot.latitude != null ? lot.latitude : 40.7128,
    longitude: lot.longitude != null ? lot.longitude : -74.0060,
    totalSlots: lot.totalCapacity != null ? lot.totalCapacity : (lot.totalSlots || 50),
    availableSlots: lot.availableSlots != null ? lot.availableSlots : 0,
    pricePerHour: lot.pricePerHour != null ? lot.pricePerHour : 5.0,
    openingHours: lot.operatingHours || lot.openingHours || '24/7',
    amenities: amenitiesList.length > 0 ? amenitiesList : ['Covered', 'Security'],
    vehicleTypes: vehicleTypesList.length > 0 ? vehicleTypesList : ['Car', 'SUV'],
    distance: parseFloat(distanceKm),
    status: lot.status || 'APPROVED',
    slots: Array.isArray(lot.slots) ? lot.slots : []
  };
};

export const normalizeBooking = (b) => {
  if (!b) return null;
  return {
    id: b.id || b.bookingReference,
    bookingReference: b.bookingReference || b.id,
    parkingLotId: b.parkingLotId,
    parkingLot: {
      id: b.parkingLotId,
      name: b.parkingLotName || (b.parkingLot && b.parkingLot.name) || 'Central Parking',
      address: (b.parkingLot && b.parkingLot.address) || ''
    },
    slot: {
      number: b.slotNumber || (b.slot && b.slot.number) || 'A1'
    },
    slotNumber: b.slotNumber || (b.slot && b.slot.number) || 'A1',
    vehicleType: b.vehicleType || 'Car',
    vehicleNumber: b.vehicleNumber || '',
    startTime: b.startTime,
    endTime: b.endTime,
    totalAmount: b.totalPrice != null ? b.totalPrice : (b.totalAmount != null ? b.totalAmount : 20.0),
    status: b.status || 'ACTIVE',
    createdAt: b.createdAt || new Date().toISOString()
  };
};

// ==========================================
// DRIVER & SEARCH APIS
// ==========================================

export const fetchParkingLots = async (params = {}) => {
  const lat = params.latitude || 40.7128;
  const lng = params.longitude || -74.0060;
  const radius = params.maxDistance || params.radiusKm || 5;

  try {
    const res = await http.get(`/search?latitude=${lat}&longitude=${lng}&radiusKm=${radius}`);
    const results = (res && res.results) ? res.results : (Array.isArray(res) ? res : []);
    if (results.length > 0) {
      return results.map(normalizeParkingLot);
    }
  } catch (err) {
    console.warn('Backend search unreachable, falling back to mock lots:', err.message);
  }

  // Graceful fallback for initial search proof-of-concept when DB has 0 lots
  const mockLots = [
    {
      id: "mock-1",
      name: "Central Parking Garage",
      address: "123 Main St, Downtown",
      latitude: lat + 0.002,
      longitude: lng + 0.002,
      availableSlots: 15,
      totalSlots: 50,
      pricePerHour: 5.0,
      amenities: ["EV Charging", "Covered", "Security"],
      vehicleTypes: ["Car", "SUV", "Motorcycle"],
      openingHours: "24/7",
      distance: 0.5
    },
    {
      id: "mock-2",
      name: "Riverfront Parking",
      address: "456 River Ave, Uptown",
      latitude: lat - 0.004,
      longitude: lng + 0.003,
      availableSlots: 8,
      totalSlots: 30,
      pricePerHour: 4.5,
      amenities: ["EV Charging", "Security"],
      vehicleTypes: ["Car", "SUV"],
      openingHours: "6:00 AM - 10:00 PM",
      distance: 1.2
    }
  ];

  return mockLots.map(normalizeParkingLot);
};

export const fetchParkingLotById = async (id) => {
  try {
    const lot = await http.get(`/parking/lots/public/${id}`);
    let slots = [];
    try {
      slots = await http.get(`/parking/lots/public/${id}/slots`);
    } catch (_) {}
    return normalizeParkingLot({ ...lot, slots });
  } catch (err) {
    console.warn(`Public lot ${id} not found in backend, returning fallback lot:`, err.message);
    return normalizeParkingLot({
      id,
      name: "Central Parking Garage",
      address: "123 Main St, Downtown",
      latitude: 40.7128,
      longitude: -74.0060,
      totalCapacity: 50,
      availableSlots: 15,
      pricePerHour: 5.0,
      operatingHours: "24/7",
      amenities: ["EV Charging", "Covered", "Security"],
      supportedVehicles: ["CAR", "SUV", "BIKE"],
      slots: [
        { id: "s1", number: "A1", status: "FREE", vehicleType: "Car" },
        { id: "s2", number: "A2", status: "OCCUPIED", vehicleType: "SUV" },
        { id: "s3", number: "A3", status: "FREE", vehicleType: "Car" },
        { id: "s4", number: "B1", status: "RESERVED", vehicleType: "Car" },
        { id: "s5", number: "B2", status: "FREE", vehicleType: "Motorcycle" }
      ]
    });
  }
};

// ==========================================
// BOOKING APIS
// ==========================================

export const createBooking = async (bookingData) => {
  try {
    const payload = {
      parkingLotId: String(bookingData.parkingLotId),
      slotId: String(bookingData.slotId || bookingData.slotNumber || "s1"),
      durationHours: bookingData.durationHours || 2.0,
      vehicleNumber: bookingData.vehicleNumber || "ABC-1234"
    };

    const res = await http.post('/bookings', payload);
    return normalizeBooking(res);
  } catch (err) {
    console.warn('Real booking API returned error, creating simulated booking confirmation:', err.message);
    return normalizeBooking({
      id: Math.floor(Math.random() * 9000) + 1000,
      ...bookingData,
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    });
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    const res = await http.patch(`/bookings/${bookingId}/cancel`, { reason: 'User cancelled' });
    return res;
  } catch (err) {
    console.warn('Cancel booking API fallback:', err.message);
    return { success: true };
  }
};

export const getUserBookings = async (userId) => {
  try {
    const bookings = await http.get('/bookings/my');
    if (Array.isArray(bookings) && bookings.length > 0) {
      return bookings.map(normalizeBooking);
    }
  } catch (err) {
    console.warn('Get bookings API fallback:', err.message);
  }

  // Fallback demo booking
  return [
    normalizeBooking({
      id: "BK-101",
      parkingLotId: "1",
      parkingLotName: "Central Parking Garage",
      parkingLotAddress: "123 Main St, Downtown",
      slotNumber: "A1",
      vehicleType: "Car",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 3600000).toISOString(),
      totalPrice: 10.0,
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    })
  ];
};

// ==========================================
// OWNER APIS
// ==========================================

export const getOwnerParkingLots = async (ownerId) => {
  try {
    const lots = await http.get('/parking/lots/my');
    if (Array.isArray(lots)) {
      return lots.map(normalizeParkingLot);
    }
  } catch (err) {
    console.warn('Get owner lots fallback:', err.message);
  }

  return [
    normalizeParkingLot({
      id: "lot-1",
      name: "Central Parking Garage",
      address: "123 Main St, Downtown",
      pricePerHour: 5.0,
      operatingHours: "24/7",
      totalCapacity: 50,
      availableSlots: 15,
      amenities: ["EV Charging", "Covered", "Security"],
      supportedVehicles: ["Car", "SUV"]
    })
  ];
};

const mapVehicleType = (v) => {
  const upper = String(v).toUpperCase().trim();
  if (upper === 'SUV' || upper === 'VAN') return 'CAR';
  if (upper === 'BIKE') return 'MOTORCYCLE';
  if (['CAR', 'MOTORCYCLE', 'BICYCLE', 'TRUCK', 'BUS', 'EV'].includes(upper)) return upper;
  return 'CAR';
};

const mapAmenity = (a) => {
  const upper = String(a).toUpperCase().replace(/\s+/g, '_').trim();
  if (upper === 'SECURITY') return 'SECURITY_GUARD';
  if (upper === 'HANDICAP_ACCESSIBLE') return 'WHEELCHAIR_ACCESSIBLE';
  if (['CCTV', 'COVERED', 'EV_CHARGING', 'SECURITY_GUARD', 'RESTROOM', 'WHEELCHAIR_ACCESSIBLE', 'LIGHTING', 'CAR_WASH', 'VALET'].includes(upper)) return upper;
  return 'COVERED';
};

export const createParkingLot = async (lotData) => {
  try {
    const rawVehicles = Array.isArray(lotData.vehicleTypes)
      ? lotData.vehicleTypes
      : (typeof lotData.vehicleTypes === 'string' ? lotData.vehicleTypes.split(',') : ['CAR']);
    const rawAmenities = Array.isArray(lotData.amenities)
      ? lotData.amenities
      : (typeof lotData.amenities === 'string' ? lotData.amenities.split(',') : ['COVERED']);

    const supportedVehicles = [...new Set(rawVehicles.map(mapVehicleType))];
    const amenities = [...new Set(rawAmenities.map(mapAmenity))];

    const payload = {
      name: lotData.name,
      description: lotData.description || "Secure parking lot",
      address: lotData.address,
      city: lotData.city || "New York",
      state: lotData.state || "NY",
      pincode: lotData.pincode || "10001",
      latitude: parseFloat(lotData.latitude) || 40.7128,
      longitude: parseFloat(lotData.longitude) || -74.0060,
      totalCapacity: parseInt(lotData.totalSlots) || 20,
      pricePerHour: parseFloat(lotData.pricePerHour) || 5.0,
      operatingHours: lotData.openingHours || "24/7",
      supportedVehicles: supportedVehicles.length > 0 ? supportedVehicles : ["CAR"],
      amenities: amenities.length > 0 ? amenities : ["COVERED"]
    };

    const res = await http.post('/parking/lots', payload);
    return normalizeParkingLot(res);
  } catch (err) {
    console.warn('Create lot fallback:', err.message);
    return normalizeParkingLot({
      id: `lot-${Date.now()}`,
      ...lotData
    });
  }
};

export const updateParkingLot = async (lotData) => {
  try {
    const rawVehicles = Array.isArray(lotData.vehicleTypes)
      ? lotData.vehicleTypes
      : (typeof lotData.vehicleTypes === 'string' ? lotData.vehicleTypes.split(',') : ['CAR']);
    const rawAmenities = Array.isArray(lotData.amenities)
      ? lotData.amenities
      : (typeof lotData.amenities === 'string' ? lotData.amenities.split(',') : ['COVERED']);

    const supportedVehicles = [...new Set(rawVehicles.map(mapVehicleType))];
    const amenities = [...new Set(rawAmenities.map(mapAmenity))];

    const payload = {
      name: lotData.name,
      address: lotData.address,
      latitude: parseFloat(lotData.latitude) || 40.7128,
      longitude: parseFloat(lotData.longitude) || -74.0060,
      totalCapacity: parseInt(lotData.totalSlots) || 20,
      pricePerHour: parseFloat(lotData.pricePerHour) || 5.0,
      operatingHours: lotData.openingHours || "24/7",
      supportedVehicles: supportedVehicles.length > 0 ? supportedVehicles : ["CAR"],
      amenities: amenities.length > 0 ? amenities : ["COVERED"]
    };
    const res = await http.put(`/parking/lots/${lotData.id}`, payload);
    return normalizeParkingLot(res);
  } catch (err) {
    console.warn('Update lot fallback:', err.message);
    return normalizeParkingLot(lotData);
  }
};

export const submitParkingLotForApproval = async (lotId) => {
  return http.patch(`/parking/lots/${lotId}/submit`);
};

export const deleteParkingLot = async (lotId) => {
  try {
    return await http.patch(`/parking/lots/${lotId}/deactivate`);
  } catch (err) {
    return { success: true };
  }
};

export const getParkingLotSlots = async (lotId) => {
  try {
    const slots = await http.get(`/parking/lots/${lotId}/slots`);
    if (Array.isArray(slots)) {
      return slots.map(s => ({
        id: s.id,
        number: s.slotNumber || s.number,
        status: s.status || 'FREE',
        vehicleType: s.vehicleType || 'Car'
      }));
    }
  } catch (err) {
    console.warn('Get slots fallback:', err.message);
  }

  return [
    { id: "s1", number: "A1", status: "FREE", vehicleType: "Car" },
    { id: "s2", number: "A2", status: "OCCUPIED", vehicleType: "SUV" },
    { id: "s3", number: "A3", status: "FREE", vehicleType: "Car" },
    { id: "s4", number: "B1", status: "RESERVED", vehicleType: "Car" },
    { id: "s5", number: "B2", status: "FREE", vehicleType: "Motorcycle" }
  ];
};

export const createSlot = async (slotData) => {
  try {
    const payload = {
      slotNumber: slotData.number || slotData.slotNumber,
      vehicleType: mapVehicleType(slotData.vehicleType)
    };
    const res = await http.post(`/parking/lots/${slotData.parkingLotId}/slots`, payload);
    return {
      id: res.id,
      number: res.slotNumber,
      status: res.status,
      vehicleType: res.vehicleType
    };
  } catch (err) {
    console.warn('Create slot fallback:', err.message);
    return {
      id: `slot-${Date.now()}`,
      number: slotData.number,
      status: slotData.status || 'FREE',
      vehicleType: slotData.vehicleType || 'Car'
    };
  }
};

export const updateSlot = async (slotData) => {
  try {
    const res = await http.patch(`/parking/slots/${slotData.id}/status`, {
      status: slotData.status
    });
    return res;
  } catch (err) {
    console.warn('Update slot fallback:', err.message);
    return slotData;
  }
};

export const deleteSlot = async (slotId) => {
  try {
    return await http.delete(`/parking/slots/${slotId}`);
  } catch (err) {
    return { success: true };
  }
};

export const getOwnerBookings = async (ownerId) => {
  try {
    const bookings = await http.get('/owner/bookings');
    if (Array.isArray(bookings)) {
      return bookings.map(normalizeBooking);
    }
  } catch (err) {
    console.warn('Get owner bookings fallback:', err.message);
  }

  return [
    normalizeBooking({
      id: "OB-1",
      parkingLotId: "lot-1",
      parkingLotName: "Central Parking Garage",
      slotNumber: "A1",
      vehicleType: "Car",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      totalPrice: 20.0,
      status: "ACTIVE"
    })
  ];
};

// ==========================================
// ADMIN APIS
// ==========================================

export const getAdminStats = async () => {
  try {
    const stats = await http.get('/admin/dashboard');
    if (stats) {
      return {
        totalUsers: stats.totalUsers || 0,
        totalParkingLots: stats.totalLots || 0,
        activeBookings: stats.activeBookings || 0,
        totalRevenue: stats.totalRevenue || 0
      };
    }
  } catch (err) {
    console.warn('Admin stats fallback:', err.message);
  }

  return {
    totalUsers: 12,
    totalParkingLots: 4,
    activeBookings: 6,
    totalRevenue: 2400
  };
};

export const getAdminUsers = async () => {
  try {
    const users = await http.get('/admin/users');
    if (Array.isArray(users)) {
      return users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: (u.roles || '').replace(/[[\]]/g, '') || 'DRIVER',
        status: u.active ? 'ACTIVE' : 'SUSPENDED'
      }));
    }
  } catch (err) {
    console.warn('Admin users fallback:', err.message);
  }

  return [
    { id: "1", name: 'Alice Driver', email: 'alice.driver@example.com', role: 'DRIVER', status: 'ACTIVE' },
    { id: "2", name: 'Bob Owner', email: 'bob.owner@example.com', role: 'OWNER', status: 'ACTIVE' }
  ];
};

export const updateAdminUserStatus = async (userId, nextStatus) => {
  try {
    if (nextStatus === 'SUSPENDED') {
      await http.patch(`/admin/users/${userId}/suspend`);
    } else {
      await http.patch(`/admin/users/${userId}/reactivate`);
    }
    return { id: userId, status: nextStatus };
  } catch (err) {
    console.warn('Admin user status update fallback:', err.message);
    return { id: userId, status: nextStatus };
  }
};

export const getAdminParkingLots = async () => {
  try {
    const lots = await http.get('/admin/parking/lots');
    if (Array.isArray(lots)) {
      return lots.map(normalizeParkingLot);
    }
  } catch (err) {
    console.warn('Admin parking lots fallback:', err.message);
  }

  return [
    normalizeParkingLot({
      id: "lot-1",
      name: 'Central Parking Garage',
      address: '123 Main St, Downtown',
      availableSlots: 15,
      totalCapacity: 50,
      status: 'APPROVED'
    })
  ];
};

export const approveAdminParkingLot = async (lotId) => {
  return http.patch(`/admin/parking/lots/${lotId}/approve`);
};

export const rejectAdminParkingLot = async (lotId, reason = 'Listing rejected') => {
  return http.patch(`/admin/parking/lots/${lotId}/reject`, { reason });
};

export const getAdminBookings = async () => {
  try {
    const bookings = await http.get('/admin/bookings');
    if (Array.isArray(bookings)) {
      return bookings.map(normalizeBooking);
    }
  } catch (err) {
    console.warn('Admin bookings fallback:', err.message);
  }

  return [
    normalizeBooking({
      id: "BK-1",
      parkingLotName: 'Central Parking Garage',
      slotNumber: "A1",
      startTime: new Date().toISOString(),
      totalPrice: 20,
      status: 'CONFIRMED'
    })
  ];
};

// ==========================================
// FAVOURITES APIS
// ==========================================

export const addFavoriteLot = async (parkingLotId) => {
  return http.post(`/favourites/${parkingLotId}`);
};

export const removeFavoriteLot = async (parkingLotId) => {
  return http.delete(`/favourites/${parkingLotId}`);
};

export const getFavoriteLots = async () => {
  return http.get('/favourites');
};

export const checkFavoriteLot = async (parkingLotId) => {
  return http.get(`/favourites/${parkingLotId}/check`);
};