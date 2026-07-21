import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as controller from './billing.controller.js';

const router = Router();

router.use(authenticate);
router.get('/invoices', controller.list);
router.get('/invoices/:id', controller.getById);

export default router;
