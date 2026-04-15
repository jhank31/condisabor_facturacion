// src/app.js
// Configuración de Express: middlewares globales, rutas y error handler.
// NO arranca el servidor — eso lo hace server.js.

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import facturasRoutes from './routes/facturas.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import storageRoutes from './routes/storage.routes.js';

import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Trust proxy (necesario en Render, Railway, etc.) ────────
// Render usa un proxy inverso que añade X-Forwarded-For.
// Sin esto, express-rate-limit lanza un ValidationError.
app.set('trust proxy', 1);

// ── Seguridad HTTP ──────────────────────────────────────────
// Para despliegue en red privada (VPN) sin certificados SSL:
// - HSTS desactivado por defecto; activar solo si FORCE_HTTPS=true
// - CSP desactivado para simplificar el acceso interno
// - crossOriginEmbedderPolicy desactivado para evitar bloqueos en red local
app.use(helmet({
  hsts: process.env.FORCE_HTTPS === 'true'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ────────────────────────────────────────────────────
const originsPermitidos = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Sin origin: peticiones desde Postman, curl o servidor mismo
    if (!origin) return callback(null, true);
    if (originsPermitidos.includes(origin)) return callback(null, true);
    callback(new Error(`Origin bloqueado por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Logging de requests ─────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Rate limiting global ────────────────────────────────────
const limiterGlobal = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Demasiadas solicitudes desde esta IP. Intenta nuevamente en 15 minutos.',
    code: 'RATE_LIMIT_EXCEDIDO',
  },
});
app.use('/api', limiterGlobal);

// ── Rate limiting estricto para login ──────────────────────
const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.',
    code: 'DEMASIADOS_INTENTOS_LOGIN',
  },
});
app.use('/api/auth/login', limiterLogin);

// ── Parseo de body ──────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CONDISABOR API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Rutas de la API ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/storage', storageRoutes);

// ── 404 para rutas no encontradas ──────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `La ruta ${req.method} ${req.path} no existe.`,
    code: 'RUTA_NO_ENCONTRADA',
  });
});

// ── Error handler global ────────────────────────────────────
app.use(errorHandler);

export default app;
