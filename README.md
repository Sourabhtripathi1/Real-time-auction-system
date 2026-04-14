# Auction System — Real-Time MERN Stack

A production-grade, full-stack real-time auction platform built with the **MERN stack** (MongoDB, Express, React, Node.js) and **Socket.IO** for live bidding.

---

## ✨ Features

### Core Functionality
- 🔐 **JWT Authentication** — Register, login, and protected routes with role-based access
- 🏷️ **Role-Based Dashboards** — Separate views for `admin`, `seller`, and `bidder`
- ⚡ **Real-Time Bidding** — Live bid updates pushed to all viewers via Socket.IO
- 🛡️ **Anti-Sniping** — Bids placed in the final 10 seconds automatically extend the timer
- 🔒 **Race Condition Prevention** — Atomic MongoDB `findOneAndUpdate` with optimistic concurrency guard
- 📋 **Admin Approvals** — Sellers submit auctions; admins approve/reject before they go live
- 🔍 **Auction Watchlist** — Bidders can save and track auctions
- ⏱️ **Auction Lifecycle Scheduler** — Background process activates and ends auctions automatically

### Technical Highlights
- **Atomic bid writes** — prevents double-spend with MongoDB conditional updates
- **Socket.IO rooms** — each auction has its own broadcast room (`auction_<id>`)
- **Mongoose 9** — production models with indexes, pre-hooks, and validation
- **Tailwind CSS v4** — utility-first CSS with custom `@theme` design tokens
- **Vite + React 18** — fast HMR development experience
- **ESM throughout** — native ES Modules on both frontend and backend

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| State | Context API (AuthContext, SocketContext) |
| Routing | React Router DOM v6 |
| HTTP Client | Axios (with JWT interceptors) |
| Real-Time | Socket.IO client |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose 9 |
| Real-Time | Socket.IO server |
| Auth | JSON Web Tokens (JWT) + bcryptjs |
| Dev Tools | Nodemon, Concurrently |

---

## 📁 Project Structure

```
Real-time-auction-system/
├── package.json              ← Root runner (concurrently only)
│
├── backend/
│   ├── package.json          ← Backend dependencies
│   ├── server.js             ← Express + Socket.IO + Scheduler
│   ├── seed.js               ← Database seed script
│   ├── .env                  ← Backend environment variables (git-ignored)
│   ├── .env.example          ← Environment variable template
│   ├── config/
│   │   └── db.js             ← MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── auctionController.js
│   │   ├── bidController.js
│   │   └── watchlistController.js
│   ├── middleware/
│   │   ├── authMiddleware.js  ← JWT verification
│   │   ├── roleMiddleware.js  ← RBAC guard
│   │   └── errorMiddleware.js ← Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Auction.js
│   │   ├── Bid.js
│   │   └── Watchlist.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── auctionRoutes.js
│   │   ├── bidRoutes.js
│   │   └── watchlistRoutes.js
│   ├── socket/
│   │   └── socketHandler.js  ← Room join/leave + viewer counts
│   └── utils/
│       ├── ApiError.js
│       └── ApiResponse.js
│
└── frontend/
    ├── package.json
    ├── .env                  ← Frontend environment variables (git-ignored)
    ├── .env.example          ← Environment variable template
    ├── vite.config.js
    └── src/
        ├── App.jsx           ← Router + Provider stack
        ├── main.jsx
        ├── index.css         ← Tailwind v4 + custom theme
        ├── context/
        │   ├── AuthContext.jsx   ← User/token state + localStorage
        │   └── SocketContext.jsx ← Auto-connect on auth, room helpers
        ├── hooks/
        │   ├── useCountdown.js   ← Live countdown with anti-snipe restart
        │   └── useBid.js         ← Bid placement state machine
        ├── services/
        │   ├── authApi.js        ← Axios instance + interceptors
        │   ├── auctionApi.js
        │   ├── bidApi.js
        │   └── watchlistApi.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── CountdownTimer.jsx
        │   ├── BidHistory.jsx
        │   └── Loader.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── AuctionList.jsx   ← Table with search/filter, auto-refresh
            ├── AuctionRoom.jsx   ← Full real-time auction page
            ├── Dashboard.jsx     ← Role-based: seller/admin/bidder
            └── Watchlist.jsx     ← Watchlist card grid
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **MongoDB** running locally on port `27017`
  - [Download MongoDB Community](https://www.mongodb.com/try/download/community)
  - Or use [MongoDB Atlas](https://www.mongodb.com/atlas) (update `MONGO_URI` in `.env`)

### 1. Clone the Repository

```bash
git clone https://github.com/Sourabhtripathi1/Real-time-auction-system.git
cd Real-time-auction-system
```

### 2. Install Dependencies

```bash
# Install all three (root + backend + frontend) in one shot
npm run install:all
```

Or manually:

```bash
npm install                        # root (concurrently)
cd backend && npm install          # backend
cd ../frontend && npm install      # frontend
```

### 3. Configure Environment Variables

**Backend** — copy the example and fill in your values:
```bash
cp backend/.env.example backend/.env
```

**Frontend** — copy the example:
```bash
cp frontend/.env.example frontend/.env
```

> See [Environment Variables](#-environment-variables) section for details.

### 4. Seed the Database

Populates MongoDB with 3 test users and sample auctions:

```bash
npm run seed
```

| Email | Password | Role |
|-------|----------|------|
| `admin@auction.com` | `admin123` | Admin |
| `seller@auction.com` | `seller123` | Seller |
| `bidder@auction.com` | `bidder123` | Bidder |

> ⚠️ **Warning:** Running seed clears all existing data.

### 5. Start the Application

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/health |

---

## 🔑 Environment Variables

### `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/auction-system
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

