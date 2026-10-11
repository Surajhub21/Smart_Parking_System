// Mock API service for parking lots
// In a real app, this would make HTTP requests to the backend

export const fetchParkingLots = async (params) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock data with real-time variations
  const baseMockParkingLots = [
    {
      id: 1,
      name: "Central Parking Garage",
      address: "123 Main St, Downtown",
      latitude: 40.7128,
      longitude: -74.0060,
      baseAvailableSlots: 15,
      totalSlots: 50,
      pricePerHour: 5.00,
      amenities: ["EV Charging", "Covered", "Security"],
      vehicleTypes: ["Car", "SUV", "Motorcycle"],
      openingHours: "24/7",
      distance: 0.5 // miles
    },
    {
      id: 2,
      name: "Riverfront Parking",
      address: "456 River Ave, Uptown",
      latitude: 40.7200,
      longitude: -74.0100,
      baseAvailableSlots: 8,
      totalSlots: 30,
      pricePerHour: 4.50,
      amenities: ["EV Charging", "Security"],
      vehicleTypes: ["Car", "SUV"],
      openingHours: "6:00 AM - 10:00 PM",
      distance: 1.2
    },
    {
      id: 3,
      name: "University Parking",
      address: "789 Campus Dr, University Area",
      latitude: 40.7300,
      longitude: -74.0200,
      baseAvailableSlots: 25,
      totalSlots: 100,
      pricePerHour: 3.00,
      amenities: ["Covered", "Security"],
      vehicleTypes: ["Car", "Motorcycle", "Bicycle"],
      openingHours: "24/7",
      distance: 2.1
    }
  ];

  // Apply real-time variations to availableSlots
  const mockParkingLots = baseMockParkingLots.map(lot => {
    // Simulate real-time change: availableSlots fluctuates by +/- 2
    const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const availableSlots = Math.max(0, Math.min(lot.totalSlots, lot.baseAvailableSlots + change));
    return {
      ...lot,
      availableSlots,
      // Remove baseAvailableSlots from the returned object
      baseAvailableSlots: undefined
    };
  });

  // Filter by distance if provided
  if (params && params.maxDistance !== undefined) {
    return mockParkingLots.filter(lot => lot.distance <= params.maxDistance);
  }

  return mockParkingLots;
};

export const fetchParkingLotById = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  // In a real app, we would fetch by id
  const mockLot = {
    id: id,
    name: "Central Parking Garage",
    address: "123 Main St, Downtown",
    latitude: 40.7128,
    longitude: -74.0060,
    availableSlots: 15,
    totalSlots: 50,
    pricePerHour: 5.00,
    amenities: ["EV Charging", "Covered", "Security"],
    vehicleTypes: ["Car", "SUV", "Motorcycle"],
    openingHours: "24/7",
    slots: [
      { id: 1, number: "A1", status: "FREE", vehicleType: "Car" },
      { id: 2, number: "A2", status: "OCCUPIED", vehicleType: "SUV" },
      { id: 3, number: "A3", status: "FREE", vehicleType: "Car" },
      { id: 4, number: "B1", status: "RESERVED", vehicleType: "Car" },
      { id: 5, number: "B2", status: "FREE", vehicleType: "Motorcycle" }
    ]
  };
  return mockLot;
};

export const createBooking = async (bookingData) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Mock successful booking
  return {
    id: Math.floor(Math.random() * 1000) + 1,
    ...bookingData,
    parkingLot: bookingData.parkingLot || {
      id: bookingData.parkingLotId || 1,
      name: "Central Parking Garage",
      address: "123 Main St, Downtown"
    },
    slot: bookingData.slot || { number: bookingData.slotNumber || "A1" },
    totalAmount: bookingData.totalAmount !== undefined ? bookingData.totalAmount : 20.00,
    status: "ACTIVE",
    createdAt: new Date().toISOString()
  };
};

export const cancelBooking = async (bookingId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
};

export const getUserBookings = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Mock user bookings
  return [
    {
      id: 1,
      parkingLot: {
        id: 1,
        name: "Central Parking Garage",
        address: "123 Main St, Downtown"
      },
      slot: { number: "A1" },
      vehicleType: "Car",
      startTime: "2026-10-11T10:00:00Z",
      endTime: "2026-10-11T14:00:00Z",
      totalAmount: 20.00,
      status: "ACTIVE",
      createdAt: "2026-10-11T09:30:00Z"
    }
  ];
};

