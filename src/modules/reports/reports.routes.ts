import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as controller from './reports.controller.js';

const router = Router();

router.use(authenticate);
router.get('/dashboard', controller.dashboard);
router.get('/occupancy', controller.occupancy);
router.get('/revenue', controller.revenue);

export default router;
