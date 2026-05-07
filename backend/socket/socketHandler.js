import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import Auction from "../models/Auction.js";
import AuctionView from "../models/AuctionView.js";
import AuctionMetrics from "../models/AuctionMetrics.js";
import { logUserJoinedAuction } from "../services/activityService.js";

export const activeBidders = new Map();

setInterval(() => {
  const now = Date.now();
  activeBidders.forEach((bidders, auctionId) => {
    bidders.forEach((data, userId) => {
      if (now - data.lastBidTime > 60000) {
        bidders.delete(userId);
      }
    });
    if (bidders.size === 0) {
      activeBidders.delete(auctionId);
    }
  });
}, 10000);

// ── Module-level Maps for connection tracking ──────────────
// Maps socket.id → Set of auctionIds the socket has joined
const userRooms = new Map();

// Maps userId (string) → count of active socket connections
// Prevents abuse from tab duplication or runaway client code
const userConnectionCount = new Map();

// ── Helper: fresh user validation from DB ──────────────────
// Used on every sensitive socket event to prevent stale sessions
async function getValidUser(userId) {
  return User.findById(userId)
    .select("_id name profileImage role isBlocked sellerStatus")
    .lean();
}

// ── Helper: broadcast updated viewer count to a room ───────
function getViewerList(io, auctionId) {
  const room = io.sockets.adapter.rooms.get(`auction_${auctionId}`);
  const viewers = [];
  if (room) {
    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket?.user) {
        // Prevent duplicates if user has multiple tabs open
        if (
          !viewers.some((v) => v.id.toString() === socket.user._id.toString())
        ) {
          viewers.push({
            id: socket.user._id,
            name: socket.user.name,
            profileImage: socket.user.profileImage,
          });
        }
      }
    }
  }
  return viewers;
}

function broadcastViewerCount(io, auctionId) {
  const viewers = getViewerList(io, auctionId);
  io.to(`auction_${auctionId}`).emit("viewerUpdate", {
    auctionId,
    viewers,
    count: viewers.length,
  });
}

