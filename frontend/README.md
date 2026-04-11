# Condisabor — Frontend

Sistema interno de gestión de cartera comercial. Interfaz construida con **React 18 + Vite + TailwindCSS**.

---

## Requisitos previos

- Node.js 20+
- Backend corriendo en `http://localhost:3000` (ver `/backend/README.md`)
- Proyecto Supabase activo (cloud o local)

---

## Arrancar en desarrollo

```bash
# 1. Ir a la carpeta del frontend
cd frontend

# 2. Instalar dependencias (solo la primera vez)
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales (ver sección Variables de entorno)

# 4. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:5173
```

El dev server tiene un **proxy automático**: cualquier petición a `/api/*` se redirige a `http://localhost:3000`, por lo que no hay problemas de CORS en desarrollo.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (HMR) en `:5173` |
| `npm run build` | Build de producción en `/dist` |
| `npm run preview` | Previsualizar el build de producción |

---

## Variables de entorno

Archivo: `frontend/.env`

```env
VITE_API_URL=http://localhost:3000        # URL base del backend
VITE_SUPABASE_URL=https://<id>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...  # Clave pública (anon key)
```

> **Nunca** coloques la `SUPABASE_SERVICE_ROLE_KEY` en el frontend. Esa clave es solo para el backend.

---

## Arquitectura

```
src/
├── components/
│   ├── layout/          # Sidebar, Topbar, DashboardLayout
│   ├── ui/              # Badge, KpiCard, DataTable, Modal, etc.
│   └── forms/           # ClienteForm, FacturaForm, PagoForm
│
├── contexts/
│   └── AuthContext.jsx  # Estado de autenticación global (token en memoria)
│
├── hooks/               # Custom hooks con React Query
│   ├── useAuth.js
│   ├── useClientes.js
│   ├── useFacturas.js
│   ├── usePagos.js
│   ├── useDashboard.js
│   ├── useUsuarios.js
│   └── useAuditoria.js
│
├── lib/
│   ├── axios.js         # Instancia Axios + interceptors (auth, errores)
│   ├── supabase.js      # Cliente Supabase (solo para autenticación)
│   └── queryClient.js   # Configuración de TanStack Query
│
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── clientes/        # ClientesLista, ClienteDetalle
│   ├── facturas/        # FacturasLista, FacturaCrear, FacturaDetalle
│   ├── auditoria/       # Auditoria
│   └── usuarios/        # Usuarios
│
├── router/
│   ├── index.jsx        # Rutas con React Router v6 (createBrowserRouter)
│   └── PrivateRoute.jsx # Guard de autenticación y roles
│
└── utils/
    ├── constants.js     # Enums, etiquetas, items de navegación
    └── formatters.js    # Formateo de moneda, fechas, clases de badges
```

---

## Flujo de autenticación

1. El usuario ingresa email/contraseña en `/login`
2. El frontend llama a `supabase.auth.signInWithPassword()`
3. Con el `access_token` obtenido, hace `GET /api/auth/me` al backend
4. El backend valida el token con Supabase y devuelve el perfil + rol del usuario
5. El `access_token` se guarda **en memoria** (no en localStorage)
6. El `refresh_token` lo maneja Supabase automáticamente
7. Axios adjunta el token en cada request: `Authorization: Bearer {token}`
8. Si el backend responde 401, el interceptor cierra sesión y redirige al login

---

## Control de acceso por roles

| Página | admin | gestor | auditor |
|---|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ |
| Clientes | ✓ | ✓ | — |
| Facturas | ✓ | ✓ | ✓ (solo lectura) |
| Crear Factura | ✓ | ✓ | — |
| Auditoría | ✓ | — | ✓ |
| Usuarios | ✓ | — | — |

---

## Stack tecnológico

| Librería | Versión | Uso |
|---|---|---|
| React | 18 | UI |
| Vite | 6 | Bundler |
| TailwindCSS | 3 | Estilos |
| React Router | 6 | Navegación |
| TanStack Query | 5 | Server state / caché |
| Axios | 1.7.9 | HTTP client |
| Supabase JS | 2 | Autenticación |
| React Hook Form | 7 | Formularios |
| Zod | 3 | Validación de esquemas |
| Recharts | 2 | Gráficas del dashboard |
| Sonner | 1 | Notificaciones toast |
| react-dropzone | 14 | Upload de archivos PDF |
