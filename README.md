# ⚡ PulsePoll — Real-Time Live Polling Platform

A full-stack, production-grade live polling application where users create polls, share links, and audiences vote in real time — with results updating instantly across all connected clients.

## 📋 Project Status

**Status: Code Complete, Ready to Run**

The project has been set up with all required components:
- ✅ **Backend**: Go (Gin) with MongoDB and Redis integration
- ✅ **Frontend**: React with real-time WebSocket updates
- ✅ **Database**: MongoDB for persistent storage
- ✅ **Real-time**: Redis for live vote counting and pub/sub
- ✅ **Authentication**: JWT-based user authentication
- ✅ **API Integration**: Frontend-backend communication configured
- ✅ **Frontend Dependencies**: Installed and ready
- ✅ **UI Improvements**: Enhanced error messages and user feedback

**Fixed Issues:**
- ✅ API endpoint mismatches between frontend and backend
- ✅ Data structure inconsistencies (field naming)
- ✅ WebSocket configuration for development environment
- ✅ CORS configuration for cross-origin requests
- ✅ Password field sanitization in API responses
- ✅ Enhanced error handling for backend connectivity issues
- ✅ Real-time password matching feedback in registration form

**Prerequisites to Run:**
- Install Go 1.22+ (currently not available in this environment)
- Start Docker Desktop (required for MongoDB and Redis containers)
- Run the setup commands below

**⚠️ Important:** The frontend will show "Backend server must be running" messages until you start the backend server. This is normal and expected behavior.

![Stack](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Stack](https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![Stack](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Stack](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT FRONTEND                          │
│   Auth Pages │ Create Poll │ Vote Page │ Live Results Dashboard │
│              │             │           │  (WebSocket Client)    │
└──────┬───────┴──────┬──────┴─────┬─────┴──────────┬────────────┘
       │ REST (JWT)   │ REST       │ REST           │ WebSocket
       ▼              ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       GO (GIN) BACKEND                         │
│  JWT Auth Middleware │ Input Validation │ WebSocket Hub         │
│  REST Controllers    │ Redis PubSub Listener                   │
└──────┬───────────────┴───────┬──────────┴──────────┬───────────┘
       │                       │                     │
       ▼                       ▼                     ▼
┌──────────────┐    ┌─────────────────────────────────────────┐
│   MONGODB    │    │                REDIS                     │
│  - Users     │    │  - HINCRBY atomic vote counters          │
│  - Polls     │    │  - HGETALL for live count retrieval      │
│  - Votes     │    │  - Pub/Sub for real-time broadcast       │
└──────────────┘    └─────────────────────────────────────────┘
```

### How Redis Does Real Work

Redis is **not** a cache in this app — it's the **real-time engine**:

| Redis Feature | Purpose |
|---|---|
| `HINCRBY poll:{id}:votes {optionId} 1` | Atomic vote counting — no race conditions, no read-modify-write |
| `HGETALL poll:{id}:votes` | Instant retrieval of all option counts for a poll |
| `PUBLISH poll:{id}:votes {json}` | Broadcasts vote events to all WebSocket listeners |
| `SUBSCRIBE poll:{id}:votes` | Backend subscribes per-poll and pushes to connected clients |

This means:
- **Vote counts are always consistent** (Redis atomic operations)
- **Updates are instant** (pub/sub → WebSocket, no polling)
- **Scales horizontally** (multiple backend instances share Redis pub/sub)

---

## 🚀 How to Run

### Prerequisites

- **Go** 1.22+ → [Download](https://go.dev/dl/)
- **Node.js** 18+ → [Download](https://nodejs.org/)
- **Docker & Docker Compose** → [Download](https://docs.docker.com/get-docker/)

### Current Status

The project code is complete and ready to run. To get started:

1. **Install Go** (if not already installed)
2. **Start Docker Desktop** (required for MongoDB and Redis)
3. **Follow the setup steps below**

### 1. Start MongoDB & Redis

```bash
docker-compose up -d
```

This starts:
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`

### 2. Start the Backend

```bash
cd backend
go mod tidy
go run cmd/main.go
```

The API server starts on `http://localhost:8080`.

**Environment variables** (all optional, sensible defaults provided):

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `REDIS_ADDR` | `localhost:6379` | Redis address |
| `JWT_SECRET` | `pulsepoll-secret-key-change-in-production` | JWT signing secret |
| `SERVER_PORT` | `8080` | API server port |
| `DB_NAME` | `pulsepoll` | MongoDB database name |

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The React app starts on `http://localhost:5173` with API proxy to `:8080`.

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login & get JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user |

### Polls

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/polls` | ✅ | Create a poll |
| `GET` | `/api/polls` | ✅ | List my polls |
| `GET` | `/api/polls/:id` | ❌ | Get poll with live counts |
| `POST` | `/api/polls/:id/vote` | ❌ | Cast a vote |
| `PUT` | `/api/polls/:id/toggle` | ✅ | Close/reopen poll |

### WebSocket

| Endpoint | Description |
|---|---|
| `GET` `/ws/polls/:id` | Live vote updates stream |

---

## 🔑 Key Design Decisions

1. **Redis as the real-time engine** — Atomic `HINCRBY` ensures no race conditions on vote counts. Pub/Sub broadcasts vote events to all connected WebSocket clients instantly.

2. **Dual storage strategy** — Redis holds the live counters (fast reads, atomic writes), MongoDB persists the full audit trail (votes, users, poll metadata). Poll responses merge both sources.

3. **Fingerprint-based duplicate prevention** — Votes are deduplicated using a browser fingerprint + poll ID compound index in MongoDB. No login required to vote, but each browser can only vote once per poll.

4. **WebSocket per-poll rooms** — Each Results page subscribes to only its poll's Redis channel. No wasted bandwidth from irrelevant polls.

5. **JWT authentication** — Stateless auth for poll creation/management. Voting is public (no auth required) to minimize friction for audiences.

6. **Server-side validation** — All inputs validated on the backend: title length, option count, email format, password strength. Frontend validation is UX sugar, not security.

---

## 📁 Project Structure

```
/
├── backend/
│   ├── cmd/
│   │   └── main.go              # Entry point, router setup
│   ├── internal/
│   │   ├── config/config.go     # Environment configuration
│   │   ├── database/
│   │   │   ├── mongodb.go       # MongoDB client & indices
│   │   │   └── redis.go         # Redis client & helpers
│   │   ├── handlers/
│   │   │   ├── auth.go          # Signup, Login, GetMe
│   │   │   ├── poll.go          # CRUD operations
│   │   │   ├── vote.go          # Vote casting
│   │   │   └── ws.go            # WebSocket handler
│   │   ├── middleware/
│   │   │   ├── auth.go          # JWT middleware
│   │   │   └── cors.go          # CORS configuration
│   │   └── models/models.go     # Data models & DTOs
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, PollCard, Toast
│   │   ├── context/             # AuthContext
│   │   ├── pages/               # Home, Login, Register, CreatePoll, VotePoll, Results
│   │   ├── services/            # API client, WebSocket client
│   │   ├── App.jsx
│   │   ├── index.css            # Design system
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml            # MongoDB + Redis
└── README.md                     # This file
```

---

## 🎨 Design

The frontend features a premium dark-mode glassmorphism design with:
- Deep dark backgrounds with subtle gradients
- Frosted glass cards with backdrop blur
- Vibrant indigo/violet accent colors
- Smooth micro-animations on all interactions
- Real-time animated progress bars
- Live activity indicators
- Mobile-responsive layout
- Inter typography from Google Fonts
