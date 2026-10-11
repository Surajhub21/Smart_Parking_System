# Project Diagnosis & Fix Roadmap (`wrong.md`)

This document lists all defects, startup failures, runtime crashes, and architectural inconsistencies found during separate testing of the **Backend (Spring Boot)** and **Frontend (React + Vite)** applications, along with step-by-step remediation plans.

---

## 1. Summary of Execution Status

| Component | Status | Execution Result |
|---|---|---|
| **Backend (Spring Boot)** | ❌ **CRITICAL FAILURE** | Crashes on startup with `BeanDefinitionOverrideException: Invalid bean definition with name 'mongoAuditingHandler'`. Context cannot load. |
| **Frontend (React + Vite)** | ⚠️ **PARTIAL / RUNTIME CRASHES** | Dev server runs on port 5173, but critical runtime crashes exist (`ReferenceError: navigate is not defined`), polling loop bugs in `useRealtime`, broken navigation links, and data mismatches. |

---

## 2. Backend Issues & Step-by-Step Fixes

### Issue B1: Duplicate `@EnableMongoAuditing` Causes Application Startup Crash (Fatal)
- **Files Affected:**
  - [SmartParkingApplication.java](file:///d:/All_Programme_File/Others/College_Final_Project/backend/src/main/java/com/example/smartparking/SmartParkingApplication.java#L10)
  - [MongoConfig.java](file:///d:/All_Programme_File/Others/College_Final_Project/backend/src/main/java/com/example/smartparking/config/MongoConfig.java#L12)
- **Root Cause:**
  Both `SmartParkingApplication` and `MongoConfig` declare `@EnableMongoAuditing`. During context initialization, Spring Data MongoDB tries to register the `mongoAuditingHandler` bean twice. Because bean overriding is disabled by default in Spring Boot 3.4 (`allow-bean-definition-overriding=false`), Spring throws `BeanDefinitionOverrideException` and terminates startup immediately.
- **Observed Error:**
  ```text
  APPLICATION FAILED TO START
  Description:
  The bean 'mongoAuditingHandler' could not be registered. A bean with that name has already been defined and overriding is disabled.
  Action:
  Consider renaming one of the beans or enabling overriding by setting spring.main.allow-bean-definition-overriding=true
  ```
- **Steps to Fix:**
  1. Remove `@EnableMongoAuditing` from [SmartParkingApplication.java](file:///d:/All_Programme_File/Others/College_Final_Project/backend/src/main/java/com/example/smartparking/SmartParkingApplication.java), keeping it exclusively in [MongoConfig.java](file:///d:/All_Programme_File/Others/College_Final_Project/backend/src/main/java/com/example/smartparking/config/MongoConfig.java).
  2. Verify that `SmartParkingApplicationTests.contextLoads()` passes cleanly with `./mvnw test`.
  3. Verify that the server boots cleanly on port 8080 with `./mvnw spring-boot:run`.

---

## 3. Frontend Issues & Step-by-Step Fixes

### Issue F1: Uncaught `ReferenceError: navigate is not defined` in `DriverHome.jsx` (Fatal)
- **File Affected:**
  - [DriverHome.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/DriverHome.jsx#L3)
  - [DriverHome.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/DriverHome.jsx#L199)
- **Root Cause:**
  `useNavigate` is imported on line 3, but `const navigate = useNavigate();` was never declared inside the `DriverHome` component. On line 199, clicking "View Details" in the Leaflet map popup executes `navigate('/parking-lot/${lot.id}')`, which immediately crashes the React component with `ReferenceError: navigate is not defined`.
- **Steps to Fix:**
  1. Add `const navigate = useNavigate();` inside the `DriverHome` component body.
  2. Add an `onClick={() => navigate('/parking-lot/' + lot.id)}` handler to the search result card list items (lines 232–259) so drivers can also click results from the list, not only the map popup.

---

### Issue F2: Uncaught `ReferenceError: navigate is not defined` in `ParkingLotDetails.jsx` (Fatal)
- **File Affected:**
  - [ParkingLotDetails.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/ParkingLotDetails.jsx#L2)
  - [ParkingLotDetails.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/ParkingLotDetails.jsx#L105)
- **Root Cause:**
  `useNavigate` is imported on line 2, but `const navigate = useNavigate();` is not instantiated in `ParkingLotDetails`. When a user submits a booking on line 105 (`navigate('/booking-confirmation', { state: { booking } })`), the application crashes with `ReferenceError: navigate is not defined`.
- **Steps to Fix:**
  1. Add `const navigate = useNavigate();` inside `ParkingLotDetails`.
  2. Verify booking submission smoothly redirects to `/booking-confirmation`.

---

### Issue F3: Infinite / Rapid Re-fetch Loop in `useRealtime` Hook
- **Files Affected:**
  - [DriverHome.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/DriverHome.jsx#L48-L51)
  - [useRealtime.js](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/hooks/useRealtime.js#L40)
- **Root Cause:**
  In `DriverHome.jsx`:
  ```javascript
  const { data: lots, loading: realtimeLoading, error: realtimeError } = useRealtime(
    () => fetchParkingLots({ maxDistance: searchRadius }),
    5000
  );
  ```
  An inline arrow function literal is passed as `callback` on every render. In `useRealtime.js`, the effect dependency array is `[callback, intervalMs]`. Because `callback` is a new reference on every render, the effect cleans up and restarts immediately on every state update, firing the fetch every ~500ms instead of waiting for the 5-second interval.
- **Steps to Fix:**
  1. In `useRealtime.js`, store `callback` in a ref (`const callbackRef = useRef(callback); callbackRef.current = callback;`) and remove `callback` from the effect dependency array, OR memoize `fetchLots` with `useCallback` in `DriverHome.jsx`.
  2. Ensure polling adheres strictly to the 5000ms timer without redundant requests.

---

### Issue F4: Indefinite "Detecting your location..." Hang on Geolocation
- **File Affected:**
  - [DriverHome.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/DriverHome.jsx#L26-L45)
- **Root Cause:**
  `navigator.geolocation.getCurrentPosition(...)` has no timeout options configured. If a browser doesn't prompt, is slow, or the user ignores permission, `searchLocation` remains `null`. The component stays permanently locked on line 65: `<p>Detecting your location...</p>` with no fallback button or timeout.
- **Steps to Fix:**
  1. Pass an options object `{ timeout: 5000, maximumAge: 60000 }` to `getCurrentPosition`.
  2. Add a fallback timer `setTimeout` (e.g. 3–4 seconds) that automatically sets default coordinates (e.g. city center) if the browser does not respond promptly.

---

### Issue F5: Dead Link to `/profile` in Header
- **Files Affected:**
  - [Header.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/components/Header.jsx#L36)
  - [App.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/App.jsx#L25-L35)
- **Root Cause:**
  `Header.jsx` displays a "Profile" navigation link for DRIVER, OWNER, and ADMIN roles pointing to `/profile`. However, there is no `/profile` route registered in `App.jsx`, and no `Profile.jsx` page component exists. Clicking "Profile" renders an empty blank page body.
- **Steps to Fix:**
  1. Create a `Profile.jsx` page showing the signed-in user's name, email, and role, or remove the link until implemented.
  2. Register `<Route path="/profile" element={<Profile />} />` in `App.jsx`.

---

### Issue F6: Missing 404 / Catch-all Route in `App.jsx`
- **File Affected:**
  - [App.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/App.jsx#L25-L35)
- **Root Cause:**
  Any navigation to an unmatched route (e.g. misspelled URL or `/unknown`) shows a blank section between Header and Footer with no notification to the user.
- **Steps to Fix:**
  1. Create a `NotFound.jsx` component.
  2. Add `<Route path="*" element={<NotFound />} />` at the end of the `<Routes>` list in `App.jsx`.

---

### Issue F7: `BookingConfirmation.jsx` Displays "Unknown Parking Lot", "Not Assigned", and "$0.00"
- **Files Affected:**
  - [BookingConfirmation.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/BookingConfirmation.jsx#L133-L163)
  - [api.js](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/services/api.js#L101-L110)
  - [ParkingLotDetails.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/ParkingLotDetails.jsx#L92-L99)
- **Root Cause:**
  - `ParkingLotDetails.jsx` creates `bookingData` with flat fields: `{ parkingLotId: parkingLot.id, slotNumber: 'A1', ... }`.
  - `createBooking` in `api.js` returns only those flat fields with an ID and status.
  - `BookingConfirmation.jsx` expects structured objects: `booking.parkingLot?.name`, `booking.slot?.number`, and `booking.totalAmount`.
  - Because `booking.parkingLot`, `booking.slot`, and `booking.totalAmount` are missing, the UI defaults to:
    - Parking Lot: `Unknown Parking Lot`
    - Slot: `Not Assigned`
    - Total Amount: `$0.00`
- **Steps to Fix:**
  1. Update `createBooking` in `src/services/api.js` (and `handleBookingSubmit` in `ParkingLotDetails.jsx`) to include `parkingLot: { id, name, address }`, `slot: { number }`, and calculate `totalAmount = hours * pricePerHour`.
  2. Align the booking schema between `ParkingLotDetails.jsx`, `createBooking`, and `BookingConfirmation.jsx`.

---

### Issue F8: `BookingHistory.jsx` Displays `Invalid Date`
- **Files Affected:**
  - [BookingHistory.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/BookingHistory.jsx#L180)
  - [api.js](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/services/api.js#L117-L135)
- **Root Cause:**
  `BookingHistory.jsx` attempts to format `{new Date(booking.createdAt).toLocaleDateString()}`. However, the mock object in `getUserBookings(userId)` inside `api.js` does not include a `createdAt` property. `new Date(undefined)` produces `Invalid Date`, which renders directly on the UI card.
- **Steps to Fix:**
  1. Add `createdAt: "2026-10-11T09:00:00Z"` to each mock item in `getUserBookings` in `src/services/api.js`.
  2. Guard against missing dates in `BookingHistory.jsx`: `booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'`.

---

### Issue F9: Full Page Refreshes in `Favorites.jsx`
- **File Affected:**
  - [Favorites.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/Favorites.jsx#L66)
  - [Favorites.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/Favorites.jsx#L118)
- **Root Cause:**
  `Favorites.jsx` uses `window.location.href = '/'` and `window.location.href = '/parking-lot/' + lot.id` instead of React Router's `navigate` / `<Link>`. This triggers full browser reloads, resetting client-side in-memory state.
- **Steps to Fix:**
  1. Import and instantiate `useNavigate` in `Favorites.jsx`.
  2. Replace `window.location.href` assignments with `navigate('/')` and `navigate('/parking-lot/' + lot.id)`.

---

### Issue F10: Favorite ID Type Mismatch (Number vs String)
- **Files Affected:**
  - [FavoritesContext.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/context/FavoritesContext.jsx#L35)
  - [ParkingLotDetails.jsx](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/src/pages/ParkingLotDetails.jsx#L8)
- **Root Cause:**
  `useParams()` in `ParkingLotDetails.jsx` returns `id` as a string (`"1"`). The mock list in `DriverHome` uses numeric IDs (`1`). `FavoritesContext.jsx` uses `Array.prototype.includes(lotId)`, which relies on strict equality (`===`). Consequently, checking `favorites.includes(1)` will fail if the saved favorite is string `"1"`.
- **Steps to Fix:**
  1. Normalize IDs to strings in `FavoritesContext.jsx` (`String(lotId)`).
  2. Ensure consistent comparisons across `addFavorite`, `removeFavorite`, and `isFavorite`.

---

### Issue F11: `frontend/package.json` Project Metadata
- **File Affected:**
  - [package.json](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/package.json#L2)
  - [package.json](file:///d:/All_Programme_File/Others/College_Final_Project/frontend/package.json#L8)
- **Root Cause:**
  - `"name"` is `"vite-temp"`.
  - `"build": "tsc && vite build"` runs `tsc` even though the project is pure JSX with `checkJs: false` in `tsconfig.json`.
- **Steps to Fix:**
  1. Rename `"name"` to `"smart-parking-frontend"`.
  2. Simplify `"build"` to `"vite build"` (or configure TypeScript properly if migration to TS is desired).
