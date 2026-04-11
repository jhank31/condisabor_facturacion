import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../lib/axios';

export function useClientes(filters = {}) {
  return useQuery({
    queryKey: ['clientes', filters],
    queryFn: async () => {
      const res = await apiClient.get('/api/clientes', { params: filters });
      return res.data;
    },
  });
}

export function useCliente(id) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/clientes/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCrearCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post('/api/clientes', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente creado correctamente');
    },
  });
}

export function useEditarCliente(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.patch(`/api/clientes/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      qc.invalidateQueries({ queryKey: ['cliente', id] });
      toast.success('Cliente actualizado correctamente');
    },
  });
}

export function useEliminarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await apiClient.delete(`/api/clientes/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente eliminado correctamente');
    },
  });
}
