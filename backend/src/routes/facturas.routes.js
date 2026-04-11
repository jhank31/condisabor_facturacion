// src/routes/facturas.routes.js
// Las rutas de creación de facturas usan multer para recibir el PDF opcional.

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import {
  validarCrearFactura,
  validarActualizarFactura,
  validarQueryFacturas,
} from '../validators/facturas.validators.js';
import {
  listarFacturas,
  obtenerFactura,
  crearFactura,
  actualizarFactura,
} from '../controllers/facturas.controller.js';

// Multer en memoria — solo acepta PDF, máximo 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se aceptan archivos PDF.'));
    }
    cb(null, true);
  },
});

// Error handler específico de multer
function multerError(err, req, res, next) {
  if (err instanceof multer.MulterError || err?.message === 'Solo se aceptan archivos PDF.') {
    return res.status(400).json({
      error: true,
      message: err.message === 'File too large'
        ? 'El archivo supera el límite de 10MB.'
        : err.message,
      code: 'ARCHIVO_INVALIDO',
    });
  }
  next(err);
}

const router = Router();

// GET /api/facturas
router.get(
  '/',
  authenticate,
  requireRole('admin', 'gestor', 'auditor'),
  validarQueryFacturas,
  validate,
  listarFacturas
);

// GET /api/facturas/:id
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'gestor', 'auditor'),
  obtenerFactura
);

// POST /api/facturas — multipart con PDF opcional
router.post(
  '/',
  authenticate,
  requireRole('admin', 'gestor'),
  upload.single('adjunto'),
  multerError,
  validarCrearFactura,
  validate,
  crearFactura
);

// PATCH /api/facturas/:id
router.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'gestor'),
  validarActualizarFactura,
  validate,
  actualizarFactura
);

export default router;
