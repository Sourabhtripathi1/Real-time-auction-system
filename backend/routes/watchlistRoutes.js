import express from 'express';
import {
  addToWatchlist,
  getMyWatchlist,
  removeFromWatchlist,
} from '../controllers/watchlistController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All watchlist routes require authentication
router.use(protect);
router.use(authorizeRoles('bidder'));

router.post('/add', addToWatchlist);
router.get('/my', getMyWatchlist);
router.delete('/:auctionId', removeFromWatchlist);

export default router;
