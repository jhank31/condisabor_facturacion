// src/routes/pagos.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import {
  validarCrearPago,
  validarParamFacturaId,
  validarAbonoGeneral,
  validarPagoMultiple,
} from '../validators/pagos.validators.js';
import {
  registrarPago,
  listarPagosPorFactura,
  abonoGeneral,
  pagoMultiple,
} from '../controllers/pagos.controller.js';

const router = Router();

// POST /api/pagos
router.post(
  '/',
  authenticate,
  requireRole('admin', 'gestor'),
  validarCrearPago,
  validate,
  registrarPago
);

// POST /api/pagos/abono-general
router.post(
  '/abono-general',
  authenticate,
  requireRole('admin', 'gestor'),
  validarAbonoGeneral,
  validate,
  abonoGeneral
);

// POST /api/pagos/pago-multiple
router.post(
  '/pago-multiple',
  authenticate,
  requireRole('admin', 'gestor'),
  validarPagoMultiple,
  validate,
  pagoMultiple
);

// GET /api/pagos/factura/:factura_id
router.get(
  '/factura/:factura_id',
  authenticate,
  requireRole('admin', 'gestor', 'auditor'),
  validarParamFacturaId,
  validate,
  listarPagosPorFactura
);

export default router;
