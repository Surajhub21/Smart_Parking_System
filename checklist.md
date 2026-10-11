# Backend-to-Frontend Integration Checklist (`checklist.md`)

This checklist defines the phase-by-phase roadmap for connecting the React (Vite) frontend with the Spring Boot (MongoDB) backend. Each phase has been connected, executed, and tested.

---

## Progress Overview

- [x] **Phase 1: Infrastructure & API Client Foundation** — ✅ PASSED
- [x] **Phase 2: Authentication & User Session Management** — ✅ PASSED
- [x] **Phase 3: Public Search & Parking Lot Discovery** — ✅ PASSED
- [x] **Phase 4: Slot Reservation & Driver Booking Management** — ✅ PASSED
- [x] **Phase 5: Driver Favourites Synchronization** — ✅ PASSED
- [x] **Phase 6: Owner Dashboard & Lot/Slot Management** — ✅ PASSED
- [x] **Phase 7: Admin Dashboard & Platform Moderation** — ✅ PASSED
- [x] **Phase 8: Real-Time Updates & Final End-to-End Hardening** — ✅ PASSED

---

## Detailed Phase Breakdown & Test Verification

### Phase 1: Infrastructure & API Client Foundation — ✅ PASSED
- [x] **1.1 Vite Proxy Configuration:** Configured [vite.config.js](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/vite.config.js) to proxy `/api` and `/ws` requests to `http://localhost:8080`.
- [x] **1.2 Central HTTP Client (`httpClient.js`):** Created [httpClient.js](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/services/httpClient.js) with session cookie forwarding (`credentials: 'include'`) and `ApiResponse<T>` unwrapping.
- [x] **1.3 Backend Database Seeding/Check:** MongoDB and Spring Boot running and active.
- [x] **Phase 1 Verification:** Tested `http://localhost:5173/api/search` through Vite proxy -> returned valid Spring Boot `ApiResponse` payload.

---

### Phase 2: Authentication & User Session Management — ✅ PASSED
- [x] **2.1 API Service Integration (`api.js` & `AuthContext.jsx`):** Connected auth actions to Spring Boot:
  - `POST /api/auth/register` (creates user in MongoDB with BCrypt hashed password and role)
  - `POST /api/auth/login` (authenticates and establishes Spring Security HTTP session)
  - `POST /api/auth/logout` (invalidates session cookie)
  - `GET /api/auth/me` (retrieves current authenticated profile)
- [x] **2.2 AuthContext Session Persistence:**
  - `AuthContext.jsx` restores session on mount using `GET /api/auth/me` so user stays logged in across page reloads.
- [x] **2.3 Register Page Enhancement:**
  - Added role selector (`DRIVER` / `OWNER`) and optional phone input with real validation feedback in [Register.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/Register.jsx).
- [x] **2.4 Login Page Enhancement:**
  - Implemented role-aware redirection (`/owner-dashboard`, `/admin-dashboard`, or `/`) and backend error feedback in [Login.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/Login.jsx).
- [x] **Phase 2 Verification:**
  - Registered `Alice Driver` -> saved in MongoDB with `DRIVER` role.
  - Registered `Bob Owner` -> saved in MongoDB with `OWNER` role.
  - Seeded and logged in as `admin@smartparking.com`.
  - Verified session cookie (`JSESSIONID`) persists across requests.
  - Verified logout clears session and subsequent `/me` returns 401.

---

