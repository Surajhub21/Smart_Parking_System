# Smart Parking Finder — Master Project Plan

**Purpose:** A single, AI-friendly source of truth for planning, building, testing, and tracking the Smart Parking Finder project from an empty or existing repository to a working MVP, followed by optional future enhancements.

**Plan status:** Proposed master plan. Repository inspection is required before marking any implementation task complete.

---

## 1. Project Vision

Build a web application where drivers can discover parking using actual driving-route distance, view owner-reported availability, and reserve a parking slot safely. Parking owners manage facilities and slots, while administrators moderate listings and manage visibility plans.

The application must remain useful without machine-learning predictions. Availability must not be presented as sensor-verified unless a real sensor system is integrated.

### Core product principles

- Road distance, not straight-line distance, determines final search eligibility.
- Individual slot records are the source of truth for slot status and reservations.
- The backend is authoritative for authorization, availability, bookings, prices, and subscription eligibility.
- Do not fabricate map results, availability, payment success, or ML predictions.
- Use free/open-source software and services within their usage terms for the MVP.
- Build a modular monolith first; do not introduce microservices or complex infrastructure for the MVP.
- Complete and test one vertical slice at a time.
- Do not mark a task complete unless its acceptance criteria have been verified.

---

## 2. Agreed Technology Stack

### Backend

- Java 21
- Spring Boot 3.x, using a stable compatible release
- Maven
- Spring Web / Spring MVC
- Spring Security
- Spring Data MongoDB
- Jakarta Bean Validation
- Spring Boot Actuator
- Spring WebSocket with STOMP
- Springdoc OpenAPI / Swagger UI
- JUnit 5 and Mockito
- Testcontainers where practical

### Frontend

- React with plain JavaScript only
- Vite
- React Router
- TanStack Query for server state
- React Hook Form for forms
- Leaflet and React Leaflet
- Browser Geolocation API
- STOMP client and SockJS where appropriate
- A consistent UI system, such as Tailwind CSS or a suitable component library

**JavaScript restriction:** Do not use TypeScript. Use `.js` and `.jsx`, not `.ts` or `.tsx`.

### Database and mapping

- MongoDB Atlas or local MongoDB
- GeoJSON `Point` and a `2dsphere` index
- Leaflet with OpenStreetMap-compatible map tiles and required attribution
- OSRM for road-distance and route calculations
- Prefer self-hosted OSRM for predictable, controlled usage
- Compliant free geocoding only when available; manual map-pin placement must always work
- Docker and Docker Compose for local development
- GitHub for source control

### Free-resource requirement

- Do not require Google Maps paid APIs or a paid payment gateway for the MVP.
- Free/open-source software does not guarantee free hosting or unlimited access to public services.
- Public map tiles, geocoding services, and OSRM demo endpoints have usage limits and are not guaranteed production infrastructure.
- Self-hosted OSRM requires disk, RAM, CPU, map data, and a machine.
- Keep secrets out of source control and provide `.env.example` files with placeholders only.
- Document all external-service limits and required configuration.

---

## 3. Essential Project Features

### 3.1 Driver features

- Browse eligible parking facilities on an interactive map and in a results list.
- Use device/browser location after an explicit user action.
- Search for a place/address where a compliant free geocoding service is configured.
- Choose a location manually on the map if geolocation or geocoding is unavailable.
- Search by selected road-distance limit and sort results by road distance.
- View parking name, address, road distance, route duration where available, operating hours, vehicle types, amenities, price, capacity, and reported available slots.
- Filter by availability, vehicle type, price, amenities, opening hours, and distance.
- Open directions or a route preview.
- Register/login for bookings.
- View booking history, cancel eligible bookings, and extend bookings when policy and availability allow it.
- Save favourite parking locations as a supporting feature.
- Receive live slot and booking changes when WebSocket functionality is implemented.
- Never present owner-reported availability as a guarantee.

### 3.2 Parking-owner features

- Register/login and manage an owner profile.
- Create, edit, deactivate, and submit parking listings for approval.
- Choose a parking entrance/location by address search when available, map click, or draggable marker.
- Manage parking details, capacity, individual slots, supported vehicle types, amenities, opening hours, and prices.
- Update slot status and reported availability.
- View listing approval and subscription status.
- View bookings and perform permitted booking actions.
- View basic booking/revenue summaries when those features are implemented.

