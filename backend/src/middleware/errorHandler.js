// src/middleware/errorHandler.js
// Error handler global de Express.
// Captura todos los errores no manejados y los responde con formato estándar.
// En producción no expone detalles del error.

/**
 * Formatea errores de PostgreSQL/Supabase a respuestas HTTP amigables.
 * @param {Error} err
 * @returns {{ status: number, code: string, message: string }}
 */
function formatSupabaseError(err) {
  // Unique violation — número de documento duplicado, número de factura, etc.
  if (err?.code === '23505') {
    return {
      status: 409,
      code: 'DUPLICADO',
      message: 'Ya existe un registro con esos datos. Revisa los campos únicos.',
    };
  }

  // Foreign key violation
  if (err?.code === '23503') {
    return {
      status: 400,
      code: 'REFERENCIA_INVALIDA',
      message: 'El registro referenciado no existe.',
    };
  }

  // Check constraint violation
  if (err?.code === '23514') {
    return {
      status: 400,
      code: 'RESTRICCION_VIOLADA',
      message: 'Los datos no cumplen las restricciones definidas.',
    };
  }

  return null;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Nunca loguear tokens ni claves sensibles
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message || err);

  // Intentar mapear error de Supabase/Postgres
  const supabaseFormatted = formatSupabaseError(err);
  if (supabaseFormatted) {
    return res.status(supabaseFormatted.status).json({
      error: true,
      message: supabaseFormatted.message,
      code: supabaseFormatted.code,
      ...(isDev && { details: err }),
    });
  }

  // Errores operacionales ya formateados (lanzados con err.status)
  if (err.status && err.status < 500) {
    return res.status(err.status).json({
      error: true,
      message: err.message || 'Error en la solicitud.',
      code: err.code || 'ERROR_SOLICITUD',
      ...(isDev && err.details && { details: err.details }),
    });
  }

  // Error 500 genérico
  return res.status(500).json({
    error: true,
    message: 'Ocurrió un error interno en el servidor. Por favor intenta más tarde.',
    code: 'ERROR_INTERNO',
    ...(isDev && { details: { message: err.message, stack: err.stack } }),
  });
}

/**
 * Helper para crear errores HTTP operacionales con formato estándar.
 * Uso: throw createError(404, 'Cliente no encontrado', 'CLIENTE_NO_ENCONTRADO')
 */
export function createError(status, message, code, details = null) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (details) err.details = details;
  return err;
}
