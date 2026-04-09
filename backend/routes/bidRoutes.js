import express from 'express';
import { placeBid, getBidsByAuction } from '../controllers/bidController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/place', protect, authorizeRoles('bidder'), placeBid);
router.get('/:auctionId', getBidsByAuction);

export default router;
