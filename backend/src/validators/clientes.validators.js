// src/validators/clientes.validators.js
// Validaciones con express-validator para endpoints de clientes.

import { body, query, param } from 'express-validator';

const TIPOS_DOCUMENTO = ['CC', 'NIT', 'RUT', 'CE', 'PASAPORTE'];
const ESTADOS_CREDITO = ['al_dia', 'en_mora', 'reportado', 'bloqueado'];

export const validarCrearCliente = [
  body('nombre_negocio')
    .trim()
    .notEmpty()
    .withMessage('El nombre del negocio es requerido.')
    .isLength({ max: 255 })
    .withMessage('El nombre del negocio no puede superar 255 caracteres.'),

  body('tipo_id')
    .notEmpty()
    .withMessage('El tipo de documento es requerido.')
    .isIn(TIPOS_DOCUMENTO)
    .withMessage(`El tipo de documento debe ser uno de: ${TIPOS_DOCUMENTO.join(', ')}.`),

  body('numero_id')
    .trim()
    .notEmpty()
    .withMessage('El número de documento es requerido.')
    .isLength({ max: 50 })
    .withMessage('El número de documento no puede superar 50 caracteres.'),

  body('telefono')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede superar 20 caracteres.'),

  body('email')
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .withMessage('El email no tiene un formato válido.')
    .normalizeEmail(),

  body('direccion')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La dirección no puede superar 500 caracteres.'),

  body('ciudad')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La ciudad no puede superar 100 caracteres.'),

  body('estado_credito')
    .optional()
    .isIn(ESTADOS_CREDITO)
    .withMessage(`El estado de crédito debe ser uno de: ${ESTADOS_CREDITO.join(', ')}.`),

  body('limite_credito')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('El límite de crédito debe ser un número mayor o igual a 0.')
    .toFloat(),

  body('notas')
    .optional({ nullable: true })
    .trim(),
];

export const validarActualizarCliente = [
  param('id')
    .isUUID()
    .withMessage('El ID del cliente debe ser un UUID válido.'),

  body('nombre_negocio')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre del negocio no puede estar vacío.')
    .isLength({ max: 255 })
    .withMessage('El nombre del negocio no puede superar 255 caracteres.'),

  body('tipo_id')
    .optional()
    .isIn(TIPOS_DOCUMENTO)
    .withMessage(`El tipo de documento debe ser uno de: ${TIPOS_DOCUMENTO.join(', ')}.`),

  body('numero_id')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El número de documento no puede estar vacío.')
    .isLength({ max: 50 })
    .withMessage('El número de documento no puede superar 50 caracteres.'),

  body('telefono')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('El teléfono no puede superar 20 caracteres.'),

  body('email')
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .withMessage('El email no tiene un formato válido.')
    .normalizeEmail(),

  body('estado_credito')
    .optional()
    .isIn(ESTADOS_CREDITO)
    .withMessage(`El estado de crédito debe ser uno de: ${ESTADOS_CREDITO.join(', ')}.`),

  body('limite_credito')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('El límite de crédito debe ser un número mayor o igual a 0.')
    .toFloat(),

  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser un booleano.')
    .toBoolean(),

  body('notas')
    .optional({ nullable: true })
    .trim(),
];

export const validarQueryClientes = [
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

  query('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser true o false.')
    .toBoolean(),

  query('estado_credito')
    .optional()
    .isIn(ESTADOS_CREDITO)
    .withMessage(`El estado de crédito debe ser uno de: ${ESTADOS_CREDITO.join(', ')}.`),

  query('buscar')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El término de búsqueda no puede superar 100 caracteres.'),
];
