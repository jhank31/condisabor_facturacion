// src/controllers/pagos.controller.js
// Registro y consulta de pagos.
// IMPORTANTE: las validaciones de negocio se hacen ANTES de insertar
// para dar errores claros al usuario. El trigger fn_procesar_pago()
// actualiza automáticamente valor_pagado y estado de la factura.

import { getSupabaseUser } from '../config/supabase.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * POST /api/pagos
 * Registra un pago validando reglas de negocio antes de insertar.
 * Body: { factura_id*, monto*, fecha_pago, metodo_pago, referencia, notas }
 */
export async function registrarPago(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const { factura_id, monto, fecha_pago, metodo_pago, referencia, notas } = req.body;

    const montoNum = parseFloat(monto);

    // 1. Verificar que la factura existe
    const { data: factura, error: errorFactura } = await supabase
      .from('facturas')
      .select('id, estado, saldo_pendiente, numero_factura')
      .eq('id', factura_id)
      .single();

    if (errorFactura || !factura) {
      return next(createError(404, 'Factura no encontrada.', 'FACTURA_NO_ENCONTRADA'));
    }

    // 2. Verificar que la factura no está anulada ni ya pagada
    if (factura.estado === 'anulada') {
      return next(createError(400, `La factura ${factura.numero_factura} está anulada y no acepta pagos.`, 'FACTURA_ANULADA'));
    }

    if (factura.estado === 'pagada') {
      return next(createError(400, `La factura ${factura.numero_factura} ya está completamente pagada.`, 'FACTURA_YA_PAGADA'));
    }

    // 3. Verificar monto > 0 (ya validado por express-validator, doble seguridad)
    if (montoNum <= 0) {
      return next(createError(400, 'El monto del pago debe ser mayor a 0.', 'MONTO_INVALIDO'));
    }

    // 4. Verificar que monto no excede el saldo pendiente
    const saldo = parseFloat(factura.saldo_pendiente);
    if (montoNum > saldo) {
      return next(createError(
        400,
        `El monto del pago (${montoNum.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}) supera el saldo pendiente de la factura (${saldo.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}).`,
        'MONTO_EXCEDE_SALDO'
      ));
    }

    // 5. Insertar el pago. El trigger fn_procesar_pago() hace el resto.
    const { data: pago, error: errorPago } = await supabase
      .from('pagos')
      .insert({
        factura_id,
        monto: montoNum,
        fecha_pago: fecha_pago || new Date().toISOString().split('T')[0],
        metodo_pago: metodo_pago || 'efectivo',
        referencia: referencia?.trim() || null,
        notas: notas?.trim() || null,
        registrado_por: req.user.id,
      })
      .select()
      .single();

    if (errorPago) {
      return next(createError(500, 'Error al registrar el pago.', 'ERROR_REGISTRAR_PAGO'));
    }

    // Obtener la factura actualizada (el trigger ya la procesó)
    const { data: facturaActualizada } = await supabase
      .from('facturas')
      .select('id, numero_factura, valor_total, valor_pagado, saldo_pendiente, estado')
      .eq('id', factura_id)
      .single();

    return res.status(201).json({
      message: 'Pago registrado correctamente.',
      pago,
      factura_actualizada: facturaActualizada,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/pagos/factura/:factura_id
 * Lista los pagos de una factura ordenados por fecha_pago DESC.
 * Incluye el nombre del usuario que registró cada pago.
 */
export async function listarPagosPorFactura(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const { factura_id } = req.params;

    // Verificar que la factura existe
    const { data: facturaExiste, error: errorExiste } = await supabase
      .from('facturas')
      .select('id, numero_factura')
      .eq('id', factura_id)
      .single();

    if (errorExiste || !facturaExiste) {
      return next(createError(404, 'Factura no encontrada.', 'FACTURA_NO_ENCONTRADA'));
    }

    const { data: pagos, error } = await supabase
      .from('pagos')
      .select(`
        *,
        perfiles!registrado_por(nombre_completo)
      `)
      .eq('factura_id', factura_id)
      .order('fecha_pago', { ascending: false });

    if (error) {
      return next(createError(500, 'Error al obtener los pagos.', 'ERROR_OBTENER_PAGOS'));
    }

    return res.json({
      factura_id,
      numero_factura: facturaExiste.numero_factura,
      data: pagos,
      count: pagos.length,
    });
  } catch (err) {
    next(err);
  }
}
