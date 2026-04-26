import mongoose from "mongoose";

/**
 * verifyIndexes
 *
 * Logs all indexes for the four main collections.
 * Only runs in development mode — zero performance impact in production.
 * Call once after connectDB() in server.js.
 *
 * Usage in server.js:
 *   import { verifyIndexes } from "./config/dbIndexes.js";
 *   connectDB().then(() => verifyIndexes());
 */
export async function verifyIndexes() {
  if (process.env.NODE_ENV !== "development") return;

  try {
    const collections = ["auctions", "users", "bids", "watchlists"];

    console.log("\n📊 MongoDB Index Verification:");
    console.log("─".repeat(50));

    for (const col of collections) {
      // Wait for the collection to exist (Mongoose may still be syncing)
      const db = mongoose.connection.db;
      if (!db) {
        console.warn(`  ⚠ DB not ready, skipping ${col}`);
        continue;
      }

      const indexes = await db.collection(col).indexes();
      console.log(`\n  Collection: [${col}] — ${indexes.length} index(es)`);
      indexes.forEach((idx) => {
        const keyStr = JSON.stringify(idx.key);
        const flags = [
          idx.unique ? "unique" : "",
          idx.sparse ? "sparse" : "",
          idx.text ? "text" : "",
          idx.name !== "_id_" ? idx.name : "",
        ]
          .filter(Boolean)
          .join(", ");
        console.log(`    • ${keyStr}${flags ? `  (${flags})` : ""}`);
      });
    }

    console.log("\n" + "─".repeat(50) + "\n");
  } catch (err) {
    console.error("⚠ Index verification failed:", err.message);
  }
}
