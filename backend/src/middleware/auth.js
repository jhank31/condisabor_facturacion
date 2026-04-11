// src/middleware/auth.js
// Middleware de autenticación:
//   1. Extrae Bearer token del header Authorization
//   2. Valida el token con supabaseAdmin.auth.getUser()
//   3. Consulta el perfil del usuario (rol, activo)
//   4. Si activo=false → 403
//   5. Adjunta req.user = { id, email, rol, nombre_completo, accessToken }
//   6. Cualquier falla → 401

import { supabaseAdmin } from '../config/supabase.js';

export async function authenticate(req, res, next) {
  try {
    // 1. Extraer el token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'No se proporcionó token de autenticación.',
        code: 'TOKEN_REQUERIDO',
      });
    }

    const accessToken = authHeader.split(' ')[1];

    // 2. Validar el token con Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return res.status(401).json({
        error: true,
        message: 'Token inválido o expirado. Por favor inicia sesión nuevamente.',
        code: 'TOKEN_INVALIDO',
      });
    }

    // 3. Consultar el perfil del usuario para obtener rol y estado activo
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('nombre_completo, rol, activo')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfil) {
      return res.status(401).json({
        error: true,
        message: 'Perfil de usuario no encontrado.',
        code: 'PERFIL_NO_ENCONTRADO',
      });
    }

    // 4. Verificar que el usuario esté activo
    if (!perfil.activo) {
      return res.status(403).json({
        error: true,
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
        code: 'USUARIO_DESACTIVADO',
      });
    }

    // 5. Adjuntar datos del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      rol: perfil.rol,
      nombre_completo: perfil.nombre_completo,
      accessToken,
    };

    next();
  } catch (err) {
    next(err);
  }
}
