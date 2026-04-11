// src/validators/facturas.validators.js
// Validaciones con express-validator para endpoints de facturas.

import { body, query, param } from 'express-validator';

const ESTADOS_FACTURA = ['pendiente', 'parcial', 'pagada', 'vencida', 'anulada'];
const DIAS_PLAZO_PERMITIDOS = [15, 30, 60, 90];

export const validarCrearFactura = [
  // Los campos vienen como strings en multipart/form-data
  body('cliente_id')
    .notEmpty()
    .withMessage('El cliente_id es requerido.')
    .isUUID()
    .withMessage('El cliente_id debe ser un UUID válido.'),

  body('valor_total')
    .notEmpty()
    .withMessage('El valor_total es requerido.')
    .isFloat({ min: 0.01 })
    .withMessage('El valor_total debe ser mayor a 0.')
    .toFloat(),

  body('dias_plazo')
    .notEmpty()
    .withMessage('Los días de plazo son requeridos.')
    .isInt()
    .withMessage('Los días de plazo deben ser un número entero.')
    .toInt()
    .custom((value) => {
      if (!DIAS_PLAZO_PERMITIDOS.includes(value)) {
        throw new Error(`Los días de plazo deben ser uno de: ${DIAS_PLAZO_PERMITIDOS.join(', ')}.`);
      }
      return true;
    }),

  body('fecha_emision')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('La fecha de emisión debe tener formato YYYY-MM-DD.')
    .custom((value) => {
      if (!value) return true;
      const emision = new Date(value);
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      manana.setHours(23, 59, 59, 999);
      if (emision > manana) {
        throw new Error('La fecha de emisión no puede ser futura por más de 1 día.');
      }
      return true;
    }),

  body('numero_factura')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('El número de factura no puede superar 20 caracteres.'),

  body('notas')
    .optional({ nullable: true })
    .trim(),
];

export const validarActualizarFactura = [
  param('id')
    .isUUID()
    .withMessage('El ID de la factura debe ser un UUID válido.'),

  body('notas')
    .optional({ nullable: true })
    .trim(),

  body('estado')
    .optional()
    .isIn(ESTADOS_FACTURA)
    .withMessage(`El estado debe ser uno de: ${ESTADOS_FACTURA.join(', ')}.`),

  // Campos que NO se pueden modificar (se rechazan si vienen)
  body('valor_total')
    .not()
    .exists()
    .withMessage('No se puede modificar el valor total de una factura.'),

  body('cliente_id')
    .not()
    .exists()
    .withMessage('No se puede cambiar el cliente de una factura.'),

  body('valor_pagado')
    .not()
    .exists()
    .withMessage('El valor pagado se actualiza automáticamente con los pagos registrados.'),

  body('creado_por')
    .not()
    .exists()
    .withMessage('No se puede modificar el creador de una factura.'),
];

export const validarQueryFacturas = [
  query('cliente_id')
    .optional()
    .isUUID()
    .withMessage('El cliente_id debe ser un UUID válido.'),

  query('estado')
    .optional()
    .isIn(ESTADOS_FACTURA)
    .withMessage(`El estado debe ser uno de: ${ESTADOS_FACTURA.join(', ')}.`),

  query('fecha_desde')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('fecha_desde debe tener formato YYYY-MM-DD.'),

  query('fecha_hasta')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('fecha_hasta debe tener formato YYYY-MM-DD.'),

  query('vencidas_solo')
    .optional()
    .isBoolean()
    .withMessage('vencidas_solo debe ser true o false.')
    .toBoolean(),

  query('buscar')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El término de búsqueda no puede superar 50 caracteres.'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0.')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100.')
    .toInt(),
];
