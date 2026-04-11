// src/routes/usuarios.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
} from '../controllers/usuarios.controller.js';

const router = Router();
// Todos los endpoints de usuarios requieren rol admin
router.use(authenticate, requireRole('admin'));

// GET /api/usuarios
router.get('/', listarUsuarios);

// POST /api/usuarios
router.post('/', crearUsuario);

// PATCH /api/usuarios/:id
router.patch('/:id', actualizarUsuario);

export default router;
