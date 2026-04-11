import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../lib/axios';

export function useUsuarios(filters = {}) {
  return useQuery({
    queryKey: ['usuarios', filters],
    queryFn: async () => {
      const res = await apiClient.get('/api/usuarios', { params: filters });
      return res.data;
    },
  });
}

export function useCrearUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post('/api/usuarios', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario creado correctamente');
    },
  });
}

export function useEditarUsuario(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.patch(`/api/usuarios/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario actualizado correctamente');
    },
  });
}
