// src/controllers/dashboard.controller.js
// Endpoints del dashboard: KPIs, mora, cartera y cobros mensuales.
// Todos delegan al RPC de Supabase excepto cobros-mensuales (consulta manual).

import { getSupabaseUser } from '../config/supabase.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * GET /api/dashboard/kpis
 * Llama RPC get_dashboard_kpis() → JSON con totales generales.
 */
export async function getKpis(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);

    const { data, error } = await supabase.rpc('get_dashboard_kpis');

    if (error) {
      return next(createError(500, 'Error al obtener los KPIs del dashboard.', 'ERROR_KPIS'));
    }

    return res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/mora
 * Llama RPC get_clientes_en_mora() → lista de clientes morosos.
 */
export async function getMora(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);

    const { data, error } = await supabase.rpc('get_clientes_en_mora');

    if (error) {
      return next(createError(500, 'Error al obtener clientes en mora.', 'ERROR_MORA'));
    }

    return res.json({ data: data || [], count: data?.length ?? 0 });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/cartera
 * Llama RPC get_resumen_cartera() → aging de cartera.
 */
export async function getCartera(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);

    const { data, error } = await supabase.rpc('get_resumen_cartera');

    if (error) {
      return next(createError(500, 'Error al obtener el resumen de cartera.', 'ERROR_CARTERA'));
    }

    return res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/cobros-mensuales
 * Suma de pagos.monto agrupado por mes — últimos 12 meses.
 * Respuesta: [{ mes: '2024-01', total: 5000000 }, ...]
 */
export async function getCobrosMensuales(req, res, next) {
  try {
    const supabase = getSupabaseUser(req.user.accessToken);

    // Calcular fecha inicio: hace 12 meses desde el primer día del mes actual
    const ahora = new Date();
    const hace12Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1);
    const fechaInicio = hace12Meses.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('pagos')
      .select('monto, fecha_pago')
      .gte('fecha_pago', fechaInicio)
      .order('fecha_pago', { ascending: true });

    if (error) {
      return next(createError(500, 'Error al obtener cobros mensuales.', 'ERROR_COBROS_MENSUALES'));
    }

    // Agrupar por mes (YYYY-MM) en memoria
    const agrupado = {};
    for (const pago of data || []) {
      const mes = pago.fecha_pago.substring(0, 7); // 'YYYY-MM'
      agrupado[mes] = (agrupado[mes] || 0) + parseFloat(pago.monto);
    }

    // Generar todos los meses del rango para no tener huecos
    const resultado = [];
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - 11 + i, 1);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      resultado.push({
        mes: mesKey,
        total: Math.round((agrupado[mesKey] || 0) * 100) / 100,
      });
    }

    return res.json(resultado);
  } catch (err) {
    next(err);
  }
}
