import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"], // match server config
  withCredentials: true,
});

export const connectSocket = (token) => {
  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// ── Global socket lifecycle handlers ───────────────────────
// These run once for the lifetime of the socket singleton.

socket.on("disconnect", (reason) => {
  console.log("[Socket] Disconnected. Reason:", reason);

  if (reason === "io server disconnect") {
    // Server intentionally kicked us (blocked, auth failure, etc.)
    // Do NOT auto-reconnect — the server made a deliberate decision
    console.warn("[Socket] Server initiated disconnect. Will not auto-reconnect.");
    // socket.io will not auto-reconnect for this reason type
  }
  // For all other reasons ("transport close", "transport error", "ping timeout"):
  // socket.io will automatically attempt reconnection — no action needed here.
});

socket.on("connect_error", (error) => {
  console.error("[Socket] Connection error:", error.message);

  if (
    error.message === "Account is blocked" ||
    error.message === "Account is suspended" ||
    error.message === "Invalid or expired token" ||
    error.message === "User not found"
  ) {
    // Auth failure from socket middleware — trigger logout flow
    console.warn("[Socket] Auth failure on connect. Triggering logout.");
    window.dispatchEvent(
      new CustomEvent("auth:blocked", {
        detail: { message: error.message },
      }),
    );
    // Prevent further reconnect attempts
    socket.io.opts.reconnection = false;
  }

  if (error.message === "Too many connections") {
    // Silently fail — don't crash UI, this is a minor edge case
    // (e.g. user has 5+ tabs open)
    console.warn("[Socket] Too many concurrent connections from this client.");
    socket.io.opts.reconnection = false;
  }
});

socket.on("connect", () => {
  console.log("[Socket] Connected:", socket.id);
  // Re-enable reconnection on successful connect (in case it was disabled)
  socket.io.opts.reconnection = true;
});

export default socket;
