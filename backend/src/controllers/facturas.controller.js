// src/controllers/facturas.controller.js
// CRUD de facturas con soporte de adjunto PDF (Opción A: path estándar en Storage).
// El número de factura lo genera el trigger (COND-YYYY-NNNN).
// Los pagos actualizan valor_pagado y estado via trigger.

import { getSupabaseUser, supabaseAdmin } from '../config/supabase.js';
import { createError } from '../middleware/errorHandler.js';

const STORAGE_BUCKET = 'adjuntos-facturas';

/**
 * GET /api/facturas
 * Lista facturas con filtros y paginación.
 * Incluye nombre_negocio del cliente via join.
 */
export async function listarFacturas(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const {
      cliente_id,
      estado,
      fecha_desde,
      fecha_hasta,
      vencidas_solo,
      buscar,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from('facturas')
      .select(`
        *,
        clientes!inner(nombre_negocio, numero_id, tipo_id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (cliente_id) query = query.eq('cliente_id', cliente_id);
    if (estado) query = query.eq('estado', estado);
    if (fecha_desde) query = query.gte('fecha_emision', fecha_desde);
    if (fecha_hasta) query = query.lte('fecha_emision', fecha_hasta);
    if (vencidas_solo === true || vencidas_solo === 'true') {
      query = query.eq('estado', 'vencida');
    }
    if (buscar) {
      query = query.ilike('numero_factura', `%${buscar}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return next(createError(500, 'Error al obtener la lista de facturas.', 'ERROR_LISTAR_FACTURAS'));
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
 * GET /api/facturas/:id
 * Obtiene detalle completo: factura + cliente + pagos + historial + url_adjunto.
 */
export async function obtenerFactura(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const { id } = req.params;

    // Obtener factura con cliente
    const { data: factura, error: errorFactura } = await supabase
      .from('facturas')
      .select(`
        *,
        clientes(id, nombre_negocio, numero_id, tipo_id, telefono, email, ciudad)
      `)
      .eq('id', id)
      .single();

    if (errorFactura || !factura) {
      return next(createError(404, 'Factura no encontrada.', 'FACTURA_NO_ENCONTRADA'));
    }

    // Obtener pagos de la factura
    const { data: pagos, error: errorPagos } = await supabase
      .from('pagos')
      .select(`
        *,
        perfiles!registrado_por(nombre_completo)
      `)
      .eq('factura_id', id)
      .order('fecha_pago', { ascending: false });

    if (errorPagos) {
      return next(createError(500, 'Error al obtener los pagos de la factura.', 'ERROR_OBTENER_PAGOS'));
    }

    // Obtener historial de auditoría via RPC
    const { data: historial, error: errorHistorial } = await supabase
      .rpc('get_historial_factura', { p_factura_id: id });

    // Buscar adjunto en Storage (Opción A)
    let urlAdjunto = null;
    try {
      const { data: archivos } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .list(`facturas/${id}`, { limit: 1 });

      if (archivos && archivos.length > 0) {
        const { data: signedData } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(`facturas/${id}/${archivos[0].name}`, 3600);

        urlAdjunto = signedData?.signedUrl ?? null;
      }
    } catch {
      // Sin adjunto, no es error crítico
    }

    return res.json({
      factura,
      cliente: factura.clientes,
      pagos: pagos || [],
      historial: historial || [],
      url_adjunto: urlAdjunto,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/facturas
 * Crea una factura. Acepta multipart/form-data (puede traer PDF adjunto).
 * Flujo: validar → verificar cliente → insertar → subir PDF si aplica.
 */
export async function crearFactura(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const {
      cliente_id,
      valor_total,
      dias_plazo,
      fecha_emision,
      numero_factura,
      notas,
    } = req.body;

    const valorTotalNum = parseFloat(valor_total);
    const diasPlazoNum = parseInt(dias_plazo, 10);

    // Verificar que el cliente existe y está activo
    const { data: cliente, error: errorCliente } = await supabase
      .from('clientes')
      .select('id, nombre_negocio, activo')
      .eq('id', cliente_id)
      .single();

    if (errorCliente || !cliente) {
      return next(createError(404, 'Cliente no encontrado.', 'CLIENTE_NO_ENCONTRADO'));
    }

    if (!cliente.activo) {
      return next(createError(400, 'No se puede crear una factura para un cliente inactivo.', 'CLIENTE_INACTIVO'));
    }

    // Calcular fecha de vencimiento
    const emision = fecha_emision ? new Date(fecha_emision) : new Date();
    const vencimiento = new Date(emision);
    vencimiento.setDate(vencimiento.getDate() + diasPlazoNum);

    const fechaEmisionStr = emision.toISOString().split('T')[0];
    const fechaVencimientoStr = vencimiento.toISOString().split('T')[0];

    // Insertar la factura (el trigger genera numero_factura si está vacío)
    const { data: factura, error: errorInsert } = await supabase
      .from('facturas')
      .insert({
        cliente_id,
        valor_total: valorTotalNum,
        valor_pagado: 0,
        dias_plazo: diasPlazoNum,
        fecha_emision: fechaEmisionStr,
        fecha_vencimiento: fechaVencimientoStr,
        numero_factura: numero_factura?.trim() || null,
        notas: notas?.trim() || null,
        estado: 'pendiente',
        creado_por: req.user.id,
      })
      .select()
      .single();

    if (errorInsert) {
      if (errorInsert.code === '23505') {
        return next(createError(409, 'Ya existe una factura con ese número.', 'FACTURA_DUPLICADA'));
      }
      return next(createError(500, 'Error al crear la factura.', 'ERROR_CREAR_FACTURA'));
    }

    // Subir PDF adjunto si viene en el request
    let urlAdjunto = null;
    if (req.file) {
      const timestamp = Date.now();
      const storagePath = `facturas/${factura.id}/${timestamp}.pdf`;

      const { error: errorStorage } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, req.file.buffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (!errorStorage) {
        const { data: signedData } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(storagePath, 3600);

        urlAdjunto = signedData?.signedUrl ?? null;
      }
      // Si falla la subida del PDF, no fallamos la factura — ya fue creada
    }

    return res.status(201).json({
      message: 'Factura creada correctamente.',
      factura,
      url_adjunto: urlAdjunto,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/facturas/:id
 * Solo permite modificar: notas, estado.
 * Gestores no pueden anular facturas (solo admin).
 */
export async function actualizarFactura(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const { id } = req.params;
    const { notas, estado } = req.body;

    // Verificar que la factura existe
    const { data: factura, error: errorExiste } = await supabase
      .from('facturas')
      .select('id, estado')
      .eq('id', id)
      .single();

    if (errorExiste || !factura) {
      return next(createError(404, 'Factura no encontrada.', 'FACTURA_NO_ENCONTRADA'));
    }

    // Gestor no puede anular
    if (estado === 'anulada' && req.user.rol !== 'admin') {
      return next(createError(403, 'Solo los administradores pueden anular facturas.', 'ANULACION_NO_PERMITIDA'));
    }

    const payload = {};
    if (notas !== undefined) payload.notas = notas?.trim() || null;
    if (estado !== undefined) payload.estado = estado;

    if (Object.keys(payload).length === 0) {
      return next(createError(400, 'No se enviaron campos para actualizar.', 'SIN_CAMBIOS'));
    }

    const { data, error } = await supabase
      .from('facturas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return next(createError(500, 'Error al actualizar la factura.', 'ERROR_ACTUALIZAR_FACTURA'));
    }

    return res.json({
      message: 'Factura actualizada correctamente.',
      data,
    });
  } catch (err) {
    next(err);
  }
}
