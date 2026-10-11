# Smart Parking Finder

A web application where drivers can discover parking using actual driving-route distance, view owner-reported availability, and reserve parking slots safely. Parking owners manage facilities and slots, while administrators moderate listings and manage visibility plans.

## Tech Stack

### Backend
- **Java 21** + **Spring Boot 3.4.x**
- Spring Web, Spring Security, Spring Data MongoDB
- Jakarta Bean Validation, Spring WebSocket/STOMP
- Springdoc OpenAPI / Swagger UI
- Maven

### Frontend
- React (plain JavaScript, no TypeScript)
- Vite, React Router, TanStack Query
- Leaflet + OpenStreetMap

### Database & Services
- MongoDB (Atlas or local)
- OSRM for road-distance routing
- Docker / Docker Compose for local development

## Prerequisites

- Java 21
- Maven 3.9+ (or use the included Maven wrapper `./mvnw`)
- MongoDB 7.x (local or Atlas)
- Node.js 20+ and npm (for frontend)
- Docker (optional, for OSRM and MongoDB)

## Quick Start

### Backend

```bash
cd backend

# Using Maven wrapper
./mvnw spring-boot:run

# Or with Maven installed
mvn spring-boot:run
```

The backend starts on `http://localhost:8080`.

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/smart_parking` | MongoDB connection string |
| `SERVER_PORT` | `8080` | Backend server port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Frontend URL for CORS |
| `OSRM_BASE_URL` | `http://localhost:5000` | OSRM routing engine URL |

### API Documentation

Once the backend is running, access Swagger UI at:
- http://localhost:8080/swagger-ui.html
- http://localhost:8080/api-docs

## Project Structure

```
├── backend/               # Spring Boot backend
│   ├── src/main/java/com/example/smartparking/
│   │   ├── config/        # App, Web, MongoDB, properties config
│   │   ├── security/      # Spring Security, UserPrincipal
│   │   ├── common/        # Shared exceptions, responses, validation
│   │   ├── auth/          # Authentication controller & DTOs
│   │   ├── user/          # User model & repository
│   │   ├── parking/       # Parking lot & slot management
│   │   ├── search/        # Geospatial search & OSRM routing
│   │   ├── booking/       # Booking management
│   │   ├── subscription/  # Visibility plan subscriptions
│   │   ├── realtime/      # WebSocket/STOMP events
│   │   ├── favourite/     # Driver favourites
│   │   ├── admin/         # Admin moderation
│   │   ├── notification/  # Notifications
│   │   └── audit/         # Audit logging
│   └── src/main/resources/
│       └── application.yml
├── frontend/              # React frontend (Vite)
├── docs/                  # Documentation
└── .env.example           # Environment template
```

## Development Phases

See [docs/progress.md](docs/progress.md) for current development status.

## License

This project is for educational purposes.
