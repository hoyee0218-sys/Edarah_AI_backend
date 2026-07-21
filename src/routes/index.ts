import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import guestsRoutes from '../modules/guests/guests.routes.js';
import roomsRoutes from '../modules/rooms/rooms.routes.js';
import reservationsRoutes from '../modules/reservations/reservations.routes.js';
import stayRoutes from '../modules/stay/stay.routes.js';
import billingRoutes from '../modules/billing/billing.routes.js';
import reportsRoutes from '../modules/reports/reports.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Edarah AI API is running' });
});

router.use('/auth', authRoutes);
router.use('/guests', guestsRoutes);
router.use('/rooms', roomsRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/stays', stayRoutes);
router.use('/billing', billingRoutes);
router.use('/reports', reportsRoutes);

export default router;
