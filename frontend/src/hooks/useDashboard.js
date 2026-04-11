import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/axios';

export function useDashboardKpis() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const res = await apiClient.get('/api/dashboard/kpis');
      return res.data;
    },
  });
}

export function useClientesMora() {
  return useQuery({
    queryKey: ['dashboard', 'mora'],
    queryFn: async () => {
      const res = await apiClient.get('/api/dashboard/mora');
      return res.data;
    },
  });
}

export function useCobrosMensuales() {
  return useQuery({
    queryKey: ['dashboard', 'cobros-mensuales'],
    queryFn: async () => {
      const res = await apiClient.get('/api/dashboard/cobros-mensuales');
      return res.data;
    },
  });
}

export function useResumenCartera() {
  return useQuery({
    queryKey: ['dashboard', 'cartera'],
    queryFn: async () => {
      const res = await apiClient.get('/api/dashboard/cartera');
      // RPC devuelve { por_antigüedad, por_estado, fecha_consulta }
      return res.data;
    },
  });
}

export function useDashboardKpisFormatted() {
  return useDashboardKpis();
}