| Variable | Description |
|----------|-------------|
| `PORT` | Express server port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs — **change this in production** |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`, `24h`) |
| `CLIENT_URL` | Frontend origin for CORS |
| `NODE_ENV` | `development` or `production` |

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend REST API base URL |
| `VITE_SOCKET_URL` | Backend Socket.IO server URL |

---

## 🔌 Socket.IO Event Reference

| Event | Direction | Payload |
|-------|-----------|---------|
| `joinAuction` | Client → Server | `{ auctionId, userId }` |
| `leaveAuction` | Client → Server | `{ auctionId }` |
| `bidUpdated` | Server → Room | `{ auctionId, highestBid, highestBidder: { id, name }, timestamp }` |
| `timerExtended` | Server → Room | `{ auctionId, newEndTime }` |
| `auctionEnded` | Server → Room | `{ auctionId, winnerId, winnerName, finalBid }` |
| `userJoined` | Server → Room | `{ userId, totalViewers }` |

---

## 🛡️ API Endpoints

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login and get JWT |
| `GET` | `/api/auth/me` | Protected | Get current user |

### Auctions
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `GET` | `/api/auctions/live` | Public | List all active auctions |
| `GET` | `/api/auctions/:id` | Public | Get auction by ID |
| `POST` | `/api/auctions/create` | Seller | Create a new auction |
| `GET` | `/api/auctions/pending` | Admin | List pending auctions |
| `PATCH` | `/api/auctions/:id/approve` | Admin | Approve or reject auction |
| `GET` | `/api/auctions/mine` | Seller | Get seller's own auctions |

### Bids
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/bids/place` | Bidder | Place a bid |
| `GET` | `/api/bids/:auctionId` | Public | Get bid history |

### Watchlist
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/watchlist/add` | Bidder | Add auction to watchlist |
| `GET` | `/api/watchlist/my` | Bidder | Get user's watchlist |
| `DELETE` | `/api/watchlist/:auctionId` | Bidder | Remove from watchlist |

---

## 📜 Scripts Reference

Run from the **project root**:

```bash
npm run dev          # Start backend + frontend concurrently
npm run server       # Backend only (nodemon)
npm run client       # Frontend only (Vite)
npm run build        # Production build (frontend)
npm run seed         # Seed database with test data
npm run install:all  # Install all dependencies (root + backend + frontend)
```

Run from `backend/`:
```bash
npm run dev    # nodemon server.js
npm run start  # node server.js (production)
npm run seed   # node seed.js
```

---

## 🏗️ How It Works

### Bid Placement Flow

```
User places bid
  → POST /api/bids/place
  → Validate: auction active, user is bidder, bid > currentHighestBid + minIncrement
  → Atomic findOneAndUpdate (currentHighestBid condition prevents race conditions)
  → If bid placed in final 10s → extend endTime by 10s → emit "timerExtended"
  → Emit "bidUpdated" to auction room
  → All connected clients update UI instantly
```

### Auction Lifecycle (Scheduler)

```
Every 60 seconds:
  1. Find approved auctions with startTime <= now → set status: "active"
  2. Find active auctions with endTime <= now → set status: "ended"
     → Emit "auctionEnded" to room with winner info
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">Built with ❤️ using the MERN Stack + Socket.IO</p>
