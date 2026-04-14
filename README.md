# Real-Time Auction System — MERN Stack

A production-grade, full-stack real-time auction platform built with the **MERN stack** (MongoDB, Express, React, Node.js), **Socket.IO** for live bidding, and **Cloudinary** for cloud image management.

---

## ✨ Features

### Core Functionality
- 🔐 **JWT Authentication** — Register, login, and protected routes with role-based access
- 🏷️ **Role-Based Dashboards** — Separate views for `admin`, `seller`, and `bidder`
- ⚡ **Real-Time Bidding** — Live bid updates pushed to all viewers via Socket.IO
- 🛡️ **Anti-Sniping** — Bids placed in the final 10 seconds automatically extend the timer
- 🔒 **Race Condition Prevention** — Atomic MongoDB `findOneAndUpdate` with optimistic concurrency guard
- 📋 **Admin Approval Workflow** — Sellers submit auctions for review; admins approve/reject with mandatory rejection reasons
- 🔍 **Auction Watchlist** — Bidders can save and track auctions
- ⏱️ **Auction Lifecycle Scheduler** — Background process activates and ends auctions automatically
- ☁️ **Cloudinary Image Management** — Upload, transform, and auto-delete auction images on the cloud
- 🖼️ **Interactive Image Slider** — Custom-built carousel with touch/swipe, keyboard navigation, thumbnails, and autoplay
- 🃏 **Card Grid Layout** — Modern auction browsing with live status badges, compact countdown timers, and bid flash animations
- 🔔 **Toast Notifications** — `react-toastify` for all success, error, and warning messages
- 🌓 **Dark / Light Mode** — Full theme support across all pages

### Auction Lifecycle
```
inactive → (seller submits) → pending → (admin approves) → approved → (scheduler activates) → active → ended
                                          ↓ (admin rejects)
                                        rejected → (seller edits & resubmits) → inactive
```

