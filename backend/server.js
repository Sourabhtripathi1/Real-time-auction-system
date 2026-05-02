import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { verifyIndexes } from "./config/dbIndexes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import Auction from "./models/Auction.js";
import Bid from "./models/Bid.js";
import Watchlist from "./models/Watchlist.js";
import User from "./models/User.js";
import socketHandler from "./socket/socketHandler.js";
import authRoutes from "./routes/authRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import {
  notifyAuctionStart,
  notifyAuctionEnd,
} from "./services/notificationService.js";
import {
  apiRateLimiter,
  authRateLimiter,
} from "./middleware/rateLimitMiddleware.js";

// ── Process-level error safety nets ───────────────────────
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION — shutting down:", err.name, err.message);
  process.exit(1);
});

// ── Connect to Database ───────────────────────────────────────
connectDB();

// Verify indexes in development (no-op in production)
if (process.env.NODE_ENV !== "production") {
  // Slight delay to let Mongoose finish syncing indexes before we query them
  setTimeout(verifyIndexes, 3000);
}

const app = express();
const httpServer = createServer(app);

// ── Socket.IO setup ────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Heartbeat config: detects dead connections within ~30 seconds
  // Dead connections waste server memory and give wrong viewer counts
  pingTimeout: 20000,    // 20s — how long to wait for pong before disconnect
  pingInterval: 10000,   // 10s — how often to send ping
  connectTimeout: 10000, // 10s — max time to establish connection
  transports: ["websocket", "polling"], // websocket preferred, polling as fallback
  upgradeTimeout: 10000,
});

app.set("io", io);
global.io = io; // Expose io to notificationService
socketHandler(io);

// ── Security Headers ───────────────────────────────────────
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // XSS protection (legacy browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Remove Express signature
  res.removeHeader("X-Powered-By");
  next();
});

// ── Global API Rate Limit ──────────────────────────────────
app.use("/api", apiRateLimiter);

// ── HTTP Middleware ────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Files (Uploads) ─────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API Routes ─────────────────────────────────────────────
// Strict limit on auth routes
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);

// ── Auction Status Scheduler ───────────────────────────────
const SCHEDULER_INTERVAL_MS = 60_000;

const runAuctionScheduler = async () => {
  try {
    const now = new Date();

    // Run both activation and ending queries IN PARALLEL
    // Each uses its own compound index: { status, startTime } and { status, endTime }
    // Find auctions that need to activate (for notifications)
    const auctionsToActivate = await Auction.find(
      { status: "approved", startTime: { $lte: now } },
      "_id title",
    ).lean();

    const [activated, auctionsToEnd] = await Promise.all([
      // Activate approved auctions whose startTime has arrived
      // Uses compound index { status: 1, startTime: 1 }
      Auction.updateMany(
        { status: "approved", startTime: { $lte: now } },
        { $set: { status: "active" } },
      ),

      // Find active auctions whose endTime has passed
      // Uses compound index { status: 1, endTime: 1 }
      // .lean() — only reading to emit socket events; no Document methods needed
      Auction.find(
        { status: "active", endTime: { $lte: now } },
        "_id highestBidder currentHighestBid title",
      ).lean(),
    ]);

    if (activated.modifiedCount > 0) {
      console.log(
        `[Scheduler] Activated ${activated.modifiedCount} auction(s)`,
      );

      // ── Notify watchlist users about auction start ──────────
      for (const auction of auctionsToActivate) {
        try {
          const watchlistUserIds = await Watchlist.distinct("user", {
            auction: auction._id,
          });
          if (watchlistUserIds.length > 0) {
            await notifyAuctionStart({
              auctionId: auction._id,
              auctionTitle: auction.title,
              watchlistUserIds,
            });
          }
        } catch (notifErr) {
          console.error(
            `[Scheduler] Notification error for auction ${auction._id}:`,
            notifErr.message,
          );
        }
      }
    }

    if (auctionsToEnd.length > 0) {
      // Bulk update all ended auctions in ONE query
      await Auction.updateMany(
        { _id: { $in: auctionsToEnd.map((a) => a._id) } },
        { $set: { status: "ended" } },
      );

      // Emit auctionEnded + send notifications for each ended auction
      for (const auction of auctionsToEnd) {
        // Resolve winner name for notification message
        let winnerName = null;
        if (auction.highestBidder) {
          const winner = await User.findById(auction.highestBidder)
            .select("name")
            .lean();
          winnerName = winner?.name || null;
        }

        io.to(`auction_${auction._id}`).emit("auctionEnded", {
          auctionId: auction._id,
          winnerId: auction.highestBidder || null,
          winnerName,
          finalBid: auction.currentHighestBid,
        });
        console.log(`[Scheduler] Ended auction: ${auction.title}`);

        // ── Notify winner + all bidders about auction end ─────
        try {
          const allBidderIds = await Bid.distinct("bidder", {
            auction: auction._id,
          });

          await notifyAuctionEnd({
            auctionId: auction._id,
            auctionTitle: auction.title,
            winnerId: auction.highestBidder,
            winnerName,
            finalBid: auction.currentHighestBid,
            allBidderIds,
          });
        } catch (notifErr) {
          console.error(
            `[Scheduler] Notification error for ended auction ${auction._id}:`,
            notifErr.message,
          );
        }
      }
    }
  } catch (err) {
    console.error("[Scheduler] Error:", err.message);
  }
};

// Run once on boot, then every 60s
runAuctionScheduler();
setInterval(runAuctionScheduler, SCHEDULER_INTERVAL_MS);

// ── Global Error Handler (must be LAST middleware) ─────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = httpServer.listen(PORT, () => {
  console.log(
    `\n🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
  console.log(`   API:    http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

process.on("unhandledRejection", (err) => {
  console.error(
    "UNHANDLED REJECTION — shutting down:",
    err?.name,
    err?.message,
  );
  server.close(() => process.exit(1));
});

export default app;