const socketHandler = (io) => {
  // ── Socket-level Auth Middleware ───────────────────────────
  // Runs on EVERY new connection attempt — before io.on("connection")
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("AUTH_REQUIRED: Authentication token missing"));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
          issuer: "auction-system",
          audience: "auction-client",
        });
      } catch (jwtError) {
        if (jwtError.name === "TokenExpiredError") {
          return next(
            new Error("AUTH_EXPIRED: Session expired. Please login again."),
          );
        }
        return next(new Error("AUTH_INVALID: Invalid token"));
      }

      // Check blacklist
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const isBlacklisted = await TokenBlacklist.findOne({ tokenHash }, "_id", {
        lean: true,
      });

      if (isBlacklisted) {
        return next(new Error("AUTH_BLACKLISTED: Token invalidated"));
      }

      // Fresh DB check — blocks revoked/suspended users at connection time
      const user = await User.findById(decoded.id)
        .select("_id name profileImage role isBlocked sellerStatus")
        .lean();

      if (!user) {
        return next(new Error("AUTH_NOTFOUND: User not found"));
      }

      if (user.isBlocked) {
        return next(new Error("AUTH_BLOCKED: Account is blocked"));
      }

      if (user.role === "seller" && user.sellerStatus === "suspended") {
        return next(new Error("Account is suspended"));
      }

      // Track connection count per user (allow up to 5 concurrent tabs)
      const userId = user._id.toString();
      const currentConnections = userConnectionCount.get(userId) || 0;
      if (currentConnections >= 5) {
        return next(new Error("Too many connections"));
      }
      userConnectionCount.set(userId, currentConnections + 1);
      socket.userId = userId;

      // Attach fresh user to socket for use in event handlers
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `[Socket] Connected: ${socket.id} | User: ${socket.user?._id || "unknown"}`,
    );

    // ── Join user's personal room for notifications ──────────
    const userId = socket.user?._id?.toString();
    if (userId) {
      socket.join(`user_${userId}`);
    }

    // ── Join / Leave Global Activity Feed ────────────────────
    socket.on("joinGlobalFeed", () => {
      socket.join("global_activity");
      console.log(
        `[Socket] User ${socket.user?._id} joined global_activity feed`,
      );
    });

    socket.on("leaveGlobalFeed", () => {
      socket.leave("global_activity");
    });

    // ── Join Auction Room ────────────────────────────────────
    socket.on("joinAuction", async ({ auctionId, source = "direct" }) => {
      if (!auctionId) return;

      // Re-validate user on join (may have been blocked since connect)
      const user = await getValidUser(socket.user?._id);
      if (!user || user.isBlocked) {
        socket.emit("authError", { message: "Access denied." });
        socket.disconnect(true);
        return;
      }

      socket.join(`auction_${auctionId}`);

      // Track which rooms this socket is in
      if (!userRooms.has(socket.id)) {
        userRooms.set(socket.id, new Set());
      }
      userRooms.get(socket.id).add(auctionId);

      console.log(`[Socket] ${socket.id} joined auction_${auctionId}`);

      const viewers = getViewerList(io, auctionId);
      socket.emit("viewerList", {
        auctionId,
        viewers,
        count: viewers.length,
      });

      // Broadcast updated viewer count to all room members
      broadcastViewerCount(io, auctionId);

      // Log user joined auction activity (fire-and-forget)
      Auction.findById(auctionId)
        .select("title")
        .lean()
        .then((auction) => {
          if (auction) {
            logUserJoinedAuction({
              userId: socket.user._id,
              auctionId,
              auctionTitle: auction.title,
            }).catch((e) =>
              console.error("[Socket] Activity log (join) failed:", e.message),
            );
          }
        })
        .catch(() => {});

      // Record view and update metrics
      try {
        await AuctionView.recordView({
          auctionId,
          userId: socket.user._id,
          source: source,
          sessionDuration: 0,
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers["user-agent"],
        });
        await AuctionMetrics.updateMetricsForAuction(auctionId);
      } catch (e) {
        console.error("[Socket] Record view failed:", e.message);
      }
    });

    // ── Leave Auction Room ───────────────────────────────────
    socket.on("leaveAuction", ({ auctionId }) => {
      if (!auctionId) return;

      socket.leave(`auction_${auctionId}`);

      if (userRooms.has(socket.id)) {
        userRooms.get(socket.id).delete(auctionId);
      }

      console.log(`[Socket] ${socket.id} left auction_${auctionId}`);

      // Broadcast updated viewer count after leave
      broadcastViewerCount(io, auctionId);

      // Update session duration and metrics
      if (socket.user?._id) {
        AuctionView.findOne({
          auction: auctionId,
          user: socket.user._id,
        })
          .sort({ viewedAt: -1 })
          .then(async (view) => {
            if (view) {
              const sessionDuration =
                (Date.now() - new Date(view.viewedAt).getTime()) / 1000;
              view.sessionDuration += sessionDuration;
              await view.save();
              await AuctionMetrics.updateMetricsForAuction(auctionId);
            }
          })
          .catch((e) =>
            console.error(
              "[Socket] Update session duration failed:",
              e.message,
            ),
          );
      }
    });

    // ── Disconnect — Comprehensive Cleanup ───────────────────
    //
    // Common disconnect reasons:
    // "transport close"           — user closed tab/browser
    // "transport error"           — network issue
    // "ping timeout"              — server didn't receive ping
    // "server namespace disconnect" — server kicked user
    // "client namespace disconnect" — client called disconnect()
    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket] Disconnected: ${socket.id} | Reason: ${reason} | User: ${
          socket.user?._id || "unauthenticated"
        }`,
      );

      // ── Decrement connection count ─────────────────────────
      const userId = socket.userId;
      if (userId) {
        const count = userConnectionCount.get(userId) || 1;
        if (count <= 1) {
          userConnectionCount.delete(userId);
        } else {
          userConnectionCount.set(userId, count - 1);
        }
      }

      // ── Broadcast updated viewer counts to all vacated rooms ─
      const rooms = userRooms.get(socket.id);
      if (rooms && rooms.size > 0) {
        rooms.forEach((auctionId) => {
          // Small delay to let socket.io fully process the leave
          // before we query the room size
          setTimeout(() => {
            broadcastViewerCount(io, auctionId);
            console.log(
              `[Socket] Viewer count updated for auction_${auctionId}`,
            );
          }, 100);
        });
      }

      // ── Clean up tracking maps ─────────────────────────────
      userRooms.delete(socket.id);
    });
  });
};

export default socketHandler;