### 3.3 Admin features

- Approve or reject submitted parking listings.
- Suspend or reactivate users, owners, and listings.
- Manage subscription plan definitions and configurable prices.
- Activate, change, suspend, or expire subscriptions manually in the free MVP.
- Review bookings, subscriptions, and audit logs.
- View basic usage and booking reports when implemented.

### 3.4 Road-distance search

The final distance filter must use a driving route calculated by OSRM, not a straight-line distance.

Use a two-stage approach:

1. Use MongoDB's `2dsphere` index to shortlist candidates within a configurable straight-line buffer.
2. Calculate actual driving-route distance from the driver's search point to each candidate parking entrance using OSRM.
3. Keep only valid route results within both the driver's selected road-distance limit and the owner's active subscription visibility limit.
4. Apply listing status, opening-hours, availability, and other selected filters.
5. Sort by road distance ascending and paginate results.
6. If a route cannot be calculated, do not silently substitute straight-line distance. Mark it unverified or omit it from strict road-distance results and show a useful message.

The straight-line shortlist is only a performance optimization. It must never be treated as the final road-distance eligibility check.

### 3.5 Owner subscription visibility plans

Support configurable visibility plans for 1 km, 2 km, 3 km, 4 km, and 5 km.

A listing is eligible for public search only when all relevant conditions hold:

1. It is approved and active.
2. The owner has a valid active subscription, unless an explicitly configured free/trial plan applies.
3. Actual OSRM road distance is within the owner's plan limit.
4. Actual OSRM road distance is within the driver's selected search limit.
5. The listing passes availability and other selected filters.

Equivalent rule:

`eligibleRoadDistanceKm <= min(driverSearchLimitKm, ownerPlanRadiusKm)`

The subscription radius is an eligibility boundary, not a ranking guarantee. Results are sorted by road distance by default.

### 3.6 Parking slots and availability

Use individual parking slot documents as the source of truth for reservations and slot states.

Supported slot states:

- `FREE`
- `OCCUPIED`
- `RESERVED`
- `OUT_OF_SERVICE`

Owners manually report occupancy and slot availability in the MVP. Do not claim automatic vehicle detection.

Available counts should be calculated from slot states or maintained with a documented, consistent strategy. Mark old availability reports as stale.

### 3.7 Safe booking

- Drivers can reserve an eligible slot for a defined parking session.
- Start with immediate/session booking. Scheduled future reservations are not considered supported until interval-overlap handling and concurrency tests pass.
- A slot cannot have conflicting confirmed/active bookings.
- A booking must reference a real slot belonging to the selected parking lot.
- Validate time ranges, vehicle compatibility, operating rules, permissions, and price on the backend.
- Store a price snapshot with the booking.
- Prevent double booking through atomic conditional slot updates and transactions where required.
- Never use a naïve read-check-save sequence without atomic protection.
- Return `409 Conflict` when a slot is no longer available.
- Implement booking history, cancellation, expiry, and permitted extension rules.
- Ensure cancellation/expiry updates slot state consistently.
- Make retry-sensitive state changes idempotent.
- Drivers pay parking fees directly to owners. The MVP does not collect parking fees or process parking-fee refunds.

### 3.8 Real-time updates

Use WebSocket/STOMP after the REST booking and availability flows are correct.

Suggested events:

- `SLOT_STATUS_CHANGED`
- `BOOKING_CONFIRMED`
- `BOOKING_CANCELLED`
- `BOOKING_EXTENDED`
- `AVAILABILITY_UPDATED`

Rules:

- Publish events only after successful database commit.
- Authenticate WebSocket connections and authorize private destinations.
- Do not broadcast private user or booking information to unauthorized clients.
- Reconnect safely and refresh REST state after reconnecting.
- REST remains the source of truth.

### 3.9 Machine-learning availability prediction — later phase

The prediction target is the estimated number of free spaces 30 minutes from the current observation.

