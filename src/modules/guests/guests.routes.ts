import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as controller from './guests.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
