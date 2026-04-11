// src/server.js
// Punto de entrada del servidor.
// 1. Carga .env
// 2. Valida variables de entorno
// 3. Inicia cron jobs
// 4. Arranca Express en el puerto configurado

import 'dotenv/config';
import { validateEnv } from './config/env.js';

// Validar variables ANTES de importar nada que las use
validateEnv();

import app from './app.js';
import { iniciarCronJobs } from './jobs/marcarVencidas.job.js';

const PORT = parseInt(process.env.PORT, 10) || 3000;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   CONDISABOR API — Gestión de Cartera     ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Supabase: ${process.env.SUPABASE_URL}`);
  console.log('');

  // Iniciar cron jobs después de que el servidor esté listo
  iniciarCronJobs();
});

// Manejo graceful de shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('[SERVER] Servidor cerrado correctamente.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[SERVER] SIGINT recibido. Cerrando servidor...');
  server.close(() => {
    console.log('[SERVER] Servidor cerrado correctamente.');
    process.exit(0);
  });
});

// Errores no capturados — loguear y no crashear silenciosamente
process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] UnhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[SERVER] UncaughtException:', err);
  process.exit(1);
});
