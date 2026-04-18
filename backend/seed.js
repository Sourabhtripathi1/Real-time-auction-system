/**
 * Seed script — populates the database with test users and auctions with Cloudinary images.
 * Run: npm run seed  (from root)  OR  node seed.js  (from backend/)
 */

import "dotenv/config";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import User from "./models/User.js";
import Auction from "./models/Auction.js";
import Bid from "./models/Bid.js";
import Watchlist from "./models/Watchlist.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadSampleImages() {
  console.log("⬆️  Uploading 3 sample images to Cloudinary...");
  const imageUrls = [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80",
  ];

  const uploaded = [];
  for (const url of imageUrls) {
    try {
      const res = await cloudinary.uploader.upload(url, {
        folder: "auction-system",
      });
      uploaded.push({ url: res.secure_url, publicId: res.public_id });
    } catch (err) {
      console.error("Cloudinary upload failed for", url, err);
    }
  }
  return uploaded;
}

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // ── Clear existing data ────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      Auction.deleteMany({}),
      Bid.deleteMany({}),
      Watchlist.deleteMany({}),
    ]);
    console.log("🗑  Cleared existing data");

    // ── Create users ───────────────────────────────────────
    var users = [
      {
        name: "Admin",
        email: "admin@auction.com",
        password: "admin123",
        role: "admin",
      },
      {
        name: "Seller",
        email: "seller@auction.com",
        password: "seller123",
        role: "seller",
        sellerStatus: "authorized",
        sellerAppliedAt: new Date(),
        sellerStatusUpdatedAt: new Date(),
        sellerProfile: {
          businessName: "Seller Store",
          businessType: "individual",
          description: "Seeded test seller with authorized status.",
        },
      },
      {
        name: "Bidder",
        email: "bidder@auction.com",
        password: "bidder123",
        role: "bidder",
      },
      {
        name: "Sourabh",
        email: "sourabh@gmail.com",
        password: "sourabh123",
        role: "bidder",
      },
    ];

    const [admin, seller, bidder] = await User.create(users);
    console.log("👥 Created " + users.length + " users");

    // Get images
    const sampleImages = await uploadSampleImages();
    if (sampleImages.length === 0) {
      console.error(
        "❌ Failed to upload any images. Check your Cloudinary credentials in .env",
      );
      process.exit(1);
    }

    // ── Create auctions ────────────────────────────────────
    const now = new Date();
    const auctionsToInsert = [];

    // Create 10 active auctions
    for (let i = 1; i <= 10; i++) {
      auctionsToInsert.push({
        title: `Active Auction ${i} - Premium Item`,
        description: `This is active auction number ${i}. Features premium quality and excellent condition. Complete set included.`,
        images: sampleImages,
        seller: seller._id,
        basePrice: 5000 * i,
        currentHighestBid: 5000 * i,
        highestBidder: null,
        minIncrement: 500 * i,
        startTime: new Date(now.getTime() - i * 60 * 60 * 1000), // started hours ago
        endTime: new Date(now.getTime() + i * 2 * 60 * 60 * 1000), // ends in hours
        status: "active",
        approvedBy: admin._id,
      });
    }

    // Create 1 of each other status
    auctionsToInsert.push({
      title: "Inactive Draft Auction - Not Submitted yet",
      description:
        "This is a draft auction that the seller is still working on. It hasn't been submitted to admin.",
      images: sampleImages,
      seller: seller._id,
      basePrice: 20000,
      currentHighestBid: 20000,
      minIncrement: 1000,
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 10 * 60 * 60 * 1000),
      status: "inactive",
    });

    auctionsToInsert.push({
      title: "Pending Approval Auction - Waiting for Admin",
      description:
        "Seller has submitted this auction and it is waiting for an admin to review it.",
      images: sampleImages,
      seller: seller._id,
      basePrice: 35000,
      currentHighestBid: 35000,
      minIncrement: 1500,
      startTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      status: "pending",
    });

    auctionsToInsert.push({
      title: "Approved Upcoming Auction - Starts Soon",
      description:
        "This auction has been approved by the admin and will start soon based on its start time.",
      images: sampleImages,
      seller: seller._id,
      basePrice: 80000,
      currentHighestBid: 80000,
      minIncrement: 2000,
      startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000), // starts in 1 hour
      endTime: new Date(now.getTime() + 15 * 60 * 60 * 1000),
      status: "approved",
      approvedBy: admin._id,
    });

    auctionsToInsert.push({
      title: "Ended Auction - Winner Declared",
      description: "This auction has concluded and cannot be bid on anymore.",
      images: sampleImages,
      seller: seller._id,
      basePrice: 40000,
      currentHighestBid: 55000,
      highestBidder: bidder._id,
      minIncrement: 1000,
      startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // ended 1 hour ago
      status: "ended",
      approvedBy: admin._id,
    });

    auctionsToInsert.push({
      title: "Rejected Auction - Needs Fixes",
      description:
        "The admin has rejected this auction due to insufficient details or inappropriate content.",
      images: sampleImages,
      seller: seller._id,
      basePrice: 15000,
      currentHighestBid: 15000,
      minIncrement: 500,
      startTime: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 20 * 60 * 60 * 1000),
      status: "rejected",
      rejectionReason:
        "Description lacks critical details regarding item condition.",
    });

    const insertedAuctions = await Auction.insertMany(auctionsToInsert);
    console.log(
      `🏷  Created ${insertedAuctions.length} auctions (10 active, 5 varied status)`,
    );

    // ── Seed some bid history on the first active auction ────────
    const activeAuction = insertedAuctions[0];
    await Bid.create([
      {
        auction: activeAuction._id,
        bidder: bidder._id,
        amount: activeAuction.basePrice + activeAuction.minIncrement,
        timestamp: new Date(now.getTime() - 30 * 60 * 1000),
      },
      {
        auction: activeAuction._id,
        bidder: bidder._id,
        amount: activeAuction.basePrice + activeAuction.minIncrement * 2,
        timestamp: new Date(now.getTime() - 10 * 60 * 1000),
      },
    ]);

    // update highest bid
    await Auction.findByIdAndUpdate(activeAuction._id, {
      currentHighestBid:
        activeAuction.basePrice + activeAuction.minIncrement * 2,
      highestBidder: bidder._id,
    });

    console.log("💰 Seeded 2 bids on the first active auction");

    console.log("\n✨ Seed complete!\n");
    console.log("─".repeat(50));
    users.forEach((user) => {
      console.log(`  ${user.email}   → password: ${user.password}`);
    });
    console.log("─".repeat(50));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