// Owner-specific API functions
export const getOwnerParkingLots = async (ownerId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Mock owner's parking lots
  return [
    {
      id: 1,
      ownerId: ownerId,
      name: "Central Parking Garage",
      address: "123 Main St, Downtown",
      pricePerHour: 5.00,
      openingHours: "24/7",
      amenities: ["EV Charging", "Covered", "Security"],
      vehicleTypes: ["Car", "SUV", "Motorcycle"],
      totalSlots: 50
    },
    {
      id: 2,
      ownerId: ownerId,
      name: "Riverfront Parking",
      address: "456 River Ave, Uptown",
      pricePerHour: 4.50,
      openingHours: "6:00 AM - 10:00 PM",
      amenities: ["EV Charging", "Security"],
      vehicleTypes: ["Car", "SUV"],
      totalSlots: 30
    }
  ];
};

export const createParkingLot = async (lotData) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Mock successful creation
  return {
    id: Math.floor(Math.random() * 1000) + 100,
    ...lotData
  };
};

export const updateParkingLot = async (lotData) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  // Mock successful update
  return {
    id: lotData.id,
    ...lotData
  };
};

export const deleteParkingLot = async (lotId) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return { success: true };
};

export const getParkingLotSlots = async (lotId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Mock slots for a parking lot
  return [
    { id: 1, number: "A1", status: "FREE", vehicleType: "Car" },
    { id: 2, number: "A2", status: "OCCUPIED", vehicleType: "SUV" },
    { id: 3, number: "A3", status: "FREE", vehicleType: "Car" },
    { id: 4, number: "B1", status: "RESERVED", vehicleType: "Car" },
    { id: 5, number: "B2", status: "FREE", vehicleType: "Motorcycle" },
    { id: 6, number: "B3", status: "MAINTENANCE", vehicleType: "Car" }
  ];
};

export const createSlot = async (slotData) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Mock successful creation
  return {
    id: Math.floor(Math.random() * 1000) + 100,
    ...slotData
  };
};

export const updateSlot = async (slotData) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Mock successful update
  return {
    id: slotData.id,
    ...slotData
  };
};

export const deleteSlot = async (slotId) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return { success: true };
};

export const getOwnerBookings = async (ownerId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Mock bookings for owner's parking lots
  return [
    {
      id: 1,
      parkingLot: {
        id: 1,
        name: "Central Parking Garage",
        address: "123 Main St, Downtown"
      },
      slot: { number: "A1" },
      user: { id: 2, name: "john_doe" },
      startTime: "2026-10-11T10:00:00Z",
      endTime: "2026-10-11T14:00:00Z",
      totalAmount: 20.00,
      status: "ACTIVE",
      createdAt: "2026-10-11T09:30:00Z"
    },
    {
      id: 2,
      parkingLot: {
        id: 2,
        name: "Riverfront Parking",
        address: "456 River Ave, Uptown"
      },
      slot: { number: "B1" },
      user: { id: 3, name: "jane_smith" },
      startTime: "2026-10-11T12:00:00Z",
      endTime: "2026-10-11T16:00:00Z",
      totalAmount: 18.00,
      status: "ACTIVE",
      createdAt: "2026-10-11T11:30:00Z"
    }
  ];
};

// Admin-specific API functions
export const getAdminStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return {
    totalUsers: 128,
    totalParkingLots: 24,
    activeBookings: 37,
    totalRevenue: 12840
  };
};

export const getAdminUsers = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return [
    { id: 1, name: 'john_doe', email: 'john@example.com', role: 'DRIVER', status: 'ACTIVE' },
    { id: 2, name: 'jane_smith', email: 'jane@example.com', role: 'DRIVER', status: 'ACTIVE' },
    { id: 3, name: 'parking_owner', email: 'owner@example.com', role: 'OWNER', status: 'ACTIVE' },
    { id: 4, name: 'blocked_driver', email: 'blocked@example.com', role: 'DRIVER', status: 'SUSPENDED' }
  ];
};

export const updateAdminUserStatus = async (userId, status) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const users = await getAdminUsers();
  const user = users.find(item => item.id === userId);
  if (!user) {
    throw new Error('User not found.');
  }
  return { ...user, status };
};

export const getAdminParkingLots = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return [
    {
      id: 1,
      name: 'Central Parking Garage',
      address: '123 Main St, Downtown',
      ownerName: 'parking_owner',
      availableSlots: 15,
      totalSlots: 50,
      status: 'APPROVED'
    },
    {
      id: 2,
      name: 'Riverfront Parking',
      address: '456 River Ave, Uptown',
      ownerName: 'parking_owner',
      availableSlots: 8,
      totalSlots: 30,
      status: 'PENDING'
    }
  ];
};

export const getAdminBookings = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return [
    {
      id: 1,
      parkingLot: { name: 'Central Parking Garage' },
      user: { name: 'john_doe' },
      startTime: '2026-10-11T10:00:00Z',
      totalAmount: 20,
      status: 'CONFIRMED'
    },
    {
      id: 2,
      parkingLot: { name: 'Riverfront Parking' },
      user: { name: 'jane_smith' },
      startTime: '2026-10-11T12:00:00Z',
      totalAmount: 18,
      status: 'CANCELLED'
    }
  ];
};