import { Router } from 'express';
import {
  listItems,
  createItem,
  getItem,
  updateItem,
  deleteItem,
  updateItemStatus,
} from '../controllers/itemsController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createItemSchema,
  updateItemSchema,
  updateItemStatusSchema,
} from '../schemas/itemSchemas';

const router = Router();

// All item routes require authentication and verify item ownership
router.use(requireAuth);

router.get('/', listItems);
router.post('/', validate(createItemSchema), createItem);
router.get('/:id', getItem);
router.patch('/:id', validate(updateItemSchema), updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/status', validate(updateItemStatusSchema), updateItemStatus);

export default router;
