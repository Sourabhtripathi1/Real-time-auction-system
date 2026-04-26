import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
    .select("_id isBlocked role sellerStatus")
    .lean();
}

// ── Helper: broadcast updated viewer count to a room ───────
function broadcastViewerCount(io, auctionId) {
  const roomSize =
    io.sockets.adapter.rooms.get(`auction_${auctionId}`)?.size || 0;
  io.to(`auction_${auctionId}`).emit("viewerUpdate", {
    auctionId,
    viewers: roomSize,
  });
}

const socketHandler = (io) => {
  // ── Socket-level Auth Middleware ───────────────────────────
  // Runs on EVERY new connection attempt — before io.on("connection")
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return next(new Error("Invalid or expired token"));
      }

      // Fresh DB check — blocks revoked/suspended users at connection time
      const user = await User.findById(decoded.id)
        .select("_id name role isBlocked sellerStatus")
        .lean();

      if (!user) {
        return next(new Error("User not found"));
      }

      if (user.isBlocked) {
        return next(new Error("Account is blocked"));
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

    // ── Join Auction Room ────────────────────────────────────
    socket.on("joinAuction", async ({ auctionId }) => {
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

      console.log(
        `[Socket] ${socket.id} joined auction_${auctionId}`,
      );

      // Broadcast updated viewer count to all room members
      broadcastViewerCount(io, auctionId);
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
