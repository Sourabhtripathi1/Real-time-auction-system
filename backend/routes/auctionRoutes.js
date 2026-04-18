import express from 'express';
import multer from 'multer';
import {
  createAuction,
  getLiveAuctions,
  getAuctionById,
  approveAuction,
  getPendingAuctions,
  getAllAuctions,
  getMyAuctions,
  submitForVerification,
  updateAuction,
  deleteAuction,
} from '../controllers/auctionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles, restrictRoles } from '../middleware/roleMiddleware.js';
import { uploadAuctionImages } from '../config/multer.js';

const router = express.Router();

// Seller routes
router.post('/create', protect, authorizeRoles('seller'), uploadAuctionImages, createAuction);
router.patch('/:id/submit', protect, authorizeRoles('seller'), submitForVerification);
router.patch('/:id', protect, authorizeRoles('seller'), uploadAuctionImages, updateAuction);
router.delete('/:id', protect, authorizeRoles('seller'), deleteAuction);

// Public routes
router.get('/live', restrictRoles('admin', 'seller'), getLiveAuctions);

// Admin routes
router.get('/pending', protect, authorizeRoles('admin'), getPendingAuctions);
router.get('/all',     protect, authorizeRoles('admin'), getAllAuctions);

// Seller routes
router.get('/mine', protect, authorizeRoles('seller'), getMyAuctions);

// Parameterized routes (must be after string routes)
router.get('/:id', getAuctionById);
router.patch('/:id/approve', protect, authorizeRoles('admin'), approveAuction);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Image size must not exceed 5MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, message: err.message || 'Maximum 5 images allowed' });
    }
    return res.status(400).json({ success: false, message: 'File upload error' });
  }
  next(err);
});

export default router;
