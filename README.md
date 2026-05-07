# 🏷️ Real-Time Online Auction System

> A production-grade full-stack MERN auction platform 
> with real-time bidding, seller authorization 
> workflows, role-based dashboards, and comprehensive 
> security hardening.

[![Node.js](https://img.shields.io/badge/Node.js-v20-green)]()
[![React](https://img.shields.io/badge/React-18-blue)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green)]()
[![Socket.io](https://img.shields.io/badge/Socket.io-4-black)]()
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-cyan)]()
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow)]()

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [System Architecture](#️-system-architecture)
- [Project Structure](#-project-structure)
- [Database Design](#️-database-design)
- [API Reference](#-api-reference)
- [Socket.IO Events](#-socketio-event-reference)
- [Role & Permission Matrix](#-role--permission-matrix)
- [Auction Status Flow](#-auction-status-flow)
- [Seller Authorization Flow](#-seller-authorization-flow)
- [Security Measures](#-security-measures)
- [Performance Optimizations](#-performance-optimizations)
- [Edge Cases Handled](#-edge-cases-handled)
- [Environment Variables](#️-environment-variables)
- [Getting Started](#-getting-started)
- [Scripts Reference](#-scripts-reference)
- [How It Works](#️-how-it-works)
- [Known Limitations](#️-known-limitations)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT with issuer/audience claims + token blacklisting on logout**
- **Fresh DB lookup on every protected request** (stale JWT bypass prevention)
- **bcrypt cost factor 12 with 72-char truncation guard**
- **Password strength enforcement** (uppercase, lowercase, number required)
- **Rate limiting**: auth (10/15min), API (100/min), bids (20/min/user), uploads (30/hr)
- **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **Socket connections authenticated via JWT middleware** + blacklist check + isBlocked DB verification
- **Multer file validation**: mimetype whitelist, extension check, filename sanitization
- **HTML tag stripping on text inputs** (XSS prevention)

### 👤 Bidder Features
- Browse live auctions in interactive card grid
- Real-time bid placement with atomic race condition protection (409 Conflict UX)
- Watchlist management with heart icon toggle
- Personal profile management (name, contact, address, profile image)
- Bid history tracking with pagination
- Live countdown timer with anti-snipe extension
- Socket reconnection with auto room re-join

### 🏪 Seller Features
- Multi-step seller authorization application (businessName, businessType, description, website, socialLinks)
- Seller status banner on dashboard (unverified/pending/rejected/authorized/suspended)
- Full auction lifecycle management: Draft (inactive) → Submit → Pending → Approved → Active → Ended
- Edit/delete only draft/rejected auctions (active/ended auctions are locked)
- Editing a pending auction resets to inactive
- Cloudinary image upload (up to 5 per auction, 5MB each, auto-transforms to 1200×800)
- Dashboard with search, filter tabs, sort, date range, price range, pagination
- Summary cards showing auction counts per status
- **📊 Seller Metrics Tab**:
  - View comprehensive metrics across all seller auctions
  - Monitor Views, Bids, Conversion %, Avg Bid, and Status per auction
  - Expand rows to see detailed conversion funnels and key performance indicators

### 🛡️ Admin Features
- Manage all auctions across all statuses with search/filter/pagination
- Approve or reject pending auctions (rejection requires mandatory reason, min 10 chars)
- Seller management tab:
  - View all sellers with status and auction stats
  - Authorize sellers (no reason required)
  - Reject applications (reason required)
  - Suspend accounts (reason required, sets isBlocked: true)
  - Reinstate suspended sellers
- View seller detail modal: (full profile, business info, recent auctions, current status reason, action buttons)
- Pending auction count badges on tabs
- **📊 Admin Analytics Dashboard**:
  - Overview metrics (Total Revenue, Auctions, Bids, Active Users, etc.)
  - Revenue timeline chart (Last 30 Days)
  - Auctions by status breakdown (Pie chart)
  - Peak bidding hours (Histogram)
  - User growth trends
  - Top 10 Auctions by Revenue table

### ⚡ Real-Time System
- Socket.IO rooms per auction (`auction_${id}`)
- Live bid broadcasting to all room members
- Anti-sniping: last 10s bid extends timer +10s
- **Live Engagement:**
  - Enhanced viewer list with avatars (up to 5 + overflow indicator)
  - Active bidder tracking (bidders active in last 60s)
  - "Auction Ending Soon" alerts (triggered when < 5 mins left)
  - Live activity feed showing bids, joins, lists, starts and ends
- **Auction Performance Metrics Tracking:**
  - Unique view counting and session duration accumulation (via Socket/IP tracking)
  - Conversion funnels tracking Views → Bids → Wins
  - Time-to-first-bid tracking
  - Bid-to-view ratios and peak bidding hours
  - Asynchronous metrics calculation cache (`AuctionMetrics`) for real-time dashboard performance
  - Visual urgency states on countdown timer
- Automatic reconnection with room re-join
- Reconnecting banner during connection loss
- Ghost connection cleanup via:
  - userRooms Map tracking
  - pingTimeout: 20s / pingInterval: 10s
  - disconnect handler cleanup

### 🔔 Smart Notification System
- **10 notification types**: outbid, auction_start, auction_end, watchlist_alert, auction_won, auction_lost, seller_approved, seller_rejected, auction_approved, auction_rejected
- **Real-time push** via Socket.IO personal rooms (`user_${id}`)
- **Persisted in MongoDB** with 30-day TTL auto-cleanup
- **Per-user preferences** — toggle individual notification types on/off
- **Centralized service** — all notifications flow through `notificationService.js`
- Outbid alerts when someone places a higher bid
- Auction start alerts for watchlist users
- Win/loss notifications when auctions end
- Seller status change alerts (authorized/rejected/suspended)
- Auction approval/rejection alerts for sellers

### 📋 User Activity Feed
- **10 activity types**: bid_placed, auction_created, auction_started, auction_ended, watchlist_added, watchlist_removed, seller_authorized, auction_approved, auction_rejected, user_joined_auction
- **Real-time updates** via Socket.IO broadcast to `user_${id}` personal room and `global_activity` room
- **Personal feed** (`/activity`) — user sees their own full history
- **Global feed** — all public activities visible to everyone (private admin actions hidden from non-admins)
- **Time-grouped display** — Today / Yesterday / This Week / Older
- **Type filter** — filter by any activity type
- **Load More pagination** — button-based (not infinite scroll)
- **Auto-TTL**: activities auto-deleted from MongoDB after **90 days**
- Centralized logging via `activityService.js` — all activity creation goes through `Activity.createActivity` static method
- Integration points: bidController, auctionController, watchlistController, sellerAuthController, socketHandler, server.js scheduler
- Private activities (watchlist, admin actions) visible only to the performing user

### 🎨 UI/UX Features
- Interactive auction card grid (3-col desktop, 2-col tablet, 1-col mobile)
- Custom ImageSlider (no external library): arrows, dots, thumbnails, autoplay, touch/swipe, keyboard navigation, image counter badge, skeleton shimmer
- Live Engagement Components: `LiveViewerList` and `ActiveBiddersChip`
- Activity Feed: `ActivityFeed`, `ActivityItem`, `ActivityPage`, time-grouped with skeleton loading
- Skeleton loading for cards and table rows
- IntersectionObserver — defers ImageSlider init until card enters viewport
- Avatar dropdown in Navbar: profile image (or initials fallback), role badge, profile completion bar, "My Profile" link, Logout button
- ProfileModal with 3 tabs: Personal Info (name, contact, stats), Address (street, city, state, pincode), Security (change password + strength indicator)
- LightboxModal for full-screen image preview
- BlockedNotice full-screen overlay for blocked/suspended accounts
- Toast system with auto-dismiss, progress bar, type variants
- Role-based navbar links
- Unsaved changes warning in ProfileModal

---

## 🛠️ Tech Stack

| Layer        | Technology                         | Notes                          |
|--------------|------------------------------------|--------------------------------|
| Frontend     | React 18 + Vite                    | SPA, fast HMR                  |
| Styling      | Tailwind CSS v4                    | Custom @theme tokens           |
| State        | Context API                        | Auth, Socket, Toast contexts   |
| Routing      | React Router DOM v6                | RoleProtectedRoute + GuestRoute|
| HTTP Client  | Axios                              | JWT interceptors, 403 handler  |
| Real-Time    | Socket.io-client                   | Auto-reconnect configured      |
| Notifications| React Toastify                     | Toast system                   |
| Charts       | Recharts                           | Responsive, SVG-based charts   |
| Backend      | Node.js v20 + Express 5            | ESM modules                    |
| Database     | MongoDB + Mongoose 9               | Indexes, lean(), transactions  |
| Real-Time    | Socket.io 4                        | Rooms, heartbeat, auth middleware|
| Auth         | JWT + bcryptjs                     | Blacklist, issuer/audience     |
| File Storage | Cloudinary v2 + Multer             | Auto-transform, auto-delete    |
| Rate Limit   | express-rate-limit                 | Per-route limits               |
| Dev Tools    | Nodemon + Concurrently             | Parallel dev server            |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────┐
│                  React.js Frontend                    │
│  Vite SPA | Tailwind v4 | React Router | Axios        │
│  Context: Auth | Socket | Toast                       │
└──────────────┬───────────────────────┬────────────────┘
               │ REST (HTTPS/HTTP)     │ WSS
               ▼                      ▼
┌──────────────────────┐  ┌─────────────────────────┐
│   Express.js REST    │  │   Socket.io Server       │
│   API (Stateless)    │  │   (Stateful Rooms)       │
│                      │  │   Auth Middleware        │
│   Middleware Chain:  │  │   Bid Rate Limiter       │
│   Auth → Role →      │  │   userRooms Map          │
│   SellerAuth →       │  │   Heartbeat 10s/20s      │
│   RateLimit →        │  │                         │
│   Controller         │  │                         │
└──────────┬───────────┘  └────────────┬────────────┘
           │                           │
           └─────────────┬─────────────┘
                         ▼
               ┌──────────────────┐
               │    MongoDB        │
               │  Mongoose 9 ODM   │
               │  15 Indexes       │
               │  .lean() queries  │
               │  Atomic updates   │
               └──────────────────┘
                         │
               ┌──────────────────┐
               │  Cloudinary CDN   │
               │  auction images   │
               │  profile avatars  │
               │  auto-transform   │
               └──────────────────┘
```

---

## 📁 Project Structure

```
Real-time-auction-system/
├── package.json                   ← Root (concurrently + install:all)
├── README.md
├── project.json                   ← Machine-readable project context
│
├── backend/
│   ├── package.json
│   ├── server.js                  ← Express + Socket.IO + Scheduler 
│   │                                + Security Headers + Rate Limits
│   ├── seed.js                    ← Seeds users + auctions + Cloudinary images
│   ├── .env                       ← (git-ignored)
│   ├── .env.example
│   │
│   ├── config/
│   │   ├── db.js                  ← MongoDB connection + pool config + graceful shutdown
│   │   ├── cloudinary.js          ← Cloudinary v2 config + deleteFromCloudinary helper
│   │   ├── multer.js              ← Multer + CloudinaryStorage 
│   │   │                            (mimetype, extension, filename sanitization)
│   │   └── dbIndexes.js           ← Index verification utility (dev only)
│   │
│   ├── controllers/
│   │   ├── authController.js      ← Register, Login (issuer/audience JWT), 
│   │   │                            Logout (blacklist), getMe
│   │   ├── auctionController.js   ← Full CRUD + submit + approve + scheduler
│   │   ├── bidController.js       ← Atomic $expr bid + anti-snipe + 409 Conflict
│   │   ├── watchlistController.js ← Add, get, remove
│   │   ├── profileController.js   ← Get profile+stats, update, 
│   │   │                            changePassword, removeImage
│   │   ├── sellerAuthController.js← Apply, getMyStatus, getAllSellers,
│   │   │                            getSellerById, updateSellerStatus
│   │   ├── notificationController.js ← getMyNotifications, markAsRead,
│   │   │                              markAllAsRead, deleteNotification,
│   │   │                              getUnreadCount, preferences CRUD
│   │   ├── activityController.js  ← getMyActivity, getGlobalActivity,
│   │   │                             getActivityByType, deleteActivity
│   │   └── analyticsController.js ← Admin parallel aggregation metrics
│   │                                 (overview, revenue, status, bids, etc.)
│   │
│   ├── services/
│   │   ├── notificationService.js ← Centralized notification creation,
│   │   │                            preference checking, Socket.IO push,
│   │   │                            helpers: notifyOutbid, notifyAuctionStart,
│   │   │                            notifyAuctionEnd, notifySellerStatusChange,
│   │   │                            notifyAuctionStatusChange
│   │   └── activityService.js     ← Centralized activity logging,
│   │                                 10 helper functions (logBidPlaced,
│   │                                 logAuctionCreated, logAuctionEnded...)
│   │                                 all fire-and-forget safe
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js      ← JWT verify + blacklist check 
│   │   │                            + fresh DB user fetch + isBlocked guard
│   │   ├── roleMiddleware.js      ← authorizeRoles + restrictRoles (uses req.user)
│   │   ├── sellerAuthMiddleware.js← requireAuthorizedSeller (uses req.user)
│   │   ├── rateLimitMiddleware.js ← authRateLimiter, apiRateLimiter,
│   │   │                            bidRateLimiter, uploadRateLimiter
│   │   └── errorMiddleware.js     ← Global handler: Multer, Cloudinary, 
│   │                                Mongoose, JWT errors
│   │
│   ├── models/
│   │   ├── User.js                ← role, isBlocked, sellerStatus, sellerProfile,
│   │   │                            profileImage, contactNumber, address,
│   │   │                            lastLogin, profileCompletion virtual,
│   │   │                            bcrypt pre-save (cost 12, 72-char guard)
│   │   ├── Auction.js             ← status enum (6 values), images [{url,publicId}],
│   │   │                            rejectionReason, 8 compound indexes
│   │   ├── Bid.js                 ← 3 compound indexes
│   │   ├── Watchlist.js           ← unique compound index {user, auction}
│   │   ├── TokenBlacklist.js      ← tokenHash (SHA-256), TTL index (auto-expiry)
│   │   ├── Notification.js        ← 11 types (incl. auction_ending_soon),
│   │   │                            recipient indexed, isRead,
│   │   │                            data payload, 30-day TTL auto-delete
│   │   ├── NotificationPreferences.js ← per-user toggles, push/email flags
│   │   └── Activity.js            ← 10 activity types, user ref, isPublic,
│   │                                metadata, 90-day TTL, 4 indexes,
│   │                                createActivity() static method with
│   │                                socket broadcast
│   │
│   ├── routes/
│   │   ├── authRoutes.js          ← register, login, logout, me
│   │   ├── auctionRoutes.js       ← Full CRUD + submit + approve
│   │   │                            + Multer error handler
│   │   ├── bidRoutes.js           ← place (bidRateLimiter), my-bids, :auctionId
│   │   ├── watchlistRoutes.js     ← add, my, :auctionId (bidder only)
│   │   ├── profileRoutes.js       ← me, update (uploadProfileImage), 
│   │   │                            change-password, remove-image
│   │   ├── sellerRoutes.js        ← apply, my-status, all, :sellerId,
│   │   │                            :sellerId/status
│   │   ├── notificationRoutes.js  ← my, unread-count, :id/read,
│   │   │                            read-all, :id, preferences
│   │   ├── activityRoutes.js      ← my, global, by-type/:type, :id
│   │   └── analyticsRoutes.js     ← Protected admin-only analytics endpoints
│   │
│   ├── socket/
│   │   └── socketHandler.js       ← io.use() JWT+blacklist+isBlocked auth,
│   │                                joinAuction, leaveAuction,
│   │                                joinGlobalFeed, leaveGlobalFeed,
│   │                                user_${id} personal room join,
│   │                                disconnect cleanup, userRooms Map,
│   │                                activeBidders Map, socketBidTracker,
│   │                                viewerUpdate emit, logUserJoinedAuction
│   │
│   └── utils/
│       ├── ApiError.js
│       ├── ApiResponse.js
│       └── paginateQuery.js       ← Hard-capped limit 50, buildPaginationMeta
│                                    with from/to range
│
└── frontend/
    ├── package.json
    ├── .env                        ← (git-ignored)
    ├── .env.example
    ├── vite.config.js
    ├── tailwind.config.js
    │
    └── src/
        ├── App.jsx                 ← Router + ProtectedRoute + 
        │                             RoleProtectedRoute + GuestRoute
        │                             + BlockedNotice overlay
        ├── main.jsx
        ├── index.css               ← Tailwind v4 + custom @theme tokens
        │
        ├── context/
        │   ├── AuthContext.jsx     ← user, token, profileImage, sellerStatus,
        │   │                         isAccountBlocked, logout (blacklists token),
        │   │                         token expiry warning, auth:expired listener
        │   ├── SocketContext.jsx   ← Auto-connect on auth, disconnect on logout,
        │   │                         auth error event handling
        │   └── ToastContext.jsx    ← showToast(message, type), 
        │                             ToastProvider, useToast hook
        │
        ├── hooks/
        │   ├── useCountdown.js     ← Live countdown, urgency states
        │   │                         (isEndingSoon, isCritical, isUltraCritical)
        │   ├── useBid.js           ← Bid state machine + 409 Conflict handler
        │   │                         + input auto-update on conflict
        │   ├── useProfile.js       ← fetchProfile, handleUpdateProfile,
        │   │                         handleChangePassword, handleRemoveImage
        │   ├── useDashboardFilters.js ← search, status, sortBy, sortOrder,
        │   │                           page, limit, dateRange, priceRange,
        │   │                           buildQueryString, activeFilterCount
        │   ├── useActivity.js      ← Fetches activity feed (my/global),
        │   │                         pagination + loadMore, real-time
        │   │                         prepend via socket:newActivity event
        │   └── useIntersectionObserver.js ← Trigger once on viewport entry
        │
        ├── services/
        │   ├── authApi.js          ← Axios instance + JWT interceptor 
        │   │                         + 401 redirect + 403 blocked handler
        │   │                         + tokenExpiresAt client check
        │   │                         + logoutUser (blacklist + clear storage)
        │   ├── auctionApi.js       ← FormData uploads, all auction calls
        │   ├── bidApi.js           ← placeBid, getBidsByAuction (paginated),
        │   │                         getMyBids
        │   ├── watchlistApi.js
        │   ├── profileApi.js       ← getProfile, updateProfile (FormData),
        │   │                         changePassword, removeProfileImage
        │   ├── sellerAuthApi.js    ← submitApplication, getMyStatus,
        │   │                         getAllSellers, getSellerById,
        │   │                         updateSellerStatus
        │   ├── dashboardApi.js     ← getMyAuctions, getPendingAuctions,
        │   │                         getAllAuctions, getMyBids (all paginated)
        │   ├── activityApi.js      ← getMyActivity, getGlobalActivity,
        │                             getActivityByType, deleteActivity
        │   └── analyticsApi.js     ← Admin analytics data fetching
        │
        ├── socket/
        │   └── socket.js           ← Singleton, connectSocket(token),
        │                             disconnectSocket, reconnect handling,
        │                             server-kick detection, all auth
        │                             error codes handled, viewerList,
        │                             activeBidders, auctionEndingSoon,
        │                             newActivity event dispatchers
        │
        ├── components/
        │   ├── Navbar.jsx          ← Role-aware links, avatar + initials fallback,
        │   │                         dropdown: profile completion bar, 
        │   │                         seller status row, My Profile, Logout
        │   ├── ImageSlider.jsx     ← Custom carousel: arrows, dots, thumbnails,
        │   │                         counter badge, autoplay + pause on hover,
        │   │                         touch/swipe, keyboard, preload next,
        │   │                         skeleton shimmer, error fallback
        │   ├── AuctionCard.jsx     ← Status badge overlay, watchlist heart,
        │   │                         live bid display, bid flash animation,
        │   │                         compact countdown, Join/Ended/Soon buttons,
        │   │                         hover lift effect, React.memo
        │   ├── AuctionCardSkeleton.jsx ← animate-pulse card placeholder
        │   ├── CountdownTimer.jsx  ← Color urgency: green/yellow/red,
        │   │                         animate-pulse <10s, React.memo
        │   ├── BidHistory.jsx      ← Scrollable, avatar + initials,
        │   │                         highlight own bids, slide-in animation,
        │   │                         Load More pagination, React.memo
        │   ├── CreateAuctionModal.jsx ← Image preview thumbnails + validation
        │   ├── EditAuctionModal.jsx   ← Pre-fill form, existing image preview,
        │   │                           replace images logic
        │   ├── RejectAuctionModal.jsx ← Mandatory reason (10-500 chars),
        │   │                           live char count
        │   ├── LightboxModal.jsx   ← Full-screen ImageSlider overlay,
        │   │                         Escape/backdrop close
        │   ├── BlockedNotice.jsx   ← Fixed full-screen, no escape route,
        │   │                         contact support + logout only
        │   ├── ProfileModal.jsx    ← 3 tabs: Personal Info (stats, fields),
        │   │                         Address, Security (password + strength),
        │   │                         avatar upload, profile completion bar,
        │   │                         unsaved changes warning
        │   ├── Toast.jsx           ← Stack, auto-dismiss 4s, progress bar,
        │   │                         4 types, slide in/out animation
        │   ├── LiveViewerList.jsx  ← Avatar stack with +N overflow for viewers
        │   ├── ActiveBiddersChip.jsx ← Pulsing green chip, active bidder names
        │   ├── ActivityFeed.jsx    ← Time-grouped feed (Today/Yesterday/
        │   │                         This Week/Older), skeleton loading,
        │   │                         Load More button, my/global feedType
        │   ├── ActivityItem.jsx    ← User avatar, action text, metadata
        │   │                         badges, relative timestamp, type icon,
        │   │                         full dark mode, React.memo
        │   │
        │   ├── dashboard/
        │   │   ├── SearchBar.jsx   ← Debounced 300ms, clear button, spinner
        │   │   ├── FilterBar.jsx   ← Expandable panel, date range, price range,
        │   │   │                     seller search (admin), active filter badge
        │   │   ├── Pagination.jsx  ← Smart page numbers, ellipsis, per-page
        │   │   │                     selector, from/to display, mobile mode
        │   │   ├── StatusTabs.jsx  ← Scrollable pill tabs with counts
        │   │   └── SummaryCards.jsx← 6 cards per role, clickable filters,
        │   │                         skeleton loading, animated stats
        │   │
        │   ├── seller/
        │   │   ├── SellerStatusBanner.jsx  ← 5 status variants, apply/reapply
        │   │   │                             buttons, animated pending state
        │   │   └── SellerApplicationModal.jsx ← 3-step form, checkboxes,
        │   │                                    view/apply/reapply modes,
        │   │                                    unsaved changes confirm
        │   │
        │   └── admin/
        │       ├── SellerManagementTable.jsx ← Full table with all actions
        │       ├── SellerDetailModal.jsx     ← Full profile, stats, 
        │       │                               recent auctions, action btns
        │       └── SellerStatusActionModal.jsx ← reject/suspend/revoke,
        │                                         reason validation
        │
        └── pages/
            ├── Login.jsx           ← Role-based redirect after login
            ├── Register.jsx        ← Password strength indicator
            ├── AuctionList.jsx     ← Card grid, search, filter tabs, sort,
            │                         skeleton loading, socket bid updates,
            │                         auto-refresh 30s, IntersectionObserver
            ├── AuctionRoom.jsx     ← Full real-time room, ImageSlider
            │                         with thumbnails, bid conflict flash,
            │                         reconnect banner, winner banner,
            │                         LiveViewerList, ActiveBiddersChip,
            │                         Ending soon banner, Load More bids
            ├── Dashboard.jsx       ← Seller: status banner + auction CRUD
            │                         + summary cards + filter/paginate
            │                         Admin: pending + all auctions +
            │                         manage sellers tabs
            │                         Bidder: my bids with pagination
            ├── Watchlist.jsx       ← Card grid of saved auctions
            ├── ActivityPage.jsx    ← My Activity / Global Feed tabs,
            │                         type filter, live indicator,
            │                         joinGlobalFeed socket management
            └── AdminAnalyticsDashboard.jsx ← Parallel data fetching, 
                                              5-min auto refresh, charts
```

---

## 🗃️ Database Design

### Users Collection

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | Auto index |
| name | String | 2-50 chars |
| email | String | Unique, indexed |
| password | String | bcrypt cost 12, 72-char guard |
| role | Enum | admin / seller / bidder |
| profileImage | Object | { url, publicId } |
| contactNumber | String | 10-15 digits |
| address | Object | { street, city, state, pincode, country } |
| isBlocked | Boolean | Default false |
| sellerStatus | Enum | unverified / pending_review / authorized / rejected / suspended |
| sellerProfile | Object | { businessName, businessType, description, website, socialLinks } |
| sellerStatusReason | String | Admin-provided reason |
| sellerStatusUpdatedAt | Date | Timestamp of last status change |
| sellerStatusUpdatedBy | ObjectId | ref: User (admin) |
| sellerAppliedAt | Date | Seller application timestamp |
| lastLogin | Date | Updated on each login |
| createdAt | Date | Auto |

Virtual: profileCompletion (0-100%)

Indexes:
- `{ role: 1, sellerStatus: 1 }`
- `{ role: 1, sellerAppliedAt: -1 }`
- `{ _id: 1, isBlocked: 1, sellerStatus: 1 }`

### Auctions Collection

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| title | String | 5-100 chars, text indexed |
| description | String | text indexed |
| seller | ObjectId | ref: User |
| basePrice | Number | |
| currentHighestBid | Number | Default: basePrice |
| highestBidder | ObjectId | ref: User |
| minIncrement | Number | |
| images | Array | [{ url, publicId }] |
| status | Enum | inactive/pending/approved/active/ended/rejected |
| startTime | Date | |
| endTime | Date | |
| approvedBy | ObjectId | ref: User |
| rejectionReason | String | null unless rejected |
| createdAt | Date | |

Indexes:
- `{ status: 1, endTime: 1 }`
- `{ status: 1, startTime: 1 }`
- `{ seller: 1, status: 1, createdAt: -1 }`
- `{ status: 1, createdAt: -1 }`
- `{ highestBidder: 1, status: 1 }`
- `{ title: "text", description: "text" }` (weights: title×10, description×5)

### Bids Collection

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| auction | ObjectId | ref: Auction, indexed |
| bidder | ObjectId | ref: User |
| amount | Number | |
| timestamp | Date | Default: now |

Indexes:
- `{ auction: 1, timestamp: -1 }`
- `{ bidder: 1, timestamp: -1 }`
- `{ auction: 1, bidder: 1 }`

### Watchlists Collection

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| user | ObjectId | ref: User |
| auction | ObjectId | ref: Auction |
| addedAt | Date | Default: now |

Indexes:
- `{ user: 1, auction: 1 }` (unique)
- `{ user: 1, addedAt: -1 }`
- `{ auction: 1 }`

### TokenBlacklist Collection

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| tokenHash | String | SHA-256 of JWT, unique, indexed |
| expiresAt | Date | TTL index (auto-deleted by MongoDB) |
| createdAt | Date | |

### Notifications Collection

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| recipient | ObjectId | ref: User, indexed |
| type | Enum | outbid/auction_start/auction_end/watchlist_alert/auction_won/auction_lost/seller_approved/seller_rejected/auction_approved/auction_rejected |
| title | String | max 100 chars |
| message | String | max 500 chars |
| data | Object | { auctionId, auctionTitle, bidAmount, previousBid, winnerId, winnerName, status, reason } |
| isRead | Boolean | Default: false, indexed |
| createdAt | Date | Indexed, 30-day TTL auto-delete |

Indexes:
- `{ recipient: 1, isRead: 1, createdAt: -1 }` (primary query)
- `{ recipient: 1, createdAt: -1 }`
- `{ createdAt: 1 }` TTL (expireAfterSeconds: 2592000)

### NotificationPreferences Collection

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| user | ObjectId | ref: User, unique |
| emailNotifications | Boolean | Default: false (future) |
| pushNotifications | Boolean | Default: true |
| preferences | Object | { outbid, auction_start, auction_end, watchlist_alert, auction_won, auction_lost, seller_status, auction_status } — all Boolean, default true |
| createdAt | Date | |
| updatedAt | Date | |

Index: `{ user: 1 }` (unique)

### Activities Collection

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | Auto index |
| user | ObjectId | ref: User, required, indexed |
| type | String (Enum) | 10 values (bid_placed, auction_created, etc.) |
| action | String | Human-readable description, max 200 chars |
| metadata | Object | { auctionId, auctionTitle, bidAmount, previousBid, winnerId, winnerName, targetUserId, targetUserName, reason } |
| isPublic | Boolean | Default: true; false for private admin/watchlist actions |
| createdAt | Date | Default: now, indexed |

Indexes:
- `{ user: 1, createdAt: -1 }` (personal feed)
- `{ type: 1, createdAt: -1 }` (filter by type)
- `{ isPublic: 1, createdAt: -1 }` (global feed)
- `{ createdAt: 1 }` TTL (expireAfterSeconds: 7776000 — 90 days)

---

## 📡 API Reference

| Method | Endpoint | Auth | Role | Rate Limit | Description |
|--------|----------|------|------|------------|-------------|
| POST | `/api/auth/register` | No | Any | 10/15min | Register, returns JWT |
| POST | `/api/auth/login` | No | Any | 10/15min | Login, returns JWT + expiresAt |
| POST | `/api/auth/logout` | Yes | Any | — | Blacklist token in DB |
| GET | `/api/auth/me` | Yes | Any | 100/min | Get current user (fresh DB) |
| GET | `/api/auctions/live` | No | Bidder* | 100/min | Active auctions (paginated) |
| POST | `/api/auctions/create` | Yes | Seller† | 30/hr | Create auction (multipart) |
| GET | `/api/auctions/mine` | Yes | Seller | 100/min | My auctions (search/filter/paginate) |
| GET | `/api/auctions/pending` | Yes | Admin | 100/min | Pending auctions (search/filter/paginate) |
| GET | `/api/auctions/all` | Yes | Admin | 100/min | All auctions (search/filter/paginate) |
| GET | `/api/auctions/:id` | No | Public | 100/min | Auction detail |
| PATCH | `/api/auctions/:id` | Yes | Seller | 30/hr | Update auction (draft/rejected only) |
| PATCH | `/api/auctions/:id/submit` | Yes | Seller | 100/min | Submit for admin review |
| PATCH | `/api/auctions/:id/approve` | Yes | Admin | 100/min | Approve/reject with reason |
| DELETE | `/api/auctions/:id` | Yes | Seller | 100/min | Delete (draft/rejected only) |
| POST | `/api/bids/place` | Yes | Bidder | 20/min | Atomic bid + 409 Conflict |
| GET | `/api/bids/:auctionId` | No | Public | 100/min | Bid history (paginated) |
| GET | `/api/bids/my-bids` | Yes | Bidder | 100/min | My bids (search/sort/paginate) |
| POST | `/api/watchlist/add` | Yes | Bidder | 100/min | Add to watchlist |
| GET | `/api/watchlist/my` | Yes | Bidder | 100/min | My watchlist |
| DELETE | `/api/watchlist/:auctionId` | Yes | Bidder | 100/min | Remove from watchlist |
| GET | `/api/profile/me` | Yes | Any | 100/min | Profile + role stats |
| PATCH | `/api/profile/update` | Yes | Any | 30/hr | Update profile + avatar |
| PATCH | `/api/profile/change-password` | Yes | Any | 100/min | Change password |
| DELETE | `/api/profile/remove-image` | Yes | Any | 100/min | Remove avatar from Cloudinary |
| POST | `/api/seller/apply` | Yes | Seller | 100/min | Submit seller application |
| GET | `/api/seller/my-status` | Yes | Seller | 100/min | My seller status |
| GET | `/api/seller/all` | Yes | Admin | 100/min | All sellers (search/filter/paginate) |
| GET | `/api/seller/:sellerId` | Yes | Admin | 100/min | Seller detail + stats |
| PATCH | `/api/seller/:sellerId/status` | Yes | Admin | 100/min | Authorize/reject/suspend/revoke |
| GET | `/api/notifications/my` | Yes | Any | 100/min | My notifications (paginated, filterable) |
| GET | `/api/notifications/unread-count` | Yes | Any | 100/min | Unread notification count |
| PATCH | `/api/notifications/:id/read` | Yes | Any | 100/min | Mark single notification as read |
| PATCH | `/api/notifications/read-all` | Yes | Any | 100/min | Mark all notifications as read |
| DELETE | `/api/notifications/:id` | Yes | Any | 100/min | Delete a notification |
| GET | `/api/notifications/preferences` | Yes | Any | 100/min | Get notification preferences |
| PATCH | `/api/notifications/preferences` | Yes | Any | 100/min | Update notification preferences |
| GET | `/api/activity/my` | Yes | Any | 100/min | Personal activity feed (paginated, filterable) |
| GET | `/api/activity/global` | Yes | Any | 100/min | Global public activity feed |
| GET | `/api/activity/by-type/:type` | Yes | Any | 100/min | Activities filtered by type |
| DELETE | `/api/activity/:id` | Yes | Any | 100/min | Delete own activity (admin deletes any) |
| GET | `/api/analytics/overview` | Yes | Admin | 100/min | Top-level dashboard stats |
| GET | `/api/analytics/revenue-by-day` | Yes | Admin | 100/min | Revenue over time |
| GET | `/api/analytics/auctions-by-status` | Yes | Admin | 100/min | Pie chart data |
| GET | `/api/analytics/bid-frequency` | Yes | Admin | 100/min | Hourly bidding histogram |
| GET | `/api/analytics/top-auctions` | Yes | Admin | 100/min | Top auctions by revenue |
| GET | `/api/analytics/user-growth` | Yes | Admin | 100/min | User registration trend |

*Admin and Seller are restricted from `/api/auctions/live` at backend
†Requires `sellerStatus: "authorized"` via `requireAuthorizedSeller` middleware

---

## ⚡ Socket.IO Event Reference

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| joinAuction | Client → Server | `{ auctionId, userId }` | Join auction room |
| leaveAuction | Client → Server | `{ auctionId }` | Leave auction room |
| bidUpdated | Server → Room | `{ auctionId, highestBid, highestBidder: {id,name}, timestamp }` | New bid placed |
| timerExtended | Server → Room | `{ auctionId, newEndTime }` | Anti-snipe extension |
| auctionEnded | Server → Room | `{ auctionId, winnerId, winnerName, finalBid }` | Auction ended |
| viewerUpdate | Server → Room | `{ auctionId, viewers }` | Viewer count changed |
| userJoined | Server → Room | `{ userId, totalViewers }` | User entered room |
| bidError | Server → Client | `{ code, message }` | Bid failed (RATE_LIMITED, AUTH_BLOCKED) |
| newNotification | Server → User | `{ id, type, title, message, data, isRead, createdAt }` | Push notification to user's personal room |
| viewerList | Server → Client | `{ auctionId, viewers: [{id,name,profileImage}], count }` | Full viewer list on join |
| activeBidders | Server → Room | `{ auctionId, bidders: [name], count }` | Active bidders (60s window) |
| auctionEndingSoon | Server → Room | `{ auctionId, timeLeft, auctionTitle }` | < 5 minutes warning |
| newActivity | Server → User+Global | `{ id, user, type, action, metadata, isPublic, createdAt }` | Real-time activity broadcast |
| joinGlobalFeed | Client → Server | `{}` | Subscribe to global_activity room |
| leaveGlobalFeed | Client → Server | `{}` | Unsubscribe from global_activity room |

Socket Connection Auth:
- Token via `socket.handshake.auth.token`
- Validates: JWT signature + issuer/audience + blacklist + user exists + isBlocked
- Error codes: `AUTH_REQUIRED`, `AUTH_EXPIRED`, `AUTH_BLACKLISTED`, `AUTH_NOTFOUND`, `AUTH_BLOCKED`

---

## 👥 Role & Permission Matrix

| Permission | Admin | Seller | Bidder |
|------------|-------|--------|--------|
| /auctions page | ❌ | ❌ | ✅ |
| /auction/:id page | ❌ | ❌ | ✅ |
| /watchlist page | ❌ | ❌ | ✅ |
| /dashboard | ✅ | ✅ | ✅ |
| Place bids | ❌ | ❌ | ✅ |
| Manage watchlist | ❌ | ❌ | ✅ |
| Create auctions | ❌ | ✅* | ❌ |
| Submit for review | ❌ | ✅ | ❌ |
| Edit draft auctions | ❌ | ✅ | ❌ |
| Delete draft auctions | ❌ | ✅ | ❌ |
| Apply for seller auth | ❌ | ✅ | ❌ |
| Approve/reject auctions | ✅ | ❌ | ❌ |
| Authorize sellers | ✅ | ❌ | ❌ |
| Suspend users | ✅ | ❌ | ❌ |
| View all auctions | ✅ | ❌ | ❌ |
| View all sellers | ✅ | ❌ | ❌ |
| Manage own profile | ✅ | ✅ | ✅ |

*Only when sellerStatus === "authorized"

---

## 🔄 Auction Status Flow

```
         [Seller Creates Auction]
                    │
               INACTIVE ◄──────────────────────────┐
                    │                               │
         [Seller: Submit for Verification]  [Seller edits]
                    │                        (resets to inactive)
               PENDING ────────────────────────────┘
                    │
         [Admin Reviews]
          ↙              ↘
     REJECTED          APPROVED
          │                 │
  [Shows reason]   [Scheduler: startTime ≤ now]
  [Can reapply]             │
                         ACTIVE
                     (Real-time bidding)
                            │
                [Scheduler: endTime ≤ now]
                            │
                          ENDED
                    (Winner determined)
```

Status edit/delete rules:
| Status | Edit | Delete | Submit |
|--------|------|--------|--------|
| inactive | ✅ | ✅ | ✅ |
| pending | ✅* | ✅ | ❌ |
| rejected | ✅ | ✅ | ✅ |
| approved | ❌ | ❌ | ❌ |
| active | ❌ | ❌ | ❌ |
| ended | ❌ | ❌ | ❌ |

*Editing pending resets to inactive

---

## 🏪 Seller Authorization Flow

```
[Register as Seller]
         │
    UNVERIFIED
    (can apply)
         │
[Fill application: businessName, businessType,
 description, website, socialLinks]
         │
  PENDING_REVIEW
  (awaiting admin)
         │
   [Admin reviews]
    ↙          ↘
REJECTED      AUTHORIZED
(reason)     (can create auctions)
    │               │
[Reapply]    [Admin action]
              ↙           ↘
         REVOKED        SUSPENDED
      (→ unverified)   (isBlocked: true)
      (reason opt.)    (reason required)
```

---

## 🔒 Security Measures

| Measure | Implementation | Files |
|---------|---------------|-------|
| JWT Hardening | issuer/audience claims, SHA-256 blacklist with MongoDB TTL | authController.js, TokenBlacklist.js |
| Fresh DB Auth | Every protected request fetches user from DB | authMiddleware.js |
| Token Blacklist | POST /api/auth/logout blacklists token hash | authController.js, TokenBlacklist.js |
| Rate Limiting | express-rate-limit: auth 10/15min, api 100/min, bids 20/min, uploads 30/hr | rateLimitMiddleware.js |
| Security Headers | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, no X-Powered-By | server.js |
| Socket Auth | JWT + blacklist + isBlocked on every connection, per-socket bid rate limit 20/min | socketHandler.js |
| File Validation | Mimetype whitelist, extension check, filename sanitization, Cloudinary resource_type verify | multer.js, auctionController.js |
| Input Sanitization | HTML tag stripping on all text inputs | auctionController.js, profileController.js |
| bcrypt Hardening | Cost factor 12, 72-char truncation guard, strength enforcement | User.js, authController.js |
| Session Management | tokenExpiresAt in localStorage, 5-min expiry warning, auth:expired event | AuthContext.jsx, authApi.js |
| Blocked Users | Full-screen BlockedNotice, socket disconnect, all API calls rejected | BlockedNotice.jsx, authMiddleware.js |

---

## ⚡ Performance Optimizations

| Optimization | Technique | Impact |
|-------------|-----------|--------|
| Lazy Image Loading | loading="lazy" + onLoad shimmer + IntersectionObserver | No eager image loading |
| Skeleton UI | AuctionCardSkeleton, SkeletonRow animate-pulse | No layout shift |
| Next Image Preload | new Image().src = nextSlide.url on slide change | Instant slide transitions |
| MongoDB Indexes | 15 compound+single indexes across 4 collections | Query optimization |
| .lean() Queries | All read-only controllers use .lean() | 3-5x faster, less memory |
| Parallel Queries | Promise.all for data + count + summary | Halved DB round trips |
| DB-Level Pagination | skip/limit at cursor, hard cap 50 | No memory array dumps |
| React.memo | AuctionCard, BidHistory, CountdownTimer with custom comparators | Prevents cascade re-renders |
| useCallback | Event handlers in AuctionList | Stable references to child components |
| useMemo | Filtered/sorted auction arrays | Recompute only on dependency change |
| Connection Pooling | maxPoolSize: 10, minPoolSize: 2 | Handle concurrent requests |
| Text Index Search | MongoDB $text instead of $regex | Faster title search at scale |
| Lean Auth Check | authMiddleware selects 7 fields only + .lean() | Minimal per-request overhead |

---

## 🔧 Edge Cases Handled

| Edge Case | Solution | Files |
|-----------|----------|-------|
| Stale JWT bypass | authMiddleware fresh DB fetch on every request + socket io.use() | authMiddleware.js, socketHandler.js |
| Concurrent bid race condition | findOneAndUpdate with $lt + $expr atomic guard. Returns 409 Conflict. UI auto-updates input. | bidController.js, useBid.js |
| Ghost socket connections | userRooms Map tracks all rooms per socket. Comprehensive disconnect cleanup. viewerUpdate on leave. pingTimeout: 20s. | socketHandler.js |
| Blocked user mid-session | authMiddleware rejects all requests. Socket disconnected at handshake. BlockedNotice shown. | authMiddleware.js, socket.js, BlockedNotice.jsx |
| Seller suspended after active socket | socket io.use() checks isBlocked on connect. placeBid re-validates user from DB. | socketHandler.js |
| Token reuse after logout | TokenBlacklist with SHA-256 hash + TTL index. Checked in both HTTP + socket auth. | TokenBlacklist.js, authMiddleware.js |
| Session expiry mid-use | tokenExpiresAt checked before every request. 5-min warning. auth:expired auto-logout. | AuthContext.jsx, authApi.js |
| File upload abuse | Multer: 5MB limit, 5 files max, mimetype + extension check, filename sanitization. | multer.js |
| Bid input conflict | 409 response auto-refetches auction, updates input minimum, shows friendly toast. | useBid.js, AuctionRoom.jsx |

---

## ⚙️ Environment Variables

### backend/.env

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| PORT | 5000 | Yes | Express server port |
| MONGO_URI | mongodb://127.0.0.1:27017/auction-system | Yes | MongoDB connection string |
| JWT_SECRET | change_this_secret | Yes | JWT signing key (min 32 chars in prod) |
| JWT_EXPIRES_IN | 7d | Yes | Token expiry (7d, 24h, etc.) |
| CLIENT_URL | http://localhost:5173 | Yes | Frontend origin for CORS |
| NODE_ENV | development | Yes | development or production |
| CLOUDINARY_CLOUD_NAME | your_cloud | Yes | Cloudinary account name |
| CLOUDINARY_API_KEY | 123456789 | Yes | Cloudinary API key |
| CLOUDINARY_API_SECRET | abc123xyz | Yes | Cloudinary API secret |

### frontend/.env

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| VITE_API_URL | http://localhost:5000/api | Yes | Backend API base URL |
| VITE_SOCKET_URL | http://localhost:5000 | Yes | Socket.io server URL |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- MongoDB running locally on port 27017 OR MongoDB Atlas URI
- Cloudinary account (free tier sufficient)
- Git

### Installation

```bash
# Clone
git clone https://github.com/Sourabhtripathi1/Real-time-auction-system.git
cd Real-time-auction-system

# Install all dependencies at once
npm run install:all
```

### Configuration

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in: MONGO_URI, JWT_SECRET, 
#          CLOUDINARY_* credentials

# Frontend
cp frontend/.env.example frontend/.env
# Defaults work for local development
```

### Seed Database

```bash
npm run seed
```

Seed accounts:

| Role | Email | Password | sellerStatus |
|------|-------|----------|--------------|
| Admin | admin@auction.com | admin123 | N/A |
| Seller | seller@auction.com | seller123 | authorized |
| Bidder | bidder@auction.com | bidder123 | N/A |
| Bidder | sourabh@gmail.com | sourabh123 | N/A |

> ⚠️ Running seed CLEARS all existing data and uploads fresh images to your Cloudinary account.

### Run

```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000/api
# Health:   http://localhost:5000/health
```

---

## 📜 Scripts Reference

```bash
# From root:
npm run dev          # Frontend + backend concurrently
npm run server       # Backend only (nodemon)
npm run client       # Frontend only (Vite)
npm run build        # Production frontend build
npm run seed         # Seed database + Cloudinary
npm run install:all  # Install all three packages

# From backend/:
npm run dev          # nodemon server.js
npm run start        # node server.js (production)
npm run seed         # node seed.js
```

---

## ⚙️ How It Works

### Bid Placement Flow
```
Bidder submits bid amount
  → POST /api/bids/place (rate limited: 20/min/user)
  → authMiddleware: fresh DB user fetch + blacklist check
  → Pre-validation: auction active, not seller, not blocked
  → Atomic findOneAndUpdate with conditions:
      status: "active"
      currentHighestBid: { $lt: bidAmount }
      $expr: bidAmount >= currentHighestBid + minIncrement
  → If null (race condition): return 409 Conflict
      → UI: toast "Someone outbid you", refetch, update input
  → If success: 
      → Create Bid document
      → Check anti-snipe: endTime - now <= 10000ms
        → If true: extend endTime +10s, emit "timerExtended"
      → Emit "bidUpdated" to auction_${id} room
      → All clients update instantly, card flashes indigo
```

### Seller Authorization Flow
```
1. User registers as "seller" → sellerStatus: "unverified"
2. Dashboard shows SellerStatusBanner (apply button)
3. Seller fills 3-step SellerApplicationModal
4. Submit → sellerStatus: "pending_review"
5. Admin sees count badge on "Manage Sellers" tab
6. Admin views SellerDetailModal → clicks Authorize/Reject
7. On Authorize → sellerStatus: "authorized"
   → Seller polls status every 30s (if pending)
   → Toast: "Your account is now authorized!"
   → Create Auction button unlocks
8. On Reject → sellerStatus: "rejected" + reason stored
   → Seller sees rejection reason in banner
   → Can edit profile and reapply
```

### Image Upload Flow
```
Seller creates/edits auction
  → Frontend: validate ≤5 files, ≤5MB, jpg/png/webp
  → FormData → POST /api/auctions/create
  → rateLimitMiddleware: 30 uploads/hr
  → multer.js: mimetype + extension + filename checks
  → CloudinaryStorage: upload to auction-system/auctions
  → Transform: 1200×800 limit, auto quality, auto format
  → Store: [{ url, publicId }] in Auction.images
  → On update: Promise.all deleteFromCloudinary for old images
  → On delete: purge all images + auction + bids + watchlists
```

### Socket Events
- `joinAuction`: Client joins room, triggering viewerList (to client) and viewerUpdate (to room).
- `leaveAuction`: Client leaves room, triggering viewerUpdate.
- `bidUpdated`: Server broadcasts new highest bid.
- `timerExtended`: Server broadcasts anti-snipe time extension.
- `auctionEnded`: Server broadcasts winner and final bid.
- `viewerUpdate`: Server broadcasts updated viewer count/list.
- `viewerList`: Server sends current viewers (with avatars) to joining client.
- `activeBidders`: Server broadcasts bidders active in the last 60s.
- `auctionEndingSoon`: Server broadcasts when < 5 mins left.
- `newNotification`: Server pushes in-app notification to `user_${id}` room.

### Live Engagement Flow
```
User joins auction room
  → Socket joins `auction_${id}`
  → Server fetches user details (name, avatar)
  → Server emits `viewerList` to joined user
  → Server broadcasts `viewerUpdate` to all room members
  
User places bid
  → REST API processes bid
  → Server updates `activeBidders` Map
  → Server broadcasts `activeBidders` to all room members
  → If time < 5 mins and wasn't previously:
      → Server broadcasts `auctionEndingSoon`
      → Server creates `auction_ending_soon` Notification for all viewers
```

---

## ⚠️ Known Limitations

- **No horizontal Socket.io scaling:** Requires Redis adapter for multi-server deployment. Current setup: single-server only.
- **JWT in localStorage:** XSS risk (mitigated by input sanitization, security headers, Content Security Policy).
- **No email notifications:** No email sent for auction events, bid results, or seller status changes.
- **No payment integration:** Auction winners are determined but no payment flow exists.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit: `git commit -m 'Add feature'`
4. Push: `git push origin feature/name`
5. Open Pull Request

---

## 📄 License

ISC License — see LICENSE file for details.

---
<p align="center">
  Built with ❤️ using MERN Stack + Socket.IO + Cloudinary
</p>