- Collect real, timestamped occupancy observations.
- Use Python, pandas, and scikit-learn.
- Start with a simple baseline: future free spaces equal current free spaces.
- Compare a Decision Tree Regressor against the baseline.
- Use time-based train/test separation; do not randomly mix future observations into past training data.
- Evaluate using mean absolute error (MAE), measured in parking spaces.
- Keep predicted values within zero and total capacity.
- Display reported availability and prediction separately, with timestamps.
- Do not display expired predictions as fresh.
- If history is insufficient, show that prediction is unavailable.
- Synthetic data may demonstrate the pipeline only when clearly labelled; it does not prove real-world accuracy.
- ML must not block the core parking search and booking features.

---

## 4. Architecture and Data Rules

### 4.1 Architecture

Use a modular monolith:

- One Spring Boot backend
- One React JavaScript frontend
- One MongoDB database
- OSRM routing integration
- Optional Python ML pipeline in a later phase

Do not introduce microservices, Kafka, Kubernetes, or a separate ML API in the MVP without an explicit scope change.

Keep controllers thin. Put business rules in services. Use repositories for standard data access and `MongoTemplate` for geospatial or advanced atomic operations. Use request/response DTOs instead of exposing MongoDB documents directly.

### 4.2 Suggested backend packages

```text
com.example.smartparking
├── config
├── security
├── common
│   ├── exception
│   ├── response
│   └── validation
├── auth
├── user
├── parking
│   ├── lot
│   └── slot
├── search
├── booking
├── subscription
├── realtime
├── favourite
├── admin
├── notification
└── audit
```

Payment-provider integration is out of MVP scope; keep it as a documented future extension.

### 4.3 MongoDB collections

Recommended core collections:

- `users`
- `parking_lots`
- `parking_slots`
- `bookings`
- `plans`
- `subscriptions`
- `favourites`
- `audit_logs`

Add a `payments` collection only if subscription payment integration is later approved and implemented.

Important data rules:

- Normalize emails and enforce uniqueness.
- Hash passwords; never store plaintext passwords.
- Store timestamps consistently, preferably UTC.
- Store currency explicitly, INR by default.
- Store parking location as GeoJSON: `[longitude, latitude]`, not `[latitude, longitude]`.
- Validate latitude in `[-90, 90]` and longitude in `[-180, 180]`.
- Create and test a `2dsphere` index on parking location.
- Use a unique compound index on `{ parkingLotId, slotNumber }`.
- Use a unique index on user email, plan code, booking reference, and `{ userId, parkingLotId }` for favourites.
- Add other indexes only for demonstrated query patterns and document their purpose.

### 4.4 Security rules

Roles:

- `DRIVER`
- `OWNER`
- `ADMIN`

Rules:

- Public users may search only eligible public listings.
- Drivers may manage only their own profile, favourites, and bookings.
- Owners may manage only their own listings, slots, bookings, and subscriptions.
- Admin endpoints require `ADMIN`.
- Backend authorization is mandatory; frontend route protection is only a usability feature.
- Never trust client-provided owner IDs, roles, prices, plan radii, subscription status, or booking status.
- Use BCrypt or Argon2 for password hashing.
- Add input validation, safe CORS, authentication protections, and HTTPS in deployed environments.
- Use safe error responses without stack traces or secrets.
- Email verification and password reset are optional and must not block core functionality.

---

## 5. Proposed Development Phases

**Progress rule:** All tasks begin as unchecked until verified against the actual repository. A phase is complete only when its acceptance criteria pass and its documentation is updated.

### Phase 0 — Project foundation

Tasks:
- [ ] Inspect the existing repository and current files.
- [ ] Create `/backend`, `/frontend`, and `/docs` if needed.
- [ ] Configure Java 21, Spring Boot, Maven, and required dependencies.
- [ ] Configure React JavaScript with Vite.
- [ ] Configure MongoDB connection.
- [ ] Add environment templates and `.gitignore`.
- [ ] Create a starter README.
- [ ] Confirm backend and frontend both start.

Acceptance criteria:
- Backend builds and starts.
- Frontend builds and starts.
- MongoDB connectivity is verified.
- No secrets are committed.

### Phase 1 — Free map and location proof of concept

Tasks:
- [ ] Integrate Leaflet and an OpenStreetMap-compatible tile source with attribution.
- [ ] Render a map and marker.
- [ ] Implement map click and draggable marker selection.
- [ ] Add a current-location button.
- [ ] Handle denied permission, timeout, unsupported browser, and tile errors.
- [ ] Add optional low-volume compliant geocoding only if configured.
- [ ] Keep manual map-pin selection available without geocoding.
- [ ] Verify coordinate ordering.

