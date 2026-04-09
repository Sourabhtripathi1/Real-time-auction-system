import express from 'express';
import {
  createAuction,
  getLiveAuctions,
  getAuctionById,
  approveAuction,
  getPendingAuctions,
  getMyAuctions,
} from '../controllers/auctionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/create', protect, authorizeRoles('seller'), upload.array('images', 10), createAuction);
router.get('/live', getLiveAuctions);
router.get('/pending', protect, authorizeRoles('admin'), getPendingAuctions);
router.get('/mine', protect, authorizeRoles('seller'), getMyAuctions);
// Make sure :id is after specific string routes
router.get('/:id', getAuctionById);
router.patch('/:id/approve', protect, authorizeRoles('admin'), approveAuction);

export default router;
