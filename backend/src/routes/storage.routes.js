// src/routes/storage.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { getUrlAdjunto } from '../controllers/storage.controller.js';

const router = Router();

// GET /api/storage/facturas/:factura_id/adjunto
router.get(
  '/facturas/:factura_id/adjunto',
  authenticate,
  requireRole('admin', 'gestor', 'auditor'),
  getUrlAdjunto
);

export default router;
