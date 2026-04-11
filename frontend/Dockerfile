# ── Etapa 1: build de la app React ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero para aprovechar la caché de capas
COPY package*.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Copiar fuentes y construir
COPY . .

# VITE_SUPABASE_* son necesarias en build time (se embeben en el bundle)
# Pasarlas como build args y exponerlas como env vars antes del build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ── Etapa 2: servidor nginx con los archivos estáticos ────────────────────────
FROM nginx:alpine AS production

LABEL maintainer="Condisabor" \
      description="Frontend Gestión de Cartera — Condisabor" \
      version="1.0.0"

# Reemplazar la config por defecto de nginx con la nuestra
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Eliminar la config global que añade server_tokens on y otros defaults
RUN rm -f /etc/nginx/conf.d/default.conf.bak

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
