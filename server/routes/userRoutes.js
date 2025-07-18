// routes/userRoutes.js
import express from 'express';
import { getUsers } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getUsers);

export default router;