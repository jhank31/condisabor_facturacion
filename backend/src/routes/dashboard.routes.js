// src/routes/dashboard.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  getKpis,
  getMora,
  getCartera,
  getCobrosMensuales,
} from '../controllers/dashboard.controller.js';

const router = Router();
// Todos los endpoints del dashboard requieren estar autenticado con cualquier rol
router.use(authenticate, requireRole('admin', 'gestor', 'auditor'));

// GET /api/dashboard/kpis
router.get('/kpis', getKpis);

// GET /api/dashboard/mora
router.get('/mora', getMora);

// GET /api/dashboard/cartera
router.get('/cartera', getCartera);

// GET /api/dashboard/cobros-mensuales
router.get('/cobros-mensuales', getCobrosMensuales);

export default router;
