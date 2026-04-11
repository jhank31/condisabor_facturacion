# ── Etapa 1: dependencias de producción ──────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ── Etapa 2: imagen final de producción ──────────────────────────────────────
FROM node:20-alpine AS production

# Metadatos
LABEL maintainer="Condisabor" \
      description="API Gestión de Cartera — Condisabor" \
      version="1.0.0"

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S condisabor && \
    adduser  -S condisabor -u 1001 -G condisabor

WORKDIR /app

# Copiar dependencias ya instaladas desde la etapa anterior
COPY --from=deps --chown=condisabor:condisabor /app/node_modules ./node_modules

# Copiar solo el código fuente
COPY --chown=condisabor:condisabor src/        ./src/
COPY --chown=condisabor:condisabor package.json ./

# Cambiar al usuario no-root antes de arrancar
USER condisabor

# Variables de entorno por defecto (sobreescribir en deploy con --env-file)
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Health check contra el endpoint /health del propio servidor
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
