// src/middleware/roles.js
// Factory que genera middleware de autorización por rol.
// Uso: requireRole('admin', 'gestor')

/**
 * Crea un middleware que verifica que el usuario tenga uno de los roles permitidos.
 * Se debe usar DESPUÉS del middleware authenticate.
 *
 * @param {...string} rolesPermitidos - Roles que tienen acceso al endpoint
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'No autenticado.',
        code: 'NO_AUTENTICADO',
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        error: true,
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}.`,
        code: 'ROL_INSUFICIENTE',
      });
    }

    next();
  };
}
