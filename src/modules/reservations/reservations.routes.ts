import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as controller from './reservations.controller.js';

const router = Router();

router.use(authenticate);
router.get('/availability', controller.availability);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.post('/:id/cancel', controller.cancel);

export default router;
