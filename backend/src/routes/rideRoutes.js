import express from 'express';
import { postRide, searchRides, getRideDetails, updateRideStatus, cancelRide } from '../controllers/rideController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All ride routes are protected

router.post('/', postRide);
router.get('/search', searchRides);
router.get('/:id', getRideDetails);
router.put('/:id/status', updateRideStatus);
router.put('/:id/cancel', cancelRide);

export default router;
