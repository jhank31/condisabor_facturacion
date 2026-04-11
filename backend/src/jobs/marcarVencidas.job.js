// src/jobs/marcarVencidas.job.js
// Cron job que ejecuta fn_marcar_facturas_vencidas() cada día a las 00:05.
// Usa supabaseAdmin (bypasea RLS) para la operación de mantenimiento.

import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Ejecuta la función RPC que marca como 'vencida' todas las facturas
 * cuya fecha_vencimiento < hoy y estado IN ('pendiente', 'parcial').
 */
async function marcarFacturasVencidas() {
  console.log('[CRON] Iniciando proceso de marcado de facturas vencidas...');

  const { data, error } = await supabaseAdmin.rpc('fn_marcar_facturas_vencidas');

  if (error) {
    console.error('[CRON] Error al marcar facturas vencidas:', error.message);
    return;
  }

  const cantidad = Array.isArray(data) ? data.length : (data ?? 0);
  console.log(`[CRON] ✅ Facturas marcadas como vencidas: ${cantidad}`);
}

/**
 * Registra el cron job. Se llama desde server.js al arrancar.
 * Horario: 00:05 todos los días (timezone del servidor).
 */
export function iniciarCronJobs() {
  cron.schedule('5 0 * * *', marcarFacturasVencidas, {
    scheduled: true,
    timezone: 'America/Bogota',
  });

  console.log('[CRON] ✅ Job de facturas vencidas registrado — se ejecuta a las 00:05 (Bogotá).');

  // Ejecutar inmediatamente al arrancar solo en desarrollo (opcional)
  if (process.env.RUN_CRON_ON_START === 'true') {
    console.log('[CRON] RUN_CRON_ON_START=true → Ejecutando inmediatamente...');
    marcarFacturasVencidas();
  }
}
