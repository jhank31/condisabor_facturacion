// src/routes/auth.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { login, refresh, logout, me } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/login — pública
router.post('/login', login);

// POST /api/auth/refresh — pública
router.post('/refresh', refresh);

// POST /api/auth/logout — requiere auth
router.post('/logout', authenticate, logout);

// GET /api/auth/me — requiere auth
router.get('/me', authenticate, me);

export default router;