Acceptance criteria:
- Map renders with required attribution.
- Users can select a location manually.
- Geolocation failure does not block manual selection.
- Coordinates are correctly represented as latitude and longitude in the UI and longitude/latitude in GeoJSON storage.

### Phase 2 — Authentication and roles

Tasks:
- [ ] Implement registration, login, logout, and profile retrieval.
- [ ] Hash passwords securely.
- [ ] Normalize email and enforce uniqueness.
- [ ] Implement `DRIVER`, `OWNER`, and `ADMIN` roles.
- [ ] Add authorization rules for protected endpoints.
- [ ] Add authentication, authorization, and invalid-input tests.

Acceptance criteria:
- Valid users can authenticate.
- Invalid credentials are rejected safely.
- Duplicate accounts are rejected.
- Unauthorized users cannot access protected resources.

### Phase 3 — Parking listing management

Tasks:
- [ ] Define parking lot documents, DTOs, enums, and validation.
- [ ] Implement owner create/read/update/deactivate operations.
- [ ] Implement entrance-location selection in the owner UI.
- [ ] Store GeoJSON correctly.
- [ ] Implement listing submission, approval, rejection, and suspension.
- [ ] Enforce owner ownership on every listing operation.
- [ ] Create and test required MongoDB indexes.

Acceptance criteria:
- Owners can manage only their own listings.
- Invalid locations and capacities are rejected.
- Unapproved, inactive, or suspended listings are not publicly discoverable.

### Phase 4 — Road-distance search

Tasks:
- [ ] Implement MongoDB geospatial candidate search with `2dsphere`.
- [ ] Configure the OSRM base URL.
- [ ] Implement candidate-to-route distance calculation.
- [ ] Enforce driver search distance and owner plan radius using road distance.
- [ ] Add filters, sorting, and pagination.
- [ ] Connect map markers and results list to the backend.
- [ ] Handle routing failures and empty results explicitly.
- [ ] Add road-distance acceptance tests.

Acceptance criteria:
- Results are sorted by actual road distance.
- A parking lot that is close in a straight line but too far by road is excluded.
- Listings beyond either applicable distance limit are excluded.
- Routing failure never silently becomes a straight-line match.
- The UI shows a useful message when no valid result exists.

### Phase 5 — Slots and availability

Tasks:
- [ ] Implement slot creation and management.
- [ ] Implement `FREE`, `OCCUPIED`, `RESERVED`, and `OUT_OF_SERVICE` transitions.
- [ ] Add owner slot updates.
- [ ] Keep available-slot counts consistent with slot states.
- [ ] Store timestamped occupancy observations.
- [ ] Display last-updated time and stale availability state.
- [ ] Start collecting real observations during pilot use.

Acceptance criteria:
- Owners can update permitted slot states.
- Invalid transitions or counts are rejected.
- Displayed counts match slot state data.
- Old reports are clearly marked stale.
- Availability is labelled owner-reported, not sensor-verified.

### Phase 6 — Concurrency-safe booking

Tasks:
- [ ] Define booking statuses and permitted transitions.
- [ ] Implement immediate/session booking first.
- [ ] Atomically reserve a slot only if it is still free.
- [ ] Use a MongoDB transaction where multiple writes must succeed or fail together.
- [ ] Configure a replica-set-capable MongoDB environment for transaction tests if needed.
- [ ] Validate slot ownership by parking lot, vehicle compatibility, time range, operating rules, and price.
- [ ] Store a backend-calculated price snapshot.
- [ ] Implement booking history.
- [ ] Implement cancellation and expiry.
- [ ] Implement extension only with a conflict check.
- [ ] Return `409 Conflict` for competing reservations.
- [ ] Add simultaneous-request tests.

Acceptance criteria:
- Two concurrent attempts to reserve the same free slot produce at most one successful booking.
- Booking and slot states remain consistent after success, failure, cancellation, and expiry.
- A user cannot access another user's booking by changing an ID.
- No known double-booking defect remains.
- Scheduled future reservations are not advertised unless overlap protection is implemented and tested.

### Phase 7 — WebSocket live updates

Tasks:
- [ ] Configure Spring WebSocket/STOMP and SockJS where appropriate.
- [ ] Authenticate connections and authorize private destinations.
- [ ] Publish slot and booking events only after successful database commit.
- [ ] Subscribe the frontend to relevant events.
- [ ] Handle disconnects and reconnections.
- [ ] Refresh REST state after reconnecting.
- [ ] Test event authorization and publication timing.

Acceptance criteria:
- Successful slot and booking changes appear in connected clients.
- Failed database operations do not publish success events.
- Private booking information is not broadcast to unauthorized users.
- Reconnected clients recover current state from REST.

### Phase 8 — Subscription plans

Tasks:
- [ ] Seed configurable 1 km to 5 km plans.
- [ ] Implement subscription status and expiry.
- [ ] Implement admin-managed activation, change, suspension, and expiry.
- [ ] Build owner subscription dashboard.
- [ ] Enforce visibility limits on the backend using OSRM road distance.
- [ ] Prevent browser-supplied radius or subscription status from affecting eligibility.
- [ ] Add audit logs for subscription changes.
- [ ] Test active, expired, suspended, and free/trial plan cases.

Acceptance criteria:
- The server enforces each active plan's visibility limit.
- Expired subscriptions make listings ineligible unless an explicit free/trial plan applies.
- Subscription changes are auditable.
- The UI accurately labels manual/admin-managed activation.

### Phase 9 — Driver, owner, and admin experience

Tasks:
- [ ] Complete driver search, parking details, and directions.
- [ ] Add availability, vehicle, price, amenities, and opening-hours filters.
- [ ] Add favourites.
- [ ] Complete owner listing, slot, and booking dashboards.
- [ ] Complete admin moderation and plan-management views.
- [ ] Add basic booking and usage reports where supported.
- [ ] Improve notifications and empty/error/loading states.
- [ ] Improve mobile responsiveness, accessibility, labels, contrast, and keyboard navigation.
- [ ] Add email verification or password reset only if configured.

Acceptance criteria:
- Driver, owner, and admin flows are usable end-to-end.
- UI state reflects backend permissions and actual data.
- Forms provide clear validation feedback.
- Desktop and mobile layouts are usable.

### Phase 10 — Testing, hardening, and deployment

Tasks:
- [ ] Complete backend unit and integration tests.
- [ ] Complete relevant frontend tests.
- [ ] Test geospatial indexes and road-distance eligibility.
- [ ] Test security, authorization, and booking concurrency.
- [ ] Test WebSocket event publication and reconnection.
- [ ] Add health checks and safe logging.
- [ ] Add formatting/linting and CI within available free usage limits.
- [ ] Complete API documentation.
- [ ] Configure environment variables and production-safe CORS/HTTPS if deploying.
- [ ] Deploy only where free resources and provider terms permit.
- [ ] Write smoke-test and rollback instructions.
- [ ] Prepare a repeatable demo and known-limitations list.

Acceptance criteria:
- Required tests and builds pass.
- Setup and run instructions work from a clean environment.
- No secrets are committed.
- External-service limits and deployment requirements are documented.
- The complete core flow can be demonstrated repeatedly.

### Phase 11 — Machine-learning prediction

Start only when sufficient legitimate occupancy history exists. Continue core application development without waiting for ML.

Tasks:
- [ ] Inspect and validate collected occupancy data.
- [ ] Prepare timestamped training rows with future observed free-space counts.
- [ ] Create the baseline predictor.
- [ ] Train a Decision Tree Regressor.
- [ ] Split training and test data by time.
- [ ] Evaluate MAE and compare it against the baseline.
- [ ] Save the model or generated predictions using a documented method.
- [ ] Display timestamped 30-minute predictions separately from reported availability.
- [ ] Handle insufficient data and expired predictions.
- [ ] Document limitations and measured results honestly.

Acceptance criteria:
- No future information leaks into model inputs.
- Model evaluation uses later observations as test data.
- Results are compared with the baseline.
- Predictions are constrained to valid capacity.
- The core application continues to work when predictions are unavailable.

### Phase 12 — Optional future enhancements

Consider only after the core system is stable:

