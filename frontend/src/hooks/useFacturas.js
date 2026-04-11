import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../lib/axios';

export function useFacturas(filters = {}) {
  return useQuery({
    queryKey: ['facturas', filters],
    queryFn: async () => {
      const res = await apiClient.get('/api/facturas', { params: filters });
      return res.data;
    },
  });
}

export function useFactura(id) {
  return useQuery({
    queryKey: ['factura', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/facturas/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCrearFactura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, file }) => {
      const form = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v != null && v !== '') form.append(k, v);
      });
      if (file) form.append('adjunto', file);
      const res = await apiClient.post('/api/facturas', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facturas'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Factura creada correctamente');
    },
  });
}

export function useActualizarFactura(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.patch(`/api/facturas/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facturas'] });
      qc.invalidateQueries({ queryKey: ['factura', id] });
      toast.success('Factura actualizada correctamente');
    },
  });
}
