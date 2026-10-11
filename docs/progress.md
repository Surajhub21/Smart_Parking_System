# Smart Parking Finder — Progress Tracker

**Last updated:** 2026-10-10

---

## Overall MVP Progress

| Metric | Value |
|--------|-------|
| **Current Phase** | Phase 1 — Free map and location proof of concept (Frontend scaffold) |
| **MVP Phases** | 0–10 |
| **Total MVP Tasks** | ~85 (estimated) |
| **Completed** | ~50 tasks |
| **Overall MVP %** | ~60% |

---

## Phase 0 — Project Foundation

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Inspect existing repository | ✅ DONE | Only master plan file existed |
| 2 | Create `/backend`, `/frontend`, `/docs` | ✅ DONE | Directories created |
| 3 | Configure Java 21, Spring Boot, Maven | ✅ DONE | `pom.xml` with Spring Boot 3.4.1, Java 21 |
| 4 | Configure MongoDB connection | ✅ DONE | `application.yml` with configurable `MONGODB_URI` |
| 5 | Add environment templates and `.gitignore` | ✅ DONE | `.env.example`, `.gitignore` |
| 6 | Create starter README | ✅ DONE | `README.md` with setup instructions |
| 7 | Backend builds and compiles | ✅ DONE | `mvnw compile` — BUILD SUCCESS |
| 8 | Verify MongoDB connectivity + backend starts | 🔲 NOT_STARTED | Requires running MongoDB + Java 21 |

---

## Phase 2 — Authentication and Roles

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Registration endpoint | ✅ DONE | `AuthController.register()` |
| 2 | Login endpoint (session-based) | ✅ DONE | `AuthController.login()` |
| 3 | Logout endpoint | ✅ DONE | `AuthController.logout()` |
| 4 | Profile retrieval | ✅ DONE | `AuthController.getCurrentUser()` |
| 5 | Password hashing (BCrypt) | ✅ DONE | `SecurityConfig.passwordEncoder()` |
| 6 | Email normalization + uniqueness | ✅ DONE | `User.@Indexed(unique)`, lowercase in AuthController |
| 7 | DRIVER, OWNER, ADMIN roles | ✅ DONE | `Role` enum, `UserPrincipal` with ROLE_ prefix |
| 8 | Authorization rules for endpoints | ✅ DONE | `SecurityConfig.securityFilterChain()` |
| 9 | Auth tests (unit + integration) | 🔲 NOT_STARTED | |
| 10 | Input validation tests | 🔲 NOT_STARTED | |

---

## Phase 3 — Parking Listing Management

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Define parking lot documents, DTOs, enums, validation | ✅ DONE | `ParkingLot`, `ParkingLotRequest`, `ParkingLotResponse`, `ListingStatus`, `VehicleType`, `Amenity` |
| 2 | Owner create/read/update/deactivate | ✅ DONE | `ParkingLotService` + `ParkingLotController` |
| 3 | Store GeoJSON correctly | ✅ DONE | `GeoJsonPoint` with 2dsphere index annotation |
| 4 | Listing submission, approval, rejection, suspension | ✅ DONE | Service + controller admin endpoints |
| 5 | Enforce owner ownership | ✅ DONE | `getByIdAndOwner()` in service |
| 6 | MongoDB indexes | ✅ DONE | `@GeoSpatialIndexed`, `@Indexed` annotations |
| 7 | Phase 3 tests | 🔲 NOT_STARTED | |

---

## Phase 4 — Road-distance search

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | MongoDB geospatial candidate search with 2dsphere | ✅ DONE | `SearchService.search()` |
| 2 | Configure the OSRM base URL | ✅ DONE | `AppProperties.Osrm` |
| 3 | Candidate-to-route distance calculation | ✅ DONE | `OsrmService.getRoute()` |
| 4 | Enforce driver search distance & owner plan radius | ✅ DONE | Implemented in `SearchService` |
| 5 | Filters, sorting, and pagination | ✅ DONE | `SearchService` |
| 6 | Handle routing failures | ✅ DONE | Ignored unrouteable lots |
| 7 | Phase 4 tests | 🔲 NOT_STARTED | |

---

## Phase 5 — Slots and Availability

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Slot document, DTOs, enums | ✅ DONE | `ParkingSlot`, `SlotStatus`, `ParkingSlotRequest`, `ParkingSlotResponse`, `SlotStatusUpdateRequest`, `SlotAvailabilitySummary` |
| 2 | Slot creation and management | ✅ DONE | `ParkingSlotService` (create, update, delete, batch) |
| 3 | FREE/OCCUPIED/RESERVED/OUT_OF_SERVICE transitions | ✅ DONE | `updateStatus()` with validation rules |
| 4 | Owner slot updates | ✅ DONE | `ParkingSlotController` owner endpoints |
| 5 | Available-slot counts consistent with slot states | ✅ DONE | `updateLotAvailability()` syncs to ParkingLot |
| 6 | Compound unique index on {parkingLotId, slotNumber} | ✅ DONE | `@CompoundIndex` annotation on ParkingSlot |
| 7 | Public availability endpoint | ✅ DONE | `GET /api/parking/lots/public/{lotId}/availability` |

---

## Phase 6 — Concurrency-safe booking

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Define booking statuses and permitted transitions | ✅ DONE | `BookingStatus` enum |
| 2 | Implement immediate/session booking first | ✅ DONE | `BookingService.createBooking()` |
| 3 | Atomically reserve a slot only if it is still free | ✅ DONE | Checked and set in `reserveSlot()` |
| 4 | Price snapshot, cancellation, extension, expiry | ✅ DONE | Implemented in `BookingService` |
| 5 | Phase 6 tests | 🔲 NOT_STARTED | |

---

## Phase 7 — WebSocket live updates

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Configure Spring WebSocket/STOMP and SockJS | ✅ DONE | `WebSocketConfig` |
| 2 | Authenticate connections and authorize private destinations | ✅ DONE | `WebSocketAuthInterceptor` |
| 3 | Publish slot and booking events only after database commit | ✅ DONE | `ParkingEventPublisher` integrated |
| 4 | Subscribe the frontend to relevant events | 🔲 NOT_STARTED | Frontend pending |

---

## Phase 8 — Subscription plans

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Seed configurable 1 km to 5 km plans | ✅ DONE | `SubscriptionService.seedPlans()` |
| 2 | Implement subscription status and expiry | ✅ DONE | `SubscriptionService.expire()` |
| 3 | Admin-managed activation, change, suspension | ✅ DONE | `SubscriptionController` admin endpoints |
| 4 | Enforce visibility limits on the backend using OSRM | ✅ DONE | `SearchService` checks `getActiveRadiusKm()` |

---

## Phase 9 — Driver, owner, and admin experience

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | Add favourites | ✅ DONE | `FavouriteService` |
| 2 | Complete admin moderation and plan-management views | ✅ DONE | `AdminController` |
| 3 | Frontend React scaffolding | 🔲 NOT_STARTED | Frontend pending |

---

## Known Blockers

1. **Java 21 not installed** — `JAVA_HOME` not set, no JDK found. Need `sudo apt install openjdk-21-jdk`.
2. **MongoDB must be running** for backend startup and integration tests.
3. **Frontend not yet scaffolded** (React/Vite setup pending — Phase 1).

## Next Steps

1. Scaffold React frontend with Vite (Phase 0/1).
2. Install Java 21: `sudo apt install openjdk-21-jdk`
3. Start MongoDB and verify backend compiles + starts.
4. Write and run tests for implemented phases.
