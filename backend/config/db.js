import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // ── Connection Pool ──────────────────────────────────────
      // Under high concurrent load, MongoDB driver reuses connections from the pool
      // instead of creating new ones. Keeps response times consistent.
      maxPoolSize: 10,    // Max 10 simultaneous connections
      minPoolSize: 2,     // Keep 2 connections warm (ready) at all times

      // ── Timeouts ─────────────────────────────────────────────
      serverSelectionTimeoutMS: 5000,   // 5s: fail fast if MongoDB not reachable
      socketTimeoutMS: 45000,           // 45s: max time for a single operation
      connectTimeoutMS: 10000,          // 10s: max time for initial TCP connect
      heartbeatFrequencyMS: 10000,      // 10s: check connection health periodically

      // ── Buffer control ───────────────────────────────────────
      // false = fail fast if DB not connected, rather than queuing commands.
      // Better for detecting connection issues early in production.
      bufferCommands: false,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// ── Connection event listeners ─────────────────────────────
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting reconnect...");
});

// ── Graceful shutdown ──────────────────────────────────────
// Close DB connection cleanly before process exits so in-flight
// operations complete and no data is corrupted.

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed (SIGTERM)");
  process.exit(0);
});

export default connectDB;