### Technical Highlights
- **Atomic bid writes** — prevents double-spend with MongoDB conditional updates
- **Socket.IO rooms** — each auction has its own broadcast room (`auction_<id>`)
- **Real-time card updates** — bid changes and auction endings update individual cards without full re-fetch
- **Cloudinary integration** — `multer-storage-cloudinary` for seamless upload pipeline with auto-transforms
- **Image deletion** — old images are automatically purged from Cloudinary when auctions are updated or deleted
- **Frontend validation** — file size (5MB), count (5 max), and type (jpg/png/webp) checks before upload
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
| Notifications | react-toastify |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose 9 |
| Real-Time | Socket.IO server |
| Auth | JSON Web Tokens (JWT) + bcryptjs |
| Image Storage | Cloudinary (v2) + Multer + multer-storage-cloudinary |
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
│   ├── seed.js               ← Database seed script (uploads images to Cloudinary)
│   ├── .env                  ← Backend environment variables (git-ignored)
│   ├── .env.example          ← Environment variable template
│   ├── config/
│   │   ├── db.js             ← MongoDB connection
│   │   ├── cloudinary.js     ← Cloudinary v2 configuration + deleteFromCloudinary helper
│   │   └── multer.js         ← Multer with CloudinaryStorage (5MB, 5 files, jpg/png/webp)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── auctionController.js  ← Create/update/delete with Cloudinary upload & cleanup
│   │   ├── bidController.js
│   │   └── watchlistController.js
│   ├── middleware/
│   │   ├── authMiddleware.js  ← JWT verification
│   │   ├── roleMiddleware.js  ← RBAC guard (authorizeRoles + restrictRoles)
│   │   └── errorMiddleware.js ← Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Auction.js         ← images: [{ url, publicId }], rejectionReason field
│   │   ├── Bid.js
│   │   └── Watchlist.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── auctionRoutes.js   ← Multer error handler for upload failures
│   │   ├── bidRoutes.js
│   │   └── watchlistRoutes.js
│   ├── socket/
│   │   └── socketHandler.js   ← Room join/leave + viewer counts
│   └── utils/
│       ├── ApiError.js
│       └── ApiResponse.js
│
└── frontend/
    ├── package.json
    ├── .env                   ← Frontend environment variables (git-ignored)
    ├── .env.example           ← Environment variable template
    ├── vite.config.js
    └── src/
        ├── App.jsx            ← Router + RoleProtectedRoute + GuestRoute
        ├── main.jsx
        ├── index.css          ← Tailwind v4 + custom theme
        ├── context/
        │   ├── AuthContext.jsx    ← User/token state + localStorage
        │   └── SocketContext.jsx  ← Auto-connect on auth, room helpers
        ├── hooks/
        │   ├── useCountdown.js    ← Live countdown with anti-snipe restart
        │   └── useBid.js          ← Bid placement state machine
        ├── services/
        │   ├── authApi.js         ← Axios instance + interceptors
        │   ├── auctionApi.js      ← FormData for image uploads
        │   ├── bidApi.js
        │   └── watchlistApi.js
        ├── components/
        │   ├── Navbar.jsx             ← Role-aware navigation links
        │   ├── ImageSlider.jsx        ← Reusable carousel (arrows, dots, thumbnails, swipe, keyboard)
        │   ├── AuctionCard.jsx        ← Card with live status badge, countdown, bid flash animation
        │   ├── LightboxModal.jsx      ← Full-screen image viewer overlay
        │   ├── CountdownTimer.jsx     ← Full countdown with urgency colors
        │   ├── BidHistory.jsx
        │   ├── CreateAuctionModal.jsx ← Image preview + validation (5 files, 5MB each)
        │   ├── EditAuctionModal.jsx   ← Current images display + replacement flow
        │   ├── RejectAuctionModal.jsx ← Rejection reason input (10–500 chars)
        │   ├── AdminAuctionDetailsModal.jsx
        │   └── Loader.jsx
        ├── socket/
        │   └── socket.js
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── AuctionList.jsx    ← Card grid with search, filter tabs, sort, real-time socket updates
            ├── AuctionRoom.jsx    ← Full real-time auction page with ImageSlider
            ├── Dashboard.jsx      ← Role-based: seller (image thumbnails + lightbox) / admin / bidder
            └── Watchlist.jsx      ← Watchlist card grid
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **MongoDB** running locally on port `27017`
  - [Download MongoDB Community](https://www.mongodb.com/try/download/community)
  - Or use [MongoDB Atlas](https://www.mongodb.com/atlas) (update `MONGO_URI` in `.env`)
- **Cloudinary account** — [Sign up free](https://cloudinary.com/users/register_free)

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

Populates MongoDB with test users and 15 sample auctions (10 active + 1 of each other status).
Uploads 3 sample product images to your Cloudinary account automatically.

```bash
npm run seed
```

| Email | Password | Role |
|-------|----------|------|
| `admin@auction.com` | `admin123` | Admin |
| `seller@auction.com` | `seller123` | Seller |
| `bidder@auction.com` | `bidder123` | Bidder |
| `sourabh@gmail.com` | `sourabh123` | Bidder |

> ⚠️ **Warning:** Running seed clears all existing data and uploads fresh images to Cloudinary.

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

# Cloudinary (required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

| Variable | Description |
|----------|-------------|
| `PORT` | Express server port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs — **change this in production** |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`, `24h`) |
| `CLIENT_URL` | Frontend origin for CORS |
| `NODE_ENV` | `development` or `production` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

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
| `GET` | `/api/auctions/live` | Bidder | List all active auctions |
| `GET` | `/api/auctions/:id` | Public | Get auction by ID |
| `POST` | `/api/auctions/create` | Seller | Create auction (multipart/form-data, up to 5 images) |
| `PATCH` | `/api/auctions/:id` | Seller | Update auction (replaces images on Cloudinary) |
| `DELETE` | `/api/auctions/:id` | Seller | Delete auction (removes images from Cloudinary) |
| `PATCH` | `/api/auctions/:id/submit` | Seller | Submit auction for admin review |
| `GET` | `/api/auctions/pending` | Admin | List pending auctions |
| `PATCH` | `/api/auctions/:id/approve` | Admin | Approve or reject auction |
| `GET` | `/api/auctions/mine` | Seller | Get seller's own auctions |

### Bids
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/bids/place` | Bidder | Place a bid |
| `GET` | `/api/bids/:auctionId` | Bidder | Get bid history |

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
npm run seed         # Seed database with test data + Cloudinary images
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
  → All connected clients update UI instantly (card flash animation on AuctionList)
```

### Auction Lifecycle (Scheduler)

```
Every 60 seconds:
  1. Find approved auctions with startTime <= now → set status: "active"
  2. Find active auctions with endTime <= now → set status: "ended"
     → Emit "auctionEnded" to room with winner info
```

### Image Upload Flow

```
Seller creates/edits auction with images
  → Frontend validates: max 5 files, max 5MB each, jpg/png/webp only
  → FormData sent to backend via multipart/form-data
  → Multer + CloudinaryStorage uploads to "auction-system" folder
  → Cloudinary auto-transforms: 1200×800 limit, auto quality, auto format
  → Response: [{ url: "https://res.cloudinary.com/...", publicId: "auction-system/..." }]
  → On update: old images deleted from Cloudinary via deleteFromCloudinary()
  → On auction delete: all images purged from Cloudinary
```

### Role-Based Access Control

| Page | Admin | Seller | Bidder |
|------|-------|--------|--------|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/auctions` | ❌ | ❌ | ✅ |
| `/auction/:id` | ❌ | ❌ | ✅ |
| `/watchlist` | ❌ | ❌ | ✅ |
| `/login` | ✅ | ✅ | ✅ |
| `/register` | ✅ | ✅ | ✅ |

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

<p align="center">Built with ❤️ using the MERN Stack + Socket.IO + Cloudinary</p>
