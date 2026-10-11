# Project Diagnosis & Fix Roadmap (`wrong.md`)

This document lists all defects, startup failures, runtime crashes, and architectural inconsistencies found during separate testing of the **Backend (Spring Boot)** and **Frontend (React + Vite)** applications, along with their resolution status.

---

## 1. Summary of Execution Status

| Component | Initial Status | Current Status | Verification Result |
|---|---|---|---|
| **Backend (Spring Boot)** | ❌ **CRITICAL FAILURE** | ✅ **RESOLVED** | `./mvnw test` passes (0 failures, 0 errors). Spring Boot starts on port 8080 without bean conflicts. Health endpoint returns `{"status":"UP"}`. |
| **Frontend (React + Vite)** | ⚠️ **RUNTIME CRASHES** | ✅ **RESOLVED** | `npm run build` passes with 0 errors. All undeclared navigate references resolved. Polling loop stabilized, Profile & 404 routes added, date formatting guarded. |

---

## 2. Backend Issues & Resolutions

### Issue B1: Duplicate `@EnableMongoAuditing` Causes Application Startup Crash (Fatal) — ✅ FIXED
- **Files Affected:**
  - [SmartParkingApplication.java](file:///d:/All_Programme_File/Others/College_Final_Project/backend/src/main/java/com/example/smartparking/SmartParkingApplication.java)
  - [MongoConfig.java](file:///d:/All_Programme_File/Others/College_Final_Project/backend/src/main/java/com/example/smartparking/config/MongoConfig.java)
- **Fix Applied:**
  Removed the redundant `@EnableMongoAuditing` annotation and unused import from `SmartParkingApplication.java`, maintaining it solely in `MongoConfig.java`.
- **Verification:**
  - Ran `./mvnw test` -> `BUILD SUCCESS` (`SmartParkingApplicationTests.contextLoads()` passed).
  - Ran `./mvnw spring-boot:run` -> Server booted in 5.2s on port 8080.
  - Queried `http://localhost:8080/actuator/health` -> `{"status":"UP"}`.

---

## 3. Frontend Issues & Resolutions

### Issue F1: Uncaught `ReferenceError: navigate is not defined` in `DriverHome.jsx` — ✅ FIXED
- **File Affected:**
  - [DriverHome.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/DriverHome.jsx)
- **Fix Applied:**
  - Declared `const navigate = useNavigate();` inside the `DriverHome` component.
  - Added click navigation to parking lot result cards in the sidebar list (`onClick={() => navigate('/parking-lot/' + lot.id)}`).

---

### Issue F2: Uncaught `ReferenceError: navigate is not defined` in `ParkingLotDetails.jsx` — ✅ FIXED
- **File Affected:**
  - [ParkingLotDetails.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/ParkingLotDetails.jsx)
- **Fix Applied:**
  - Declared `const navigate = useNavigate();` inside `ParkingLotDetails`.
  - Upon booking creation, navigates cleanly to `/booking-confirmation`.

---

### Issue F3: Infinite / Rapid Re-fetch Loop in `useRealtime` Hook — ✅ FIXED
- **Files Affected:**
  - [useRealtime.js](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/hooks/useRealtime.js)
  - [DriverHome.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/DriverHome.jsx)
- **Fix Applied:**
  - Stored `callback` inside `useRef` in `useRealtime.js` so changing callback reference across renders does not clear and re-trigger timers.
  - Polling interval is now strictly maintained at 5000ms.

---

### Issue F4: Indefinite "Detecting your location..." Hang on Geolocation — ✅ FIXED
- **File Affected:**
  - [DriverHome.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/DriverHome.jsx)
- **Fix Applied:**
  - Added `{ timeout: 4000, maximumAge: 60000 }` to `navigator.geolocation.getCurrentPosition`.
  - Added an automated 4-second safety fallback timer that defaults to center coordinates if the browser or user does not grant location access promptly.

---

### Issue F5: Dead Link to `/profile` in Header — ✅ FIXED
- **Files Affected:**
  - [Header.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/components/Header.jsx)
  - [App.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/App.jsx)
  - [Profile.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/Profile.jsx)
- **Fix Applied:**
  - Created a responsive [Profile.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/Profile.jsx) component displaying account info, role badge, and role-based quick action buttons.
  - Registered route `<Route path="/profile" element={<Profile />} />` in `App.jsx`.

---

### Issue F6: Missing 404 / Catch-all Route in `App.jsx` — ✅ FIXED
- **Files Affected:**
  - [App.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/App.jsx)
  - [NotFound.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/NotFound.jsx)
- **Fix Applied:**
  - Created [NotFound.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/NotFound.jsx) with 404 messaging and navigation back to Home.
  - Added `<Route path="*" element={<NotFound />} />` in `App.jsx`.

---

### Issue F7: `BookingConfirmation.jsx` Displays "Unknown Parking Lot", "Not Assigned", and "$0.00" — ✅ FIXED
- **Files Affected:**
  - [BookingConfirmation.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/BookingConfirmation.jsx)
  - [api.js](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/services/api.js)
  - [ParkingLotDetails.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/ParkingLotDetails.jsx)
- **Fix Applied:**
  - `ParkingLotDetails.jsx` and `createBooking` now construct the booking object with `parkingLot: { id, name, address }`, `slot: { number }`, and calculate `totalAmount = durationHours * pricePerHour`.
  - `BookingConfirmation.jsx` recognizes both `ACTIVE` and `CONFIRMED` statuses.

---

### Issue F8: `BookingHistory.jsx` Displays `Invalid Date` — ✅ FIXED
- **Files Affected:**
  - [BookingHistory.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/BookingHistory.jsx)
  - [api.js](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/services/api.js)
- **Fix Applied:**
  - Added `createdAt` timestamp to mock items in `getUserBookings`.
  - Guarded date formatting in `BookingHistory.jsx` with fallback (`booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'`).

---

### Issue F9: Full Page Refreshes in `Favorites.jsx` — ✅ FIXED
- **File Affected:**
  - [Favorites.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/Favorites.jsx)
- **Fix Applied:**
  - Replaced `window.location.href` assignments with React Router `navigate('/')` and `navigate('/parking-lot/' + lot.id)`.

---

### Issue F10: Favorite ID Type Mismatch (Number vs String) — ✅ FIXED
- **File Affected:**
  - [FavoritesContext.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/context/FavoritesContext.jsx)
- **Fix Applied:**
  - Normalized IDs to strings (`String(lotId)`) inside `addFavorite`, `removeFavorite`, and `isFavorite`.

---

### Issue F11: `frontend/package.json` Project Metadata — ✅ FIXED
- **File Affected:**
  - [package.json](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/package.json)
- **Fix Applied:**
  - Updated `"name"` to `"smart-parking-frontend"`.
  - Configured `"build": "vite build"`.