- [ ] Evaluate transparent demand-based dynamic pricing.
- [ ] Explore IoT occupancy sensors when hardware/data is available.
- [ ] Evaluate CCTV/AI occupancy detection after privacy and legal review.
- [ ] Consider subscription payment integration with explicit approval.
- [ ] Consider driver digital wallet only with an approved payment and refund design.
- [ ] Explore EV charging reservations.
- [ ] Explore Android/mobile applications.
- [ ] Add multilingual support and advanced accessibility.
- [ ] Explore advanced analytics and smart-city integrations.
- [ ] Reassess microservices, Kafka, or Kubernetes only if justified by real requirements.

These are future enhancements, not MVP completion requirements.

---

## 6. Essential Acceptance Tests

The following scenarios must be covered before declaring the relevant features complete:

- [ ] A route within both the driver limit and owner plan limit is eligible.
- [ ] A route outside either limit is excluded.
- [ ] A straight-line-near but road-distance-far location is excluded.
- [ ] An unavailable route does not produce a false road-distance claim.
- [ ] Denied geolocation still permits manual location selection.
- [ ] Unapproved, inactive, suspended, and ineligible listings are excluded from public search.
- [ ] GeoJSON uses `[longitude, latitude]`.
- [ ] An owner cannot modify another owner's parking facility.
- [ ] Invalid slot transitions and capacity values are rejected.
- [ ] Two simultaneous attempts to reserve the same currently free slot result in at most one successful booking.
- [ ] Booking cancellation/expiry updates slot state consistently.
- [ ] Unauthorized users cannot view or change another user's booking.
- [ ] A WebSocket reconnect does not leave the frontend permanently stale.
- [ ] Subscription expiry is enforced on the backend.
- [ ] Forged browser claims about plan radius or subscription state have no effect.
- [ ] Missing ML data does not break parking search or booking.
- [ ] Expired predictions are not presented as current.
- [ ] ML is evaluated against the baseline before results are presented as useful.

---

## 7. Progress Tracking Rules

Track progress at the task level, not by vague estimates.

For every task, use one of these statuses:

- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `DONE`

Optional fields:

- **Owner:** person or agent responsible
- **Started:** date work began
- **Completed:** date acceptance criteria passed
- **Evidence:** test name, command output, commit, screenshot, or API result
- **Blocker:** specific reason progress cannot continue
- **Notes:** implementation details or known limitations

### Completion calculation

`Task completion % = DONE tasks / total scoped tasks × 100`

`Phase completion % = DONE tasks in phase / total tasks in phase × 100`

`Overall MVP completion % = DONE tasks in MVP phases 0–10 / total scoped tasks in MVP phases 0–10 × 100`

Keep Phase 11 (ML) and Phase 12 (optional enhancements) separate from core MVP completion. A fully working core application must not appear incomplete just because optional future work has not been implemented.

Do not count unchecked tasks as completed. Do not mark a task done merely because code was generated; verify it against the acceptance criteria.

### Recommended task record

```text
Task:
Status: NOT_STARTED | IN_PROGRESS | BLOCKED | DONE
Phase:
Dependencies:
Acceptance criteria:
Evidence:
Blocker:
Notes:
```

At the end of each phase, record:

1. Tasks completed.
2. Tasks remaining.
3. Tests/builds run and their results.
4. Known bugs and blockers.
5. Files/modules changed.
6. Next tasks to execute.
7. Updated progress percentage.

---

## 8. Documentation Deliverables

Maintain these documents as the project evolves:

- `README.md` — overview, features, setup, environment variables, run commands, tests, deployment, and limitations.
- `docs/architecture.md` — architecture and module responsibilities.
- `docs/data-model.md` — MongoDB documents and indexes.
- `docs/geospatial-search.md` — GeoJSON, `2dsphere`, OSRM routing, and distance rules.
- `docs/subscription-radius-rules.md` — owner visibility rules and examples.
- `docs/booking-concurrency.md` — atomic updates, transactions, state transitions, and tests.
- `docs/api.md` or generated OpenAPI documentation.
- `docs/testing.md` — test strategy and commands.
- `docs/deployment.md` — configuration, deployment requirements, and smoke tests.
- `docs/progress.md` — current phase, task status, completed evidence, blockers, and next actions.

The master plan should remain the scope source of truth. Update it when a scope change is explicitly agreed upon; do not silently add new features.

---

## 9. Instructions for Any AI Coding Agent

When using this plan with an AI coding agent, follow these instructions:

