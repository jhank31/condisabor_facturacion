# Condisabor — Guia de Despliegue en la Nube

> **Proyecto:** Dashboard de Gestion de Cartera y Cobros
> **Stack:** React 18 (Vercel) + Express (Render) + Supabase Cloud
> **Costo mensual:** $0 (tier gratuito de los 3 servicios)
> **Ultima actualizacion:** Abril 2026

---

## Indice

1. [Arquitectura general](#1-arquitectura-general)
2. [Prerequisitos](#2-prerequisitos)
3. [Paso 1 — Supabase Cloud](#3-paso-1--supabase-cloud)
4. [Paso 2 — Backend en Render](#4-paso-2--backend-en-render)
5. [Paso 3 — Frontend en Vercel](#5-paso-3--frontend-en-vercel)
6. [Paso 4 — Conectar todo](#6-paso-4--conectar-todo)
7. [Verificar que todo funciona](#7-verificar-que-todo-funciona)
8. [Como hacer actualizaciones](#8-como-hacer-actualizaciones)
9. [Variables de entorno — Resumen completo](#9-variables-de-entorno--resumen-completo)
10. [Desarrollo local](#10-desarrollo-local)
11. [Solucion de problemas](#11-solucion-de-problemas)
12. [Limites del tier gratuito](#12-limites-del-tier-gratuito)

---

## 1. Arquitectura general

```
Empleado (navegador)
       │
       │  https://condisabor.vercel.app
       ▼
┌─────────────────┐
│     VERCEL      │
│  Frontend React │
│  (SPA estatica) │
└────────┬────────┘
         │  https://condisabor-backend.onrender.com/api/*
         ▼
┌─────────────────┐
│     RENDER      │
│  Backend Express│
│  (Node.js API)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SUPABASE CLOUD │
│  PostgreSQL     │
│  Auth (GoTrue)  │
│  Storage        │
└─────────────────┘
```

> **Nota sobre cold starts:** En el tier gratuito de Render, el backend se apaga tras 15 minutos
> sin trafico. La primera peticion despues de eso tarda ~30-50 segundos mientras el servidor
> se despierta. Las siguientes peticiones son instantaneas. Esto solo afecta al primer
> empleado que abre el dashboard tras un periodo de inactividad.

**Ventajas de esta arquitectura:**
- Deploys automaticos con `git push` (sin tocar servidores)
- HTTPS gratuito en todos los servicios
- Sin Docker, sin servidores, sin VPN
- Accesible desde cualquier lugar con internet
- Escala automaticamente si crece el uso

---

## 2. Prerequisitos

Antes de empezar necesitas:

- [ ] Una cuenta en **GitHub** con el repositorio del proyecto subido
- [ ] Una cuenta en **Supabase** (https://supabase.com) — ya la tienes si el proyecto esta funcionando
- [ ] Una cuenta en **Vercel** (https://vercel.com) — registro gratis con GitHub
- [ ] Una cuenta en **Render** (https://render.com) — registro gratis con GitHub (sin tarjeta de credito)

---

## 3. Paso 1 — Supabase Cloud

Si ya tienes el proyecto de Supabase configurado con las tablas, auth y storage, **no necesitas hacer nada aqui**. Solo necesitas tener a mano las credenciales.

### Obtener las credenciales

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto **Condisabor**
3. Menu lateral → **Project Settings** (icono de engranaje)
4. Seccion **API**

Anota estos 3 valores:

| Variable | Donde la encuentras | Para que se usa |
|----------|-------------------|-----------------|
| **Project URL** | API → Project URL | `SUPABASE_URL` (backend) y `VITE_SUPABASE_URL` (frontend) |
| **anon public** | API → Project API keys → anon public | `SUPABASE_ANON_KEY` (backend) y `VITE_SUPABASE_ANON_KEY` (frontend) |
| **service_role** | API → Project API keys → service_role (click "Reveal") | `SUPABASE_SERVICE_ROLE_KEY` (solo backend) |

> **Importante:** El `service_role` key tiene permisos totales sobre la base de datos.
> Solo va en el backend (Render). **NUNCA** lo pongas en el frontend.

---

## 4. Paso 2 — Backend en Render

### 4.1 — Crear el servicio

1. Ve a https://dashboard.render.com
2. Click en **New** → **Web Service**
3. Selecciona **Build and deploy from a Git repository** → **Next**
4. Conecta tu cuenta de GitHub si es la primera vez
5. Busca y selecciona el repositorio `condisabor` → **Connect**

### 4.2 — Configurar el servicio

| Campo | Valor |
|-------|-------|
| **Name** | `condisabor-backend` |
| **Region** | Oregon (US West) o el mas cercano a tus usuarios |
| **Branch** | `main` (o la rama que uses para produccion) |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node src/server.js` |
| **Instance Type** | **Free** |

### 4.3 — Configurar variables de entorno

Baja hasta la seccion **Environment Variables** y click en **Add Environment Variable** para cada una:

| Variable | Valor |
|----------|-------|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://<tu-project-id>.supabase.co` |
| `SUPABASE_ANON_KEY` | `<tu-anon-key>` |
| `SUPABASE_SERVICE_ROLE_KEY` | `<tu-service-role-key>` |
| `ALLOWED_ORIGINS` | `https://condisabor.vercel.app` |
| `FORCE_HTTPS` | `true` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX` | `100` |
| `RUN_CRON_ON_START` | `false` |

> **Nota sobre ALLOWED_ORIGINS:** Pon aqui el dominio exacto que Vercel te asigne.
> Si no sabes cual sera, primero despliega el frontend (paso 5) y vuelve a editar esta variable.
> Puedes poner multiples origenes separados por coma:
> `https://condisabor.vercel.app,https://condisabor-tu-usuario.vercel.app`

### 4.4 — Desplegar

Click en **Create Web Service**. Render va a:
1. Clonar tu repo
2. Entrar a la carpeta `backend`
3. Ejecutar `npm install`
4. Ejecutar `node src/server.js`
5. Asignarte una URL como: `https://condisabor-backend.onrender.com`

**Anota esta URL** — la necesitas para el frontend.

> El primer deploy tarda 2-3 minutos. Puedes ver el progreso en los logs de Render.

### 4.5 — Verificar

Abre en tu navegador:

```
https://condisabor-backend.onrender.com/health
```

Debe responder:

```json
{"status":"ok","service":"CONDISABOR API","version":"1.0.0","timestamp":"..."}
```

> Si tarda unos segundos en responder, es normal — el servicio puede estar despertandose (cold start).

---

## 5. Paso 3 — Frontend en Vercel

### 5.1 — Crear el proyecto

1. Ve a https://vercel.com/dashboard
2. Click en **Add New → Project**
3. Selecciona **Import Git Repository**
4. Busca y selecciona el repositorio `condisabor`

### 5.2 — Configurar el build

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` (click en "Edit" para cambiarlo) |
| **Build Command** | `npm run build` (Vercel lo detecta automaticamente) |
| **Output Directory** | `dist` (Vercel lo detecta automaticamente) |

### 5.3 — Configurar variables de entorno

En la seccion **Environment Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://<tu-project-id>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `<tu-anon-key>` |
| `VITE_API_URL` | `https://condisabor-backend.onrender.com` |

> **VITE_API_URL** es la URL que Render te asigno en el paso 4.4.
> **SIN** barra al final. Correcto: `https://xxx.onrender.com` — Incorrecto: `https://xxx.onrender.com/`

### 5.4 — Desplegar

Click en **Deploy**. Vercel va a:
1. Clonar tu repo
2. Entrar a la carpeta `frontend`
3. Ejecutar `npm install && npm run build` (embebiendo las variables `VITE_*` en el JavaScript)
4. Publicar los archivos estaticos en su CDN global

Te asignara una URL como: `https://condisabor.vercel.app`

---

## 6. Paso 4 — Conectar todo

Despues de desplegar ambos servicios, necesitas verificar que las URLs coincidan:

### 6.1 — Verificar CORS en Render

El dominio que Vercel te asigno debe estar en `ALLOWED_ORIGINS` del backend.

1. Ve a https://dashboard.render.com → tu servicio `condisabor-backend`
2. **Environment** (menu lateral)
3. Verifica que `ALLOWED_ORIGINS` tenga el dominio exacto de Vercel

Ejemplo:

```
ALLOWED_ORIGINS=https://condisabor.vercel.app
```

Si Vercel te dio un dominio distinto (como `condisabor-tu-usuario.vercel.app`), actualizalo.

### 6.2 — Verificar API URL en Vercel

1. Ve a https://vercel.com → tu proyecto
2. **Settings** → **Environment Variables**
3. Verifica que `VITE_API_URL` tenga la URL exacta de Render

> **Si cambias una variable en Vercel, debes re-desplegar** porque Vite las embebe en build time.
> Ve a **Deployments** → click en los 3 puntos del ultimo deploy → **Redeploy**.

---

## 7. Verificar que todo funciona

### 7.1 — Backend (Render)

Abre en tu navegador:

```
https://condisabor-backend.onrender.com/health
```

Respuesta esperada (puede tardar ~30 seg si el servicio estaba dormido):
```json
{"status":"ok","service":"CONDISABOR API","version":"1.0.0"}
```

### 7.2 — Frontend (Vercel)

Abre en tu navegador:

```
https://condisabor.vercel.app
```

Debe cargar la pagina de login.

### 7.3 — Conexion completa

1. Haz login con un usuario existente
2. Verifica que el dashboard cargue datos
3. Prueba crear/editar una factura
4. Abre la consola del navegador (F12 → Console) y verifica que no haya errores de CORS

**Si hay errores de CORS**, revisa:
- Que `ALLOWED_ORIGINS` en Render tenga el dominio exacto de Vercel (con `https://`)
- Que `VITE_API_URL` en Vercel tenga la URL exacta de Render (sin `/` al final)

---

## 8. Como hacer actualizaciones

### Deploy automatico (recomendado)

Tanto Vercel como Render hacen deploy automaticamente cuando haces `git push` a la rama `main`:

```bash
# En tu maquina local
git add .
git commit -m "descripcion del cambio"
git push
```

Eso es todo. En 1-2 minutos ambos servicios se actualizan automaticamente.

### Deploy manual (si necesitas forzarlo)

**Vercel:**
1. Dashboard → Deployments → Redeploy

**Render:**
1. Dashboard → tu servicio → **Manual Deploy** → **Deploy latest commit**

---

## 9. Variables de entorno — Resumen completo

### En Render (backend)

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno | `production` |
| `SUPABASE_URL` | URL del proyecto Supabase | `https://abcdef.supabase.co` |
| `SUPABASE_ANON_KEY` | Clave publica de Supabase | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta de Supabase | `sb_secret_...` |
| `ALLOWED_ORIGINS` | Dominio del frontend en Vercel | `https://condisabor.vercel.app` |
| `FORCE_HTTPS` | Forzar HTTPS | `true` |
| `RATE_LIMIT_WINDOW_MS` | Ventana de rate limit (ms) | `900000` |
| `RATE_LIMIT_MAX` | Max requests por ventana | `100` |
| `RUN_CRON_ON_START` | Ejecutar cron al arrancar | `false` |

### En Vercel (frontend)

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `https://abcdef.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clave publica de Supabase | `sb_publishable_...` |
| `VITE_API_URL` | URL del backend en Render | `https://condisabor-backend.onrender.com` |

> **Recordatorio:** Las variables `VITE_*` se embeben en el JavaScript durante el build.
> Si las cambias en Vercel, debes hacer un **Redeploy** para que apliquen.

---

## 10. Desarrollo local

Para trabajar localmente, el setup no cambia. El proxy de Vite sigue funcionando:

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env   # solo la primera vez, completar los valores
npm install
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

En desarrollo local:
- `VITE_API_URL` **no se define** (o queda vacio)
- Las peticiones `/api/*` las proxea Vite a `localhost:3000` automaticamente
- No necesitas Render ni Vercel para desarrollar

---

## 11. Solucion de problemas

### Error CORS en la consola del navegador

```
Access to XMLHttpRequest at 'https://xxx.onrender.com/api/...'
from origin 'https://condisabor.vercel.app' has been blocked by CORS policy
```

**Causa:** El dominio del frontend no esta en `ALLOWED_ORIGINS` del backend.

**Solucion:**
1. Ve a Render → tu servicio → **Environment**
2. Actualiza `ALLOWED_ORIGINS` con el dominio exacto de Vercel
3. Click en **Save Changes** → Render redespliega automaticamente

### El frontend carga pero no muestra datos

**Causa probable:** `VITE_API_URL` esta mal configurada o falta.

**Verificar:**
1. Abre la consola del navegador (F12 → Network)
2. Busca las peticiones a `/api/`
3. Si van a `https://condisabor.vercel.app/api/...` → falta `VITE_API_URL`
4. Si van a la URL de Render pero fallan → verificar que el backend este corriendo (puede estar dormido, espera ~30 seg)

### El backend en Render muestra "Build failed"

**Verificar:**
1. Que el **Root Directory** sea `backend`
2. Que el repositorio tenga `backend/package.json`
3. Ver los build logs en Render → tu servicio → **Events**

### El frontend en Vercel muestra "Build failed"

**Verificar:**
1. Que el **Root Directory** sea `frontend`
2. Que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` esten configuradas
3. Ver los build logs en Vercel para el error especifico

### Login no funciona

**Verificar:**
1. Que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel sean correctas
2. En Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL** debe ser `https://condisabor.vercel.app`
   - **Redirect URLs** debe incluir `https://condisabor.vercel.app/**`

### Las facturas no se marcan como vencidas automaticamente

El cron job de `marcarVencidas.job.js` se ejecuta dentro del proceso de Node.js en Render.
**En el tier gratuito**, si el backend se duerme por inactividad, el cron no se ejecuta hasta que
alguien haga una peticion y el servicio despierte.

**Verificar:**
1. Que el backend este corriendo (health check OK)
2. Revisa los logs en Render → tu servicio → **Logs**

> **Tip:** Si necesitas que el cron se ejecute siempre, puedes usar un servicio gratuito como
> [cron-job.org](https://cron-job.org) para hacer un ping a `https://tu-backend.onrender.com/health`
> cada 14 minutos. Esto mantiene el backend despierto y el cron activo.

---

## 12. Limites del tier gratuito

| Servicio | Limite gratis | Que pasa si lo superas |
|----------|--------------|----------------------|
| **Vercel** | 100 GB bandwidth/mes, 6000 min build/mes | Te pide upgrade a Pro ($20/mes) |
| **Render** | 750 hrs/mes, se duerme tras 15 min sin trafico | Puedes pagar $7/mes para que no se duerma |
| **Supabase** | 500MB DB, 1GB storage, 50k auth users/mes | Te pide upgrade a Pro ($25/mes) |

Para un dashboard de facturas con pocos usuarios, estos limites **sobran de largo**. No vas a necesitar pagar en mucho tiempo.

---

## Checklist de primer despliegue

- [ ] Credenciales de Supabase anotadas (URL, anon key, service role key)
- [ ] Backend desplegado en Render con todas las env vars
- [ ] Health check del backend responde OK
- [ ] Frontend desplegado en Vercel con todas las env vars
- [ ] `ALLOWED_ORIGINS` en Render tiene el dominio de Vercel
- [ ] `VITE_API_URL` en Vercel tiene la URL de Render
- [ ] Site URL en Supabase actualizado al dominio de Vercel
- [ ] Login funciona correctamente
- [ ] Dashboard carga datos
- [ ] Crear/editar factura funciona
- [ ] Sin errores de CORS en consola del navegador
