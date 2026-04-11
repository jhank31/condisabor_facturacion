import axios from 'axios';
import { toast } from 'sonner';

// baseURL vacío → rutas relativas (/api/...).
// En desarrollo: el proxy de Vite redirige /api → localhost:3000.
// En producción: nginx redirige /api → contenedor backend.
export const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

let getTokenFn = null;
let onUnauthorizedFn = null;

export function setupAxiosInterceptors(getToken, onUnauthorized) {
  getTokenFn = getToken;
  onUnauthorizedFn = onUnauthorized;
}

apiClient.interceptors.request.use((config) => {
  const token = getTokenFn?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorizedFn?.();
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      toast.error('No tienes permiso para realizar esta acción');
      return Promise.reject(error);
    }

    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      'Ocurrió un error inesperado';

    if (error.response?.status !== 404) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);
