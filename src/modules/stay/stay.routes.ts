import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as controller from './stay.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/check-in', controller.checkIn);
router.patch('/:id/notes', controller.updateNotes);
router.post('/:id/charges', controller.addCharge);
router.get('/:id/bill', controller.calculate);
router.post('/:id/check-out', controller.checkOut);

export default router;
