// src/validators/pagos.validators.js
// Validaciones con express-validator para endpoints de pagos.

import { body, param } from 'express-validator';

const METODOS_PAGO = ['efectivo', 'transferencia', 'cheque', 'otro'];

export const validarCrearPago = [
  body('factura_id')
    .notEmpty()
    .withMessage('El factura_id es requerido.')
    .isUUID()
    .withMessage('El factura_id debe ser un UUID válido.'),

  body('monto')
    .notEmpty()
    .withMessage('El monto es requerido.')
    .isFloat({ min: 0.01 })
    .withMessage('El monto debe ser mayor a 0.')
    .toFloat(),

  body('fecha_pago')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('La fecha de pago debe tener formato YYYY-MM-DD.'),

  body('metodo_pago')
    .optional()
    .isIn(METODOS_PAGO)
    .withMessage(`El método de pago debe ser uno de: ${METODOS_PAGO.join(', ')}.`),

  body('referencia')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La referencia no puede superar 100 caracteres.'),

  body('notas')
    .optional({ nullable: true })
    .trim(),
];

export const validarParamFacturaId = [
  param('factura_id')
    .isUUID()
    .withMessage('El factura_id debe ser un UUID válido.'),
];

// POST /api/pagos/abono-general
export const validarAbonoGeneral = [
  body('cliente_id')
    .notEmpty().withMessage('El cliente_id es requerido.')
    .isUUID().withMessage('El cliente_id debe ser un UUID válido.'),

  body('monto')
    .notEmpty().withMessage('El monto es requerido.')
    .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0.')
    .toFloat(),

  body('fecha_pago')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('La fecha de pago debe tener formato YYYY-MM-DD.'),

  body('metodo_pago')
    .optional()
    .isIn(METODOS_PAGO)
    .withMessage(`El método de pago debe ser uno de: ${METODOS_PAGO.join(', ')}.`),

  body('referencia')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La referencia no puede superar 100 caracteres.'),

  body('notas')
    .optional({ nullable: true })
    .trim(),
];

// POST /api/pagos/pago-multiple
export const validarPagoMultiple = [
  body('factura_ids')
    .isArray({ min: 1 }).withMessage('Debe seleccionar al menos una factura.')
    .custom((arr) => arr.every((id) => typeof id === 'string' && /^[0-9a-f-]{36}$/.test(id)))
    .withMessage('Todos los factura_ids deben ser UUIDs válidos.'),

  body('fecha_pago')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('La fecha de pago debe tener formato YYYY-MM-DD.'),

  body('metodo_pago')
    .optional()
    .isIn(METODOS_PAGO)
    .withMessage(`El método de pago debe ser uno de: ${METODOS_PAGO.join(', ')}.`),

  body('referencia')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La referencia no puede superar 100 caracteres.'),

  body('notas')
    .optional({ nullable: true })
    .trim(),
];
