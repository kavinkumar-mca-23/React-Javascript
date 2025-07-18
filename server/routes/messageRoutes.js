// routes/messageRoutes.js
import express from 'express';
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  forwardMessage
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:userId', authenticateToken, getMessages);
router.post('/', authenticateToken, sendMessage);
router.put('/:id/edit', authenticateToken, editMessage);
router.delete('/:id', authenticateToken, deleteMessage);
router.post('/:id/forward', authenticateToken, forwardMessage);

export default router;