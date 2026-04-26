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
  const msg = error.message;

  const handlers = {
    "AUTH_REQUIRED": () => window.dispatchEvent(new CustomEvent("auth:logout")),
    "AUTH_EXPIRED": () => window.dispatchEvent(new CustomEvent("auth:expired")),
    "AUTH_BLACKLISTED": () => window.dispatchEvent(new CustomEvent("auth:logout")),
    "AUTH_NOTFOUND": () => window.dispatchEvent(new CustomEvent("auth:logout")),
    "AUTH_BLOCKED": () => window.dispatchEvent(new CustomEvent("auth:blocked", { detail: { message: "Account is blocked" } })),
    "AUTH_INVALID": () => window.dispatchEvent(new CustomEvent("auth:logout")),
  };

  const matchedKey = Object.keys(handlers).find((key) => msg.startsWith(key));

  if (matchedKey) {
    console.warn(`[Socket] Auth failure on connect (${matchedKey}). Triggering logout/blocked.`);
    handlers[matchedKey]();
    socket.io.opts.reconnection = false;
  } else if (msg === "Too many connections") {
    // Silently fail — don't crash UI, this is a minor edge case
    // (e.g. user has 5+ tabs open)
    console.warn("[Socket] Too many concurrent connections from this client.");
    socket.io.opts.reconnection = false;
  } else {
    console.error("[Socket] Connection error:", msg);
  }
});

socket.on("connect", () => {
  console.log("[Socket] Connected:", socket.id);
  // Re-enable reconnection on successful connect (in case it was disabled)
  socket.io.opts.reconnection = true;
});

export default socket;
