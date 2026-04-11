// src/controllers/usuarios.controller.js
// CRUD de usuarios — solo admin.
// Usa supabaseAdmin (bypasea RLS) porque gestiona usuarios del sistema.

import { supabaseAdmin } from '../config/supabase.js';
import { createError } from '../middleware/errorHandler.js';

const ROLES_VALIDOS = ['admin', 'gestor', 'auditor'];

/**
 * GET /api/usuarios
 * Lista perfiles con email. Soporta filtros: activo, rol.
 */
export async function listarUsuarios(req, res, next) {
  try {
    const { activo, rol } = req.query;

    let query = supabaseAdmin
      .from('perfiles')
      .select('id, nombre_completo, rol, activo, created_at')
      .order('created_at', { ascending: false });

    if (activo !== undefined) {
      query = query.eq('activo', activo === 'true' || activo === true);
    }

    if (rol) {
      query = query.eq('rol', rol);
    }

    const { data: perfiles, error } = await query;

    if (error) {
      return next(createError(500, 'Error al obtener la lista de usuarios.', 'ERROR_LISTAR_USUARIOS'));
    }

    // Obtener emails de auth.users para cada perfil
    // Supabase Admin API no permite join directo, hacemos lookup por ID
    const usuariosConEmail = await Promise.all(
      perfiles.map(async (perfil) => {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(perfil.id);
        return {
          ...perfil,
          email: user?.email ?? null,
        };
      })
    );

    return res.json({ data: usuariosConEmail, count: usuariosConEmail.length });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/usuarios
 * Crea un usuario en Supabase Auth. El trigger fn_handle_new_user() crea el perfil.
 * Body: { email, password, nombre_completo, rol }
 */
export async function crearUsuario(req, res, next) {
  try {
    const { email, password, nombre_completo, rol } = req.body;

    // Validaciones de negocio
    if (!email || !password || !nombre_completo || !rol) {
      return next(createError(400, 'Los campos email, password, nombre_completo y rol son requeridos.', 'CAMPOS_REQUERIDOS'));
    }

    if (password.length < 8) {
      return next(createError(400, 'La contraseña debe tener al menos 8 caracteres.', 'PASSWORD_MUY_CORTO'));
    }

    if (!ROLES_VALIDOS.includes(rol)) {
      return next(createError(400, `El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.`, 'ROL_INVALIDO'));
    }

    // Crear usuario en Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // confirmar automáticamente (sistema interno)
      user_metadata: {
        nombre_completo: nombre_completo.trim(),
        rol,
      },
    });

    if (error) {
      if (error.message?.includes('already registered') || error.status === 422) {
        return next(createError(409, 'Ya existe un usuario con ese correo electrónico.', 'EMAIL_DUPLICADO'));
      }
      return next(createError(500, 'Error al crear el usuario.', 'ERROR_CREAR_USUARIO'));
    }

    // Esperar brevemente para que el trigger cree el perfil
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Obtener el perfil creado por el trigger
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.status(201).json({
      message: 'Usuario creado correctamente.',
      usuario: {
        id: data.user.id,
        email: data.user.email,
        ...perfil,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/usuarios/:id
 * Actualiza nombre_completo, rol o activo.
 * Si activo=false, también banea al usuario en Supabase Auth.
 */
export async function actualizarUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre_completo, rol, activo } = req.body;

    // Validar que no se desactive a sí mismo
    if (activo === false && id === req.user.id) {
      return next(createError(400, 'No puedes desactivar tu propia cuenta.', 'AUTODESACTIVACION_NO_PERMITIDA'));
    }

    // Verificar que el usuario existe
    const { data: perfilExiste, error: errorExiste } = await supabaseAdmin
      .from('perfiles')
      .select('id')
      .eq('id', id)
      .single();

    if (errorExiste || !perfilExiste) {
      return next(createError(404, 'Usuario no encontrado.', 'USUARIO_NO_ENCONTRADO'));
    }

    // Validaciones
    if (rol && !ROLES_VALIDOS.includes(rol)) {
      return next(createError(400, `El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}.`, 'ROL_INVALIDO'));
    }

    // Actualizar en perfiles
    const camposActualizar = {};
    if (nombre_completo !== undefined) camposActualizar.nombre_completo = nombre_completo.trim();
    if (rol !== undefined) camposActualizar.rol = rol;
    if (activo !== undefined) camposActualizar.activo = activo;

    if (Object.keys(camposActualizar).length === 0) {
      return next(createError(400, 'No se enviaron campos para actualizar.', 'SIN_CAMBIOS'));
    }

    const { data: perfilActualizado, error: errorUpdate } = await supabaseAdmin
      .from('perfiles')
      .update(camposActualizar)
      .eq('id', id)
      .select()
      .single();

    if (errorUpdate) {
      return next(createError(500, 'Error al actualizar el perfil.', 'ERROR_ACTUALIZAR'));
    }

    // Si se desactiva, banear también en Supabase Auth
    if (activo === false) {
      await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '876600h' }); // ~100 años
    }

    // Si se reactiva, remover el ban
    if (activo === true) {
      await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: 'none' });
    }

    return res.json({
      message: 'Usuario actualizado correctamente.',
      usuario: perfilActualizado,
    });
  } catch (err) {
    next(err);
  }
}
