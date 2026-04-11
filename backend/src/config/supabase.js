// src/config/supabase.js
// Exporta dos clientes de Supabase:
//   - getSupabaseUser(token): usa ANON_KEY + JWT del usuario → respeta RLS
//   - supabaseAdmin: usa SERVICE_ROLE_KEY → bypasea RLS (solo para admin ops)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Crea un cliente de Supabase autenticado con el JWT del usuario.
 * Este cliente RESPETA las políticas RLS definidas en la base de datos.
 * Usar para TODAS las operaciones de datos de usuarios.
 *
 * @param {string} accessToken - JWT del usuario extraído del header Authorization
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseUser(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      // Desactivar persistencia de sesión — el backend es stateless
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Cliente admin con SERVICE_ROLE_KEY.
 * BYPASEA RLS — usar ÚNICAMENTE para:
 *   - Validar JWTs (auth.getUser)
 *   - Crear/desactivar usuarios (auth.admin.*)
 *   - Operaciones de cron jobs
 *   - Generar URLs firmadas de Storage
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
