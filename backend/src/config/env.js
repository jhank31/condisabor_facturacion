// src/config/env.js
// Valida que todas las variables de entorno requeridas existan al arranque.
// Si falta alguna, el proceso termina con error claro antes de iniciar el servidor.

const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ALLOWED_ORIGINS',
];

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Error: Faltan las siguientes variables de entorno:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('Por favor configura el archivo .env antes de arrancar.');
    process.exit(1);
  }

  console.log('✅ Variables de entorno validadas correctamente.');
}
