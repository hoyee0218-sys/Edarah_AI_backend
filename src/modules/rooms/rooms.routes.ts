import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as controller from './rooms.controller.js';

const router = Router();

router.use(authenticate);
router.get('/types', controller.listTypes);
router.post('/types', controller.createType);
router.delete('/types/:id', controller.removeType);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.remove);

export default router;
