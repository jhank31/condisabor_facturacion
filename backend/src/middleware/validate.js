// src/middleware/validate.js
// Ejecuta las validaciones de express-validator y corta el request si hay errores.

import { validationResult } from 'express-validator';

/**
 * Middleware que ejecuta los resultados de validación de express-validator.
 * Si hay errores de validación, retorna 400 con lista de errores.
 * Si no hay errores, llama next().
 */
export function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errores = errors.array().map((e) => ({
      campo: e.path,
      mensaje: e.msg,
      valor: e.value,
    }));

    return res.status(400).json({
      error: true,
      message: 'Los datos enviados contienen errores de validación.',
      code: 'VALIDACION_FALLIDA',
      details: errores,
    });
  }

  next();
}
