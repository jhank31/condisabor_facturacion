// src/controllers/auth.controller.js
// Maneja login, refresh, logout y me.
// Usa supabaseAdmin para todas las operaciones de autenticación.

import { supabaseAdmin } from '../config/supabase.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError(400, 'El email y la contraseña son requeridos.', 'CREDENCIALES_REQUERIDAS'));
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Invalid credentials
      if (error.status === 400 || error.message?.includes('Invalid login')) {
        return next(createError(401, 'Correo o contraseña incorrectos.', 'CREDENCIALES_INVALIDAS'));
      }
      return next(createError(500, 'Error al iniciar sesión.', 'ERROR_LOGIN'));
    }

    // Obtener datos del perfil
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('nombre_completo, rol, activo')
      .eq('id', data.user.id)
      .single();

    if (perfilError || !perfil) {
      return next(createError(500, 'No se pudo obtener el perfil del usuario.', 'PERFIL_NO_ENCONTRADO'));
    }

    if (!perfil.activo) {
      return next(createError(403, 'Tu cuenta ha sido desactivada. Contacta al administrador.', 'USUARIO_DESACTIVADO'));
    }

    return res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        rol: perfil.rol,
        nombre_completo: perfil.nombre_completo,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Body: { refresh_token }
 */
export async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return next(createError(400, 'El refresh_token es requerido.', 'REFRESH_TOKEN_REQUERIDO'));
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });

    if (error || !data.session) {
      return next(createError(401, 'Token de refresco inválido o expirado.', 'REFRESH_TOKEN_INVALIDO'));
    }

    return res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * [auth requerido]
 */
export async function logout(req, res, next) {
  try {
    // Invalidar el token en Supabase
    await supabaseAdmin.auth.admin.signOut(req.user.accessToken);

    return res.json({ message: 'Sesión cerrada correctamente.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * [auth requerido]
 */
export async function me(req, res) {
  // req.user ya viene completo del middleware de autenticación
  return res.json({
    id: req.user.id,
    email: req.user.email,
    rol: req.user.rol,
    nombre_completo: req.user.nombre_completo,
  });
}
