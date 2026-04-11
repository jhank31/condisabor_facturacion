// src/routes/clientes.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import {
  validarCrearCliente,
  validarActualizarCliente,
  validarQueryClientes,
} from '../validators/clientes.validators.js';
import {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
} from '../controllers/clientes.controller.js';

const router = Router();

// GET /api/clientes — todos los roles
router.get(
  '/',
  authenticate,
  requireRole('admin', 'gestor', 'auditor'),
  validarQueryClientes,
  validate,
  listarClientes
);

// GET /api/clientes/:id — todos los roles
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'gestor', 'auditor'),
  obtenerCliente
);

// POST /api/clientes — admin y gestor
router.post(
  '/',
  authenticate,
  requireRole('admin', 'gestor'),
  validarCrearCliente,
  validate,
  crearCliente
);

// PATCH /api/clientes/:id — admin y gestor
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'gestor'),
  validarActualizarCliente,
  validate,
  actualizarCliente
);

// DELETE /api/clientes/:id — solo admin (soft delete)
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  desactivarCliente
);

export default router;
