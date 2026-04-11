import express from 'express';
import {
  createAuction,
  getLiveAuctions,
  getAuctionById,
  approveAuction,
  getPendingAuctions,
  getMyAuctions,
  submitForVerification,
  updateAuction,
  deleteAuction,
} from '../controllers/auctionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Seller routes
router.post('/create', protect, authorizeRoles('seller'), upload.array('images', 10), createAuction);
router.patch('/:id/submit', protect, authorizeRoles('seller'), submitForVerification);
router.patch('/:id', protect, authorizeRoles('seller'), upload.array('images', 10), updateAuction);
router.delete('/:id', protect, authorizeRoles('seller'), deleteAuction);

// Public routes
router.get('/live', getLiveAuctions);

// Admin routes
router.get('/pending', protect, authorizeRoles('admin'), getPendingAuctions);

// Seller routes  
router.get('/mine', protect, authorizeRoles('seller'), getMyAuctions);

// Parameterized routes (must be after string routes)
router.get('/:id', getAuctionById);
router.patch('/:id/approve', protect, authorizeRoles('admin'), approveAuction);

export default router;