1. Read this entire plan before making code changes.
2. Inspect the actual repository and report its current structure and implementation status.
3. Do not assume a feature is complete because it appears in this plan or was discussed previously.
4. Do not overwrite or restructure working code without inspecting it first.
5. Follow the specified stack, including Java 21, Spring Boot, MongoDB, React, and plain JavaScript only.
6. Do not add paid services, TypeScript, microservices, Kafka, Kubernetes, online payments, or ML to the MVP without explicit approval.
7. Implement one phase or one complete vertical slice at a time.
8. Before coding, identify the exact tasks and dependencies for the requested phase.
9. Use DTOs, backend validation, safe error handling, secure authorization, and meaningful automated tests.
10. Never fabricate API results, route distances, booking success, live availability, payment success, or ML accuracy.
11. If an external credential or service is unavailable, explain the blocker and use only an explicitly allowed development fallback.
12. Run relevant tests/builds after each meaningful change. Fix failures before proceeding.
13. Do not mark tasks `DONE` without evidence that the acceptance criteria passed.
14. Update `docs/progress.md` and the relevant documentation after each phase.
15. Report changed files, commands executed, test/build results, remaining work, blockers, and the next recommended task at the end of each session.
16. If a requirement is ambiguous but does not block implementation, use the safest reasonable default and document it. Ask the user only when a missing decision materially blocks progress.
17. Do not claim deployment, tests, integrations, or features succeeded unless they were actually verified.

### Standard end-of-session report

```text
Current phase:
Tasks completed:
Tasks in progress:
Tasks blocked:
Files changed:
Commands executed:
Tests/builds and results:
Known bugs/limitations:
Progress percentage:
Next recommended task:
```

---

## 10. Final MVP Definition of Done

The MVP is complete when all required work in Phases 0–10 has been implemented and verified, including:

- [ ] Backend and frontend build and run.
- [ ] MongoDB connection and indexes work.
- [ ] Users can authenticate with secure role-based access.
- [ ] Owners can create and manage parking facilities.
- [ ] Admins can moderate listings.
- [ ] Drivers can search using actual OSRM road distance.
- [ ] Owner subscription visibility limits are enforced on the backend.
- [ ] Owners can manage individual parking slots and reported availability.
- [ ] Booking is concurrency-safe and prevents double booking.
- [ ] Booking history, cancellation, and supported expiry/extension flows work.
- [ ] WebSocket updates reflect committed changes when connected.
- [ ] Search, booking, security, and key failure paths have automated tests.
- [ ] The UI is responsive and communicates loading, empty, error, and stale states.
- [ ] README, architecture, data model, API, testing, deployment, and progress documentation are updated.
- [ ] No secrets are committed.
- [ ] The application has a repeatable end-to-end demo.
- [ ] All known limitations are documented honestly.

ML, dynamic pricing, sensors, online payments, wallet, mobile applications, and other Phase 12 enhancements are not required to declare the core MVP complete.

---

## 11. Decisions and Assumptions to Confirm Before Production

Use these defaults during development unless the product owner explicitly changes them:

1. MongoDB is the only primary database for the MVP.
2. The frontend uses React and plain JavaScript, not TypeScript.
3. The backend is a modular monolith.
4. Public listing visibility requires an active subscription unless an explicit free/trial plan is configured.
5. Both driver search limits and owner plan limits are enforced using actual OSRM road distance.
6. Parking listings require admin approval before public display.
7. Owner-managed slot status is used; there is no sensor-verified occupancy in the MVP.
8. Immediate/session booking is implemented first; scheduled reservations require explicit overlap handling and concurrency tests.
9. Drivers pay parking fees directly to owners; the platform does not collect parking fees in the MVP.
10. Subscription activation is admin-managed in the free MVP; no real online payment gateway is required.
11. Currency defaults to INR, with configurable prices rather than invented production prices.
12. ML prediction and dynamic pricing are later phases and depend on legitimate data and evaluation.
13. Free/open-source tools and services must be used within their terms. Local development is the guaranteed controllable baseline; public endpoints and free hosting tiers may have limits.
14. Repository state must be inspected before setting task status or declaring a phase complete.

**Start here:** Inspect the repository, create or update `docs/progress.md`, identify what is already implemented, and work only on the next incomplete phase. Do not begin by implementing every feature at once.
