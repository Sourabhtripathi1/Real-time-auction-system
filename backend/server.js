import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import Auction from './models/Auction.js';
import socketHandler from './socket/socketHandler.js';
import authRoutes from './routes/authRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';

// ── Process-level error safety nets ───────────────────────
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION — shutting down:', err.name, err.message);
  process.exit(1);
});

// ── Connect to Database ────────────────────────────────────
connectDB();

const app = express();
const httpServer = createServer(app);

// ── Socket.IO setup ────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
socketHandler(io);

// ── HTTP Middleware ────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Auction Status Scheduler ───────────────────────────────
const SCHEDULER_INTERVAL_MS = 60_000;

const runAuctionScheduler = async () => {
  try {
    const now = new Date();

    // Activate approved auctions whose startTime has arrived
    const activated = await Auction.updateMany(
      { status: 'approved', startTime: { $lte: now } },
      { $set: { status: 'active' } }
    );
    if (activated.modifiedCount > 0) {
      console.log(`[Scheduler] Activated ${activated.modifiedCount} auction(s)`);
    }

    // End active auctions whose endTime has passed
    const auctionsToEnd = await Auction.find({
      status: 'active',
      endTime: { $lte: now },
    }).populate('highestBidder', 'name');

    if (auctionsToEnd.length > 0) {
      await Auction.updateMany(
        { _id: { $in: auctionsToEnd.map((a) => a._id) } },
        { $set: { status: 'ended' } }
      );
      for (const auction of auctionsToEnd) {
        io.to(`auction_${auction._id}`).emit('auctionEnded', {
          auctionId: auction._id,
          winnerId: auction.highestBidder?._id || null,
          winnerName: auction.highestBidder?.name || null,
          finalBid: auction.currentHighestBid,
        });
        console.log(`[Scheduler] Ended auction: ${auction.title}`);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error:', err.message);
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
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`   API:    http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION — shutting down:', err?.name, err?.message);
  server.close(() => process.exit(1));
});

export default app;