### Phase 3: Public Search & Parking Lot Discovery — ✅ PASSED
- [x] **3.1 Search Service Integration (`api.js`):**
  - Connected `fetchParkingLots({ latitude, longitude, radiusKm })` -> `GET /api/search`.
  - Added Haversine fallback to [SearchService.java](file:///d:/All_Programme_File/Others/College_Final_Project/backend/src/main/java/com/example/smartparking/search/SearchService.java) when external OSRM daemon is offline.
  - Enabled MongoDB 2dsphere index creation automatically.
- [x] **3.2 DriverHome Map & Results:**
  - User coords query `GET /api/search` and render real parking cards and map markers in [DriverHome.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/DriverHome.jsx).
- [x] **3.3 ParkingLotDetails Integration:**
  - Connected `fetchParkingLotById(id)` -> `GET /api/parking/lots/public/{id}`.
  - Connected public slots -> `GET /api/parking/lots/public/{lotId}/slots`.
  - Real address, pricePerHour, operatingHours, amenities, and slots displayed in [ParkingLotDetails.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/ParkingLotDetails.jsx).
- [x] **Phase 3 Verification:**
  - Queried NYC coordinates (`40.748817, -73.985428`) -> successfully retrieved approved lot `Bob's Downtown Express Parking`.
  - Retrieved public slots `A-01 (CAR): FREE` and `EV-01 (EV): FREE`.

---

### Phase 4: Slot Reservation & Driver Booking Management — ✅ PASSED
- [x] **4.1 Booking API Integration (`api.js`):**
  - `createBooking(bookingData)` -> `POST /api/bookings`
  - `getUserBookings()` -> `GET /api/bookings/my`
  - `cancelBooking(id, reason)` -> `PATCH /api/bookings/{id}/cancel`
- [x] **4.2 Booking Flow in ParkingLotDetails:**
  - Connected booking modal with vehicle selection, start/end time, and duration calculation.
  - Passes real `parkingLotId`, `slotId`, `durationHours` to backend.
- [x] **4.3 BookingHistory Integration:**
  - Fetches driver bookings on mount in [BookingHistory.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/BookingHistory.jsx).
  - Connected cancel booking button with immediate UI update.
- [x] **Phase 4 Verification:**
  - Reserved Slot `A-01` as Alice Driver -> booking reference `SPF-5D9F2817` created in MongoDB.
  - Slot status automatically transitioned to `RESERVED`.
  - Verified booking in `GET /api/bookings/my` with duration and price calculation.
  - Cancelled booking -> status became `CANCELLED` and slot reverted to `FREE`.

---

### Phase 5: Driver Favourites Synchronization — ✅ PASSED
- [x] **5.1 Favourites API Integration (`api.js`):**
  - `addFavoriteLot(parkingLotId)` -> `POST /api/favourites/{parkingLotId}`
  - `removeFavoriteLot(parkingLotId)` -> `DELETE /api/favourites/{parkingLotId}`
  - `getFavoriteLots()` -> `GET /api/favourites`
  - `checkFavoriteLot(parkingLotId)` -> `GET /api/favourites/{parkingLotId}/check`
- [x] **5.2 FavoritesContext Sync:**
  - Connected [FavoritesContext.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/context/FavoritesContext.jsx) to sync favourites state with MongoDB when driver is authenticated.
- [x] **5.3 Favorites Page View:**
  - Drivers view saved lots in [Favorites.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/Favorites.jsx).
- [x] **Phase 5 Verification:**
  - Added lot to favourites -> stored in MongoDB `favourites` collection.
  - `checkFavoriteLot` returned `true`.
  - Retrieved in `GET /api/favourites`.
  - Removed lot -> removed from MongoDB, `checkFavoriteLot` returned `false`.

---

### Phase 6: Owner Dashboard & Lot/Slot Management — ✅ PASSED
- [x] **6.1 Owner Parking Lot APIs:**
  - `getOwnerParkingLots()` -> `GET /api/parking/lots/my`
  - `createParkingLot(lotData)` -> `POST /api/parking/lots` with enum mappers for `VehicleType` and `Amenity`.
  - `updateParkingLot(lotData)` -> `PUT /api/parking/lots/{id}`
  - `submitParkingLotForApproval(id)` -> `PATCH /api/parking/lots/{id}/submit`
- [x] **6.2 Owner Slot Management APIs:**
  - `getParkingLotSlots(lotId)` -> `GET /api/parking/lots/{lotId}/slots`
  - `createSlot(slotData)` -> `POST /api/parking/lots/{lotId}/slots`
  - `updateSlot(slotData)` -> `PATCH /api/parking/slots/{slotId}/status`
  - `deleteSlot(slotId)` -> `DELETE /api/parking/slots/{slotId}`
- [x] **6.3 Owner Dashboard UI Enhancements:**
  - Added status badge (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`) and **"Submit for Approval"** button to [OwnerDashboard.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/OwnerDashboard.jsx).
- [x] **Phase 6 Verification:**
  - Logged in as Bob Owner -> created lot `Bob's Downtown Express Parking` (Status: `DRAFT`).
  - Added slots `A-01` and `EV-01` -> stored in MongoDB.
  - Submitted lot for approval -> status updated to `PENDING_APPROVAL`.

---

### Phase 7: Admin Dashboard & Platform Moderation — ✅ PASSED
- [x] **7.1 Admin API Integration:**
  - `getAdminStats()` -> `GET /api/admin/dashboard`
  - `getAdminUsers()` -> `GET /api/admin/users`
  - `updateAdminUserStatus(id, status)` -> `PATCH /api/admin/users/{id}/suspend` and `/reactivate`
  - `getAdminParkingLots()` -> `GET /api/admin/parking/lots`
  - `approveAdminParkingLot(id)` -> `PATCH /api/admin/parking/lots/{id}/approve`
  - `rejectAdminParkingLot(id, reason)` -> `PATCH /api/admin/parking/lots/{id}/reject`
  - `getAdminBookings()` -> `GET /api/admin/bookings`
- [x] **7.2 Admin Dashboard UI Enhancements:**
  - Added **"Approve"** and **"Reject"** action buttons and `PENDING_APPROVAL` status badge to [AdminDashboard.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/AdminDashboard.jsx).
- [x] **Phase 7 Verification:**
  - Logged in as Admin -> retrieved live platform statistics (`totalUsers: 6`, `pendingLots: 2`).
  - Fetched pending lots and approved `Bob's Downtown Express Parking` -> status transitioned to `APPROVED`.

---

### Phase 8: Real-Time Updates & Final End-to-End Hardening — ✅ PASSED
- [x] **8.1 Real-Time Slot Availability & Polling Hook:**
  - [useRealtime.js](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/hooks/useRealtime.js) configured with clean cancellation and live availability polling.
  - STOMP WebSocket endpoint `/ws` configured with SockJS fallback in backend.
- [x] **8.2 End-to-End Multi-Actor Lifecycle Test (`test_e2e_full.mjs`):**
  - **Step 1-4:** Bob Owner creates `Grand Central Metro Parking`, adds slot `GC-1`, submits for approval.
  - **Step 5-6:** Admin approves lot -> status becomes `APPROVED`.
  - **Step 7-9:** Alice Driver searches, finds approved lot, adds it to favourites.
  - **Step 10-12:** Alice Driver books slot `GC-1` -> receives booking reference `SPF-3AE6FE8C`. Slot immediately becomes `RESERVED` publicly. Booking appears in Alice's My Bookings.
  - **Step 13-14:** Alice Driver cancels booking -> booking marked `CANCELLED` and slot immediately returns to `FREE`.
- [x] **8.3 Frontend Build Verification:**
  - `npm run build` succeeds cleanly with 0 errors.
