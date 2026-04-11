// src/controllers/clientes.controller.js
// CRUD de clientes. Usa supabaseUser(token) para respetar RLS.
// El soft-delete valida que no haya facturas pendientes/vencidas antes de desactivar.

import { getSupabaseUser, supabaseAdmin } from '../config/supabase.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * GET /api/clientes
 * Lista clientes con paginación y filtros.
 * Query: buscar, estado_credito, activo, page, limit
 */
export async function listarClientes(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const {
      buscar,
      estado_credito,
      activo = true,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .eq('activo', activo)
      .order('nombre_negocio', { ascending: true })
      .range(from, to);

    if (buscar) {
      query = query.or(`nombre_negocio.ilike.%${buscar}%,numero_id.ilike.%${buscar}%`);
    }

    if (estado_credito) {
      query = query.eq('estado_credito', estado_credito);
    }

    const { data, error, count } = await query;

    if (error) {
      return next(createError(500, 'Error al obtener la lista de clientes.', 'ERROR_LISTAR_CLIENTES'));
    }

    const totalPages = Math.ceil(count / limitNum);

    return res.json({
      data,
      count,
      page: pageNum,
      limit: limitNum,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/clientes/:id
 * Obtiene el estado de cuenta completo del cliente usando RPC.
 */
export async function obtenerCliente(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const { id } = req.params;

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !cliente) {
      return next(createError(404, 'Cliente no encontrado.', 'CLIENTE_NO_ENCONTRADO'));
    }

    return res.json(cliente);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/clientes
 * Crea un nuevo cliente.
 * Body: { nombre_negocio*, tipo_id*, numero_id*, telefono, email, ... }
 */
export async function crearCliente(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const {
      nombre_negocio,
      tipo_id,
      numero_id,
      telefono,
      email,
      direccion,
      ciudad,
      estado_credito,
      limite_credito,
      notas,
    } = req.body;

    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nombre_negocio: nombre_negocio.trim(),
        tipo_id,
        numero_id: numero_id.trim(),
        telefono: telefono?.trim() || null,
        email: email?.trim()?.toLowerCase() || null,
        direccion: direccion?.trim() || null,
        ciudad: ciudad?.trim() || null,
        estado_credito: estado_credito || 'al_dia',
        limite_credito: limite_credito ?? null,
        notas: notas?.trim() || null,
        created_by: req.user.id,
        activo: true,
      })
      .select()
      .single();

    if (error) {
      // Unique violation: tipo_id + numero_id duplicado
      if (error.code === '23505') {
        return next(createError(409, 'Ya existe un cliente con ese tipo y número de documento.', 'DOCUMENTO_DUPLICADO'));
      }
      return next(createError(500, 'Error al crear el cliente.', 'ERROR_CREAR_CLIENTE'));
    }

    return res.status(201).json({
      message: 'Cliente creado correctamente.',
      data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/clientes/:id
 * Actualiza datos del cliente.
 * El trigger actualiza updated_at y audit_log automáticamente.
 */
export async function actualizarCliente(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const { id } = req.params;
    const camposPermitidos = [
      'nombre_negocio', 'tipo_id', 'numero_id', 'telefono',
      'email', 'direccion', 'ciudad', 'estado_credito',
      'limite_credito', 'notas',
    ];

    // Filtrar solo campos permitidos
    const payload = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        payload[campo] = req.body[campo];
      }
    });

    if (Object.keys(payload).length === 0) {
      return next(createError(400, 'No se enviaron campos para actualizar.', 'SIN_CAMBIOS'));
    }

    // Verificar que el cliente existe
    const { data: existe, error: errorExiste } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', id)
      .single();

    if (errorExiste || !existe) {
      return next(createError(404, 'Cliente no encontrado.', 'CLIENTE_NO_ENCONTRADO'));
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return next(createError(409, 'Ya existe un cliente con ese tipo y número de documento.', 'DOCUMENTO_DUPLICADO'));
      }
      return next(createError(500, 'Error al actualizar el cliente.', 'ERROR_ACTUALIZAR_CLIENTE'));
    }

    return res.json({
      message: 'Cliente actualizado correctamente.',
      data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/clientes/:id
 * Soft delete: desactiva el cliente.
 * Valida que no tenga facturas pendientes o vencidas antes de desactivar.
 */
export async function desactivarCliente(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const { id } = req.params;

    // Verificar que el cliente existe
    const { data: cliente, error: errorCliente } = await supabase
      .from('clientes')
      .select('id, nombre_negocio, activo')
      .eq('id', id)
      .single();

    if (errorCliente || !cliente) {
      return next(createError(404, 'Cliente no encontrado.', 'CLIENTE_NO_ENCONTRADO'));
    }

    if (!cliente.activo) {
      return next(createError(400, 'El cliente ya está inactivo.', 'CLIENTE_YA_INACTIVO'));
    }

    // Verificar que no tenga facturas pendientes o vencidas
    const { data: facturasPendientes, error: errorFacturas } = await supabase
      .from('facturas')
      .select('id', { count: 'exact' })
      .eq('cliente_id', id)
      .in('estado', ['pendiente', 'vencida', 'parcial']);

    if (errorFacturas) {
      return next(createError(500, 'Error al verificar facturas del cliente.', 'ERROR_VERIFICAR_FACTURAS'));
    }

    if (facturasPendientes && facturasPendientes.length > 0) {
      return next(createError(
        400,
        `No se puede desactivar el cliente "${cliente.nombre_negocio}" porque tiene ${facturasPendientes.length} factura(s) pendiente(s) o vencida(s).`,
        'CLIENTE_CON_FACTURAS_PENDIENTES'
      ));
    }

    // Soft delete
    const { data, error } = await supabase
      .from('clientes')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return next(createError(500, 'Error al desactivar el cliente.', 'ERROR_DESACTIVAR_CLIENTE'));
    }

    return res.json({
      message: `Cliente "${cliente.nombre_negocio}" desactivado correctamente.`,
      data,
    });
  } catch (err) {
    next(err);
  }
}
