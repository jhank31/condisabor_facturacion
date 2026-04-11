import axios from 'axios';
import { toast } from 'sonner';

// En desarrollo: VITE_API_URL no se define → baseURL queda vacío →
// rutas relativas (/api/...) y el proxy de Vite redirige a localhost:3000.
// En producción (Vercel + Koyeb): VITE_API_URL apunta al backend en Koyeb.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
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
