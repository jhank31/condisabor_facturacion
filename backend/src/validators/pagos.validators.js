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
