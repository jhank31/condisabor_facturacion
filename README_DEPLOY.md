# Condisabor — Guia Completa de Despliegue en VPS Windows

> **Proyecto:** Dashboard de Gestion de Cartera y Cobros
> **Stack:** React 18 + Express + Supabase Cloud + Docker
> **Ultima actualizacion:** Abril 2026

---

## Indice

1. [Requisitos del VPS](#1-requisitos-del-vps)
2. [Instalar software en el VPS](#2-instalar-software-en-el-vps)
3. [Clonar el repositorio](#3-clonar-el-repositorio)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Configurar variables de entorno](#5-configurar-variables-de-entorno)
6. [Construir y levantar los contenedores](#6-construir-y-levantar-los-contenedores)
7. [Verificar que todo funciona](#7-verificar-que-todo-funciona)
8. [Acceder al sistema](#8-acceder-al-sistema)
9. [Como hacer actualizaciones remotamente](#9-como-hacer-actualizaciones-remotamente)
10. [Comandos de administracion](#10-comandos-de-administracion)
11. [Inicio automatico con Windows](#11-inicio-automatico-con-windows)
12. [Solucion de problemas](#12-solucion-de-problemas)
13. [Arquitectura de red](#13-arquitectura-de-red)

---

## 1. Requisitos del VPS

| Requisito | Minimo | Tu VPS |
|-----------|--------|--------|
| RAM | 4 GB | 16 GB (sobra) |
| Disco | 10 GB libres | Verificar |
| SO | Windows Server 2019+ o Windows 10/11 Pro | - |
| Red | Acceso a internet (para descargar imagenes Docker) | Via VPN |
| Puerto 80 | Libre (no IIS ni otro web server) | Verificar |

---

## 2. Instalar software en el VPS

Conectate al VPS por **Escritorio Remoto (RDP)** a traves de la VPN y ejecuta todo en **PowerShell como Administrador**.

### 2.1 — Instalar Git

Descarga e instala desde: https://git-scm.com/download/win

Verifica la instalacion:

```powershell
git --version
```

Debe mostrar algo como `git version 2.4x.x`.

### 2.2 — Instalar Docker Desktop

Descarga desde: https://www.docker.com/products/docker-desktop/

Durante la instalacion:
- Marca la opcion **"Use WSL 2 instead of Hyper-V"** (recomendado)
- Reinicia el VPS si lo pide

Despues de reiniciar, abre Docker Desktop y espera a que el icono de la ballena en la barra de tareas quede **estable** (sin animacion).

Verifica la instalacion:

```powershell
docker --version
docker compose version
```

Ambos comandos deben responder con su version.

> **Importante:** Docker Desktop necesita una sesion de Windows activa para correr.
> Si el VPS reinicia y nadie hace login, Docker no arranca.
> En la seccion 11 se explica como resolver esto.

---

## 3. Clonar el repositorio

```powershell
# Elegir donde guardar el proyecto
cd C:\

# Clonar el repo (reemplazar con tu URL real)
git clone https://github.com/TU-USUARIO/condisabor.git

# Entrar a la carpeta del proyecto
cd C:\condisabor
```

Despues de clonar, la estructura en el VPS sera:

```
C:\condisabor\
├── backend\
├── frontend\
├── docker-compose.prod.yml
├── .env.example
└── README_DEPLOY.md         ← este archivo
```

---

## 4. Estructura del proyecto

```
C:\condisabor\
│
├── docker-compose.prod.yml     ← orquesta los 2 contenedores
│
├── .env.example                ← plantilla de variables para Supabase self-hosted (NO se usa en produccion cloud)
│
├── backend\
│   ├── Dockerfile              ← imagen Docker del backend
│   ├── .env.example            ← plantilla de variables del backend
│   ├── .env                    ← ⚠️ CREAR ESTE ARCHIVO (paso 5.1)
│   ├── package.json
│   └── src\                    ← codigo fuente del API
│       ├── server.js
│       ├── app.js
│       ├── config\
│       ├── controllers\
│       ├── middleware\
│       ├── routes\
│       ├── validators\
│       └── jobs\
│
└── frontend\
    ├── Dockerfile              ← imagen Docker del frontend
    ├── nginx.conf              ← configuracion de Nginx (proxy + SPA)
    ├── .env.example            ← plantilla de variables del frontend
    ├── package.json
    ├── index.html
    └── src\                    ← codigo fuente React
        ├── App.jsx
        ├── main.jsx
        ├── components\
        ├── contexts\
        ├── hooks\
        ├── lib\
        ├── pages\
        ├── router\
        └── utils\
```

---

## 5. Configurar variables de entorno

Hay **2 archivos** que debes crear manualmente en el VPS. **Nunca** deben subirse al repositorio.

### 5.1 — Backend: `C:\condisabor\backend\.env`

Este archivo contiene las credenciales del API. El backend lo lee al arrancar.

```powershell
# Copiar la plantilla
Copy-Item C:\condisabor\backend\.env.example C:\condisabor\backend\.env

# Abrir para editar
notepad C:\condisabor\backend\.env
```

Contenido que debe tener (reemplaza los valores entre `<>`):

```env
# ── Servidor ──────────────────────────────────────────────
PORT=3000
NODE_ENV=production

# ── Supabase ──────────────────────────────────────────────
# Obtenlos en: https://supabase.com/dashboard
# → Tu proyecto → Project Settings → API
SUPABASE_URL=https://<tu-project-id>.supabase.co
SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>

# ── CORS ──────────────────────────────────────────────────
# La IP privada del VPS en la red VPN.
# Ejemplo: si el VPS tiene IP 192.168.1.50 en la VPN:
ALLOWED_ORIGINS=http://192.168.1.50

# ── Seguridad HTTPS ──────────────────────────────────────
# false porque en red VPN interna no hay certificado SSL.
FORCE_HTTPS=false

# ── Rate limiting ────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# ── Cron jobs ────────────────────────────────────────────
# true = al arrancar, marca facturas vencidas automaticamente
RUN_CRON_ON_START=false
```

#### Donde conseguir los valores de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto **Condisabor**
3. Menu lateral → **Project Settings** (icono de engranaje)
4. Seccion **API**
5. Ahi encontraras:
   - **Project URL** → es tu `SUPABASE_URL`
   - **anon public** → es tu `SUPABASE_ANON_KEY`
   - **service_role** (click en "Reveal") → es tu `SUPABASE_SERVICE_ROLE_KEY`

#### Como saber la IP del VPS

En PowerShell del VPS:

```powershell
ipconfig
```

Busca el adaptador de red de la VPN. La **IPv4 Address** es la que usaras en `ALLOWED_ORIGINS`.

---

### 5.2 — Raiz del proyecto: `C:\condisabor\.env`

Este archivo lo lee `docker-compose.prod.yml` para pasarle las variables de Supabase al **build** del frontend. Vite las embebe en el JavaScript durante la compilacion.

```powershell
# Crear el archivo en la raiz del proyecto
notepad C:\condisabor\.env
```

Contenido (usa los **mismos** valores de SUPABASE_URL y ANON_KEY del paso anterior):

```env
VITE_SUPABASE_URL=https://<tu-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

> **Nota:** Este `.env` de raiz solo tiene 2 variables. NO pongas el `SERVICE_ROLE_KEY` aqui,
> porque se embeberia en el JavaScript del frontend y cualquiera podria verlo.

---

### 5.3 — Resumen de archivos `.env`

| Archivo | Ruta completa en el VPS | Que contiene | Quien lo lee |
|---------|------------------------|--------------|--------------|
| Backend `.env` | `C:\condisabor\backend\.env` | Credenciales del API, CORS, rate limits | El contenedor `backend` en runtime |
| Raiz `.env` | `C:\condisabor\.env` | `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` | `docker compose` durante el **build** del frontend |

**No existe** un `.env` dentro de `frontend\` en produccion. Las variables del frontend se pasan como build args de Docker.

---

## 6. Construir y levantar los contenedores

Asegurate de estar en la carpeta del proyecto:

```powershell
cd C:\condisabor
```

Ejecuta el build y arranque:

```powershell
docker compose -f docker-compose.prod.yml up -d --build
```

Este comando hace lo siguiente (puede tardar 2-5 minutos la primera vez):

1. **Construye la imagen del backend:**
   - Instala dependencias de Node.js (solo produccion)
   - Copia el codigo fuente
   - Expone el puerto 3000 internamente

2. **Construye la imagen del frontend:**
   - Instala dependencias de Node.js
   - Ejecuta `npm run build` (Vite compila React + embebe las variables `VITE_*`)
   - Copia los archivos estaticos a Nginx
   - Configura Nginx como proxy reverso

3. **Levanta ambos contenedores:**
   - `condisabor-backend` en la red interna (puerto 3000, NO expuesto)
   - `condisabor-frontend` en el puerto **80** (accesible desde la VPN)

4. **El frontend espera** a que el backend este `healthy` antes de arrancar.

---

## 7. Verificar que todo funciona

### 7.1 — Ver el estado de los contenedores

```powershell
docker compose -f docker-compose.prod.yml ps
```

Debes ver algo asi:

```
NAME                    STATUS              PORTS
condisabor-backend      Up (healthy)        3000/tcp
condisabor-frontend     Up (healthy)        0.0.0.0:80->80/tcp
```

Ambos deben decir **Up (healthy)**. Si uno dice `starting` o `unhealthy`, espera 30 segundos y vuelve a verificar.

### 7.2 — Ver los logs en tiempo real

```powershell
# Logs de ambos servicios
docker compose -f docker-compose.prod.yml logs -f

# Solo backend
docker compose -f docker-compose.prod.yml logs -f backend

# Solo frontend
docker compose -f docker-compose.prod.yml logs -f frontend
```

Presiona `Ctrl+C` para salir de los logs.

El backend debe mostrar:

```
╔═══════════════════════════════════════════╗
║   CONDISABOR API — Gestión de Cartera     ║
╚═══════════════════════════════════════════╝
 Servidor corriendo en http://localhost:3000
 Entorno: production
 Supabase: https://xxxxx.supabase.co
```

### 7.3 — Probar el health check del backend manualmente

```powershell
docker exec condisabor-backend wget -qO- http://localhost:3000/health
```

Debe responder:

```json
{"status":"ok","service":"CONDISABOR API","version":"1.0.0","timestamp":"..."}
```

---

## 8. Acceder al sistema

Desde cualquier **PC conectado a la VPN**, abre un navegador y ve a:

```
http://<IP-del-VPS>
```

Por ejemplo, si la IP del VPS en la VPN es `192.168.1.50`:

```
http://192.168.1.50
```

El flujo de red es:

```
Tu PC (en la VPN)
  │
  ├─ http://192.168.1.50          → Nginx sirve el frontend (React)
  │
  └─ http://192.168.1.50/api/*    → Nginx reenvía al backend (Express)
                                     internamente a backend:3000
```

| Servicio | Puerto interno | Puerto expuesto | Acceso |
|----------|----------------|-----------------|--------|
| Frontend (Nginx) | 80 | **80** | Desde la VPN |
| Backend (Node.js) | 3000 | **No expuesto** | Solo via Nginx |

---

## 9. Como hacer actualizaciones remotamente

### Flujo normal (sin ir a la empresa)

1. **En tu maquina local**, haces cambios y los subes:

```bash
git add .
git commit -m "descripcion del cambio"
git push
```

2. **Te conectas al VPS por Escritorio Remoto (RDP)** a traves de la VPN.

3. **En PowerShell del VPS**, ejecutas:

```powershell
cd C:\condisabor

# Descargar los ultimos cambios
git pull

# Reconstruir y reiniciar (sin downtime prolongado)
docker compose -f docker-compose.prod.yml up -d --build

# Limpiar imagenes viejas para liberar disco
docker image prune -f
```

Eso es todo. En 2-3 minutos el sistema esta actualizado.

### Script automatico (opcional)

Puedes crear un script para simplificarlo. Crea el archivo `C:\condisabor\deploy.ps1`:

```powershell
Set-Location C:\condisabor
Write-Host "Descargando ultimos cambios..." -ForegroundColor Cyan
git pull
Write-Host "Reconstruyendo contenedores..." -ForegroundColor Cyan
docker compose -f docker-compose.prod.yml up -d --build
Write-Host "Limpiando imagenes antiguas..." -ForegroundColor Cyan
docker image prune -f
Write-Host "Deploy completado." -ForegroundColor Green
docker compose -f docker-compose.prod.yml ps
```

Para ejecutarlo:

```powershell
powershell -ExecutionPolicy Bypass -File C:\condisabor\deploy.ps1
```

---

## 10. Comandos de administracion

Todos los comandos se ejecutan desde `C:\condisabor` en PowerShell.

### Detener el sistema

```powershell
docker compose -f docker-compose.prod.yml down
```

### Reiniciar un servicio especifico

```powershell
# Solo el backend
docker compose -f docker-compose.prod.yml restart backend

# Solo el frontend
docker compose -f docker-compose.prod.yml restart frontend
```

### Ver uso de recursos (CPU, RAM)

```powershell
docker stats condisabor-backend condisabor-frontend
```

### Ver los ultimos 100 logs del backend

```powershell
docker logs --tail 100 condisabor-backend
```

### Entrar al contenedor del backend (debug)

```powershell
docker exec -it condisabor-backend sh
```

### Reconstruir todo desde cero

```powershell
docker compose -f docker-compose.prod.yml down
docker rmi condisabor-frontend condisabor-backend
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 11. Inicio automatico con Windows

### Problema

Docker Desktop necesita una sesion activa. Si el VPS reinicia y nadie hace login, Docker no arranca y el sistema queda caido.

### Solucion A — Auto-login + Docker Desktop al inicio (simple)

1. En Docker Desktop → **Settings** → **General**:
   - Activar **"Start Docker Desktop when you sign in to your computer"**

2. Configurar auto-login en Windows:

```powershell
# Abrir la configuracion de auto-login
netplwiz
```

   - Desmarca **"Users must enter a user name and password to use this computer"**
   - Selecciona tu usuario y haz click en Apply
   - Ingresa la contraseña cuando lo pida

3. Los contenedores tienen `restart: unless-stopped` en el compose, asi que Docker los levantara automaticamente al arrancar.

### Solucion B — Docker Engine como servicio de Windows (robusta)

Si el VPS es Windows Server, puedes instalar Docker Engine (sin Desktop) que corre como servicio:

https://docs.docker.com/engine/install/windows-server/

Con esto, Docker arranca con Windows aunque nadie haga login.

---

## 12. Solucion de problemas

### El frontend no carga en el navegador

```powershell
# 1. Verificar que los contenedores esten corriendo
docker ps

# 2. Ver errores de Nginx
docker logs condisabor-frontend

# 3. Verificar que el puerto 80 este libre
netstat -ano | findstr :80
```

Si otro programa usa el puerto 80 (como IIS):

```powershell
# Ver que proceso usa el puerto 80
netstat -ano | findstr :80

# Detener IIS si esta corriendo
iisreset /stop
```

### El backend no responde (frontend muestra errores de red)

```powershell
# 1. Ver errores del backend
docker logs --tail 50 condisabor-backend

# 2. Probar el health check
docker exec condisabor-backend wget -qO- http://localhost:3000/health
```

**Errores comunes del backend:**

| Error en los logs | Causa | Solucion |
|-------------------|-------|----------|
| `SUPABASE_URL is required` | Falta `.env` del backend | Crear `C:\condisabor\backend\.env` (paso 5.1) |
| `Origin bloqueado por CORS` | `ALLOWED_ORIGINS` no coincide | Verificar la IP del VPS en `backend\.env` |
| `fetch failed` o `ECONNREFUSED` | No hay internet o Supabase esta caido | Verificar conexion a internet del VPS |

### Error "port is already allocated"

```powershell
# Ver que proceso usa el puerto
netstat -ano | findstr :80

# Terminar el proceso por su PID
Stop-Process -Id <PID> -Force

# Reiniciar los contenedores
docker compose -f docker-compose.prod.yml up -d
```

### Los contenedores dicen "unhealthy"

```powershell
# Ver el detalle del health check
docker inspect --format='{{json .State.Health}}' condisabor-backend
docker inspect --format='{{json .State.Health}}' condisabor-frontend
```

### Cambios en el .env del backend no se reflejan

El backend lee el `.env` al arrancar. Si cambias valores, debes reiniciar:

```powershell
docker compose -f docker-compose.prod.yml restart backend
```

### Cambios en las variables VITE_* del frontend no se reflejan

Las variables `VITE_*` se embeben en el JavaScript durante el **build**. Si cambias `C:\condisabor\.env`, debes **reconstruir**:

```powershell
docker compose -f docker-compose.prod.yml up -d --build frontend
```

---

## 13. Arquitectura de red

```
                         RED VPN
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    │   PC Usuario 1       │    PC Usuario 2      │
    │   (navegador)        │    (navegador)       │
    │                      │                      │
    └──────────┬───────────┼──────────┬───────────┘
               │                      │
               └──────────┬───────────┘
                          │
                  ┌───────▼────────┐
                  │   VPS Windows  │
                  │  IP: 192.168.x │
                  │   Puerto 80    │
                  └───────┬────────┘
                          │
              ┌───────────▼────────────┐
              │   Docker Network       │
              │   (condisabor-net)     │
              │                        │
              │  ┌──────────────────┐  │
              │  │    NGINX         │  │
              │  │  (frontend)      │  │
              │  │  Puerto 80       │  │
              │  │                  │  │
              │  │  /         → SPA │  │
              │  │  /api/*   ──┐   │  │
              │  └─────────────┼───┘  │
              │                │      │
              │  ┌─────────────▼───┐  │
              │  │   EXPRESS       │  │
              │  │  (backend)      │  │
              │  │  Puerto 3000    │  │
              │  │  (NO expuesto)  │  │
              │  └────────┬────────┘  │
              │           │           │
              └───────────┼───────────┘
                          │
                          ▼
                ┌─────────────────┐
                │  SUPABASE CLOUD │
                │  (PostgreSQL +  │
                │   Auth + Storage│
                │   + Realtime)   │
                └─────────────────┘
```

### Flujo de una peticion

1. El usuario en la VPN abre `http://192.168.x.x` en su navegador
2. Nginx recibe la peticion en el puerto 80
3. Si la ruta es `/api/*` → Nginx la reenvia al backend Express en el puerto 3000
4. Si es cualquier otra ruta → Nginx sirve el `index.html` de React
5. React en el navegador hace peticiones a `/api/*` que vuelven a pasar por Nginx → Express
6. Express se comunica con Supabase Cloud para leer/escribir datos

---

## Checklist de primer despliegue

Usa esta lista para no olvidar ningun paso:

- [ ] Docker Desktop instalado y corriendo en el VPS
- [ ] Git instalado en el VPS
- [ ] Repositorio clonado en `C:\condisabor`
- [ ] Archivo `C:\condisabor\backend\.env` creado con credenciales reales
- [ ] Archivo `C:\condisabor\.env` creado con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- [ ] `ALLOWED_ORIGINS` en `backend\.env` tiene la IP correcta del VPS
- [ ] `NODE_ENV=production` en `backend\.env`
- [ ] `docker compose -f docker-compose.prod.yml up -d --build` ejecutado
- [ ] Ambos contenedores muestran `Up (healthy)`
- [ ] Dashboard carga en `http://<IP-VPS>` desde un PC en la VPN
- [ ] Login funciona correctamente
- [ ] Auto-inicio de Docker configurado (seccion 11)
