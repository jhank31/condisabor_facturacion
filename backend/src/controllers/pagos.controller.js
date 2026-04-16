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

/**
 * POST /api/pagos/abono-general
 * Aplica un monto total al conjunto de facturas pendientes de un cliente,
 * distribuyendo desde la más antigua (fecha_emision ASC) a la más nueva.
 * Body: { cliente_id*, monto*, fecha_pago, metodo_pago, referencia, notas }
 */
export async function abonoGeneral(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const { cliente_id, monto, fecha_pago, metodo_pago, referencia, notas } = req.body;

    let montoRestante = parseFloat(monto);
    const fechaPago = fecha_pago || new Date().toISOString().split('T')[0];
    const metodoPago = metodo_pago || 'efectivo';

    // 1. Verificar que el cliente existe
    const { data: cliente, error: errorCliente } = await supabase
      .from('clientes')
      .select('id, nombre_negocio')
      .eq('id', cliente_id)
      .single();

    if (errorCliente || !cliente) {
      return next(createError(404, 'Cliente no encontrado.', 'CLIENTE_NO_ENCONTRADO'));
    }

    // 2. Obtener facturas pendientes ordenadas por fecha_emision ASC (más vieja primero).
    //    Tiebreaker: created_at ASC para facturas del mismo día.
    const { data: facturas, error: errorFacturas } = await supabase
      .from('facturas')
      .select('id, numero_factura, saldo_pendiente, fecha_emision, created_at, estado')
      .eq('cliente_id', cliente_id)
      .in('estado', ['pendiente', 'parcial', 'vencida'])
      .gt('saldo_pendiente', 0)
      .order('fecha_emision', { ascending: true })
      .order('created_at', { ascending: true });

    if (errorFacturas) {
      return next(createError(500, 'Error al obtener facturas del cliente.', 'ERROR_OBTENER_FACTURAS'));
    }

    if (!facturas || facturas.length === 0) {
      return next(createError(400, 'El cliente no tiene facturas pendientes de pago.', 'SIN_FACTURAS_PENDIENTES'));
    }

    // 3. Calcular total de saldos pendientes
    const totalPendiente = facturas.reduce((s, f) => s + parseFloat(f.saldo_pendiente), 0);

    if (montoRestante > totalPendiente) {
      return next(createError(
        400,
        `El monto del abono (${montoRestante.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}) supera el total pendiente del cliente (${totalPendiente.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}).`,
        'MONTO_EXCEDE_SALDO_TOTAL'
      ));
    }

    // 4. Distribuir el pago en las facturas de más vieja a más nueva
    const pagosCreados = [];
    const facturasAfectadas = [];

    for (const factura of facturas) {
      if (montoRestante <= 0) break;

      const saldo = parseFloat(factura.saldo_pendiente);
      const montoAplicar = Math.min(montoRestante, saldo);

      // Insertar el pago para esta factura
      const { data: pago, error: errorPago } = await supabase
        .from('pagos')
        .insert({
          factura_id: factura.id,
          monto: montoAplicar,
          fecha_pago: fechaPago,
          metodo_pago: metodoPago,
          referencia: referencia?.trim() || null,
          notas: notas?.trim() || null,
          registrado_por: req.user.id,
        })
        .select()
        .single();

      if (errorPago) {
        return next(createError(500, `Error al registrar pago para factura ${factura.numero_factura}.`, 'ERROR_REGISTRAR_PAGO'));
      }

      pagosCreados.push(pago);
      facturasAfectadas.push(factura.id);
      montoRestante -= montoAplicar;
    }

    // 5. Obtener estado actualizado de las facturas afectadas
    const { data: facturasActualizadas } = await supabase
      .from('facturas')
      .select('id, numero_factura, valor_total, saldo_pendiente, estado')
      .in('id', facturasAfectadas);

    return res.status(201).json({
      message: `Abono general aplicado correctamente. Se crearon ${pagosCreados.length} pago(s).`,
      pagos_creados: pagosCreados.length,
      pagos: pagosCreados,
      facturas_actualizadas: facturasActualizadas,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/pagos/pago-multiple
 * Paga completamente el saldo pendiente de múltiples facturas seleccionadas.
 * Body: { factura_ids*[], fecha_pago, metodo_pago, referencia, notas }
 */
export async function pagoMultiple(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);
    const { factura_ids, fecha_pago, metodo_pago, referencia, notas } = req.body;

    const fechaPago = fecha_pago || new Date().toISOString().split('T')[0];
    const metodoPago = metodo_pago || 'efectivo';

    // 1. Obtener las facturas seleccionadas y validarlas
    const { data: facturas, error: errorFacturas } = await supabase
      .from('facturas')
      .select('id, numero_factura, estado, saldo_pendiente')
      .in('id', factura_ids);

    if (errorFacturas || !facturas) {
      return next(createError(500, 'Error al obtener las facturas.', 'ERROR_OBTENER_FACTURAS'));
    }

    // 2. Validar que todas las facturas son elegibles (no anuladas, no pagadas, con saldo)
    const noElegibles = facturas.filter(
      (f) => f.estado === 'anulada' || f.estado === 'pagada' || parseFloat(f.saldo_pendiente) <= 0
    );

    if (noElegibles.length > 0) {
      const nums = noElegibles.map((f) => f.numero_factura || f.id.slice(0, 8)).join(', ');
      return next(createError(
        400,
        `Las siguientes facturas no pueden ser pagadas (ya pagadas o anuladas): ${nums}`,
        'FACTURAS_NO_ELEGIBLES'
      ));
    }

    // 3. Crear un pago por cada factura por el total de su saldo pendiente
    const pagosCreados = [];

    for (const factura of facturas) {
      const montoAplicar = parseFloat(factura.saldo_pendiente);

      const { data: pago, error: errorPago } = await supabase
        .from('pagos')
        .insert({
          factura_id: factura.id,
          monto: montoAplicar,
          fecha_pago: fechaPago,
          metodo_pago: metodoPago,
          referencia: referencia?.trim() || null,
          notas: notas?.trim() || null,
          registrado_por: req.user.id,
        })
        .select()
        .single();

      if (errorPago) {
        return next(createError(500, `Error al registrar pago para factura ${factura.numero_factura}.`, 'ERROR_REGISTRAR_PAGO'));
      }

      pagosCreados.push(pago);
    }

    // 4. Obtener estado actualizado
    const { data: facturasActualizadas } = await supabase
      .from('facturas')
      .select('id, numero_factura, valor_total, saldo_pendiente, estado')
      .in('id', factura_ids);

    const totalPagado = pagosCreados.reduce((s, p) => s + p.monto, 0);

    return res.status(201).json({
      message: `Pago múltiple registrado. ${pagosCreados.length} factura(s) saldada(s).`,
      pagos_creados: pagosCreados.length,
      total_pagado: totalPagado,
      pagos: pagosCreados,
      facturas_actualizadas: facturasActualizadas,
    });
  } catch (err) {
    next(err);
  }
}
