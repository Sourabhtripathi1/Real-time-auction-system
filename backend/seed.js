/**
 * Seed script — populates the database with test users and auctions.
 * Run: npm run seed  (from root)  OR  node seed.js  (from backend/)
 *
 * Users created:
 *   admin@auction.com  / admin123
 *   seller@auction.com / seller123
 *   bidder@auction.com / bidder123
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Auction from './models/Auction.js';
import Bid from './models/Bid.js';
import Watchlist from './models/Watchlist.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── Clear existing data ────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      Auction.deleteMany({}),
      Bid.deleteMany({}),
      Watchlist.deleteMany({}),
    ]);
    console.log('🗑  Cleared existing data');

    // ── Create users ───────────────────────────────────────
    const [admin, seller, bidder] = await User.create([
      {
        name: 'Admin User',
        email: 'admin@auction.com',
        password: 'admin123',
        role: 'admin',
      },
      {
        name: 'Demo Seller',
        email: 'seller@auction.com',
        password: 'seller123',
        role: 'seller',
      },
      {
        name: 'Demo Bidder',
        email: 'bidder@auction.com',
        password: 'bidder123',
        role: 'bidder',
      },
    ]);
    console.log('👥 Created 3 users');

    // ── Create auctions ────────────────────────────────────
    const now = new Date();

    const activeAuction = await Auction.create({
      title: 'Vintage Rolex Submariner 1965',
      description:
        'Rare vintage Rolex Submariner in excellent condition. Original dial, hands, and bezel. Comes with original box and papers. A true collector\'s piece.',
      images: [],
      seller: seller._id,
      basePrice: 150000,
      currentHighestBid: 175000,
      highestBidder: bidder._id,
      minIncrement: 5000,
      startTime: new Date(now.getTime() - 60 * 60 * 1000),    // started 1h ago
      endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),  // ends in 2h
      status: 'active',
      approvedBy: admin._id,
    });

    const approvedAuction = await Auction.create({
      title: 'MacBook Pro M3 Max 16" — Sealed Box',
      description:
        'Brand new MacBook Pro with M3 Max chip, 36GB RAM, 1TB SSD. Factory sealed, all accessories included. International warranty.',
      images: [],
      seller: seller._id,
      basePrice: 200000,
      currentHighestBid: 200000,
      highestBidder: null,
      minIncrement: 2000,
      startTime: new Date(now.getTime() + 30 * 60 * 1000),    // starts in 30 min
      endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),  // ends in 3h
      status: 'approved',
      approvedBy: admin._id,
    });

    const pendingAuction = await Auction.create({
      title: 'Sony A7R V — Mirrorless Camera',
      description:
        'Sony A7R V in mint condition. Includes original box, charger, strap. Shutter count under 2000.',
      images: [],
      seller: seller._id,
      basePrice: 280000,
      currentHighestBid: 280000,
      highestBidder: null,
      minIncrement: 3000,
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      status: 'pending',
    });

    console.log('🏷  Created 3 auctions (1 active, 1 approved, 1 pending)');

    // ── Seed some bid history on the active auction ────────
    await Bid.create([
      {
        auction: activeAuction._id,
        bidder: bidder._id,
        amount: 155000,
        timestamp: new Date(now.getTime() - 50 * 60 * 1000),
      },
      {
        auction: activeAuction._id,
        bidder: bidder._id,
        amount: 165000,
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
      },
      {
        auction: activeAuction._id,
        bidder: bidder._id,
        amount: 175000,
        timestamp: new Date(now.getTime() - 10 * 60 * 1000),
      },
    ]);
    console.log('💰 Seeded 3 bids on the active auction');

    console.log('\n✨ Seed complete!\n');
    console.log('─'.repeat(50));
    console.log('  admin@auction.com   → password: admin123');
    console.log('  seller@auction.com  → password: seller123');
    console.log('  bidder@auction.com  → password: bidder123');
    console.log('─'.repeat(50));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
