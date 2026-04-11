import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../lib/axios';

export function useRegistrarPago(facturaId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post('/api/pagos', { ...data, factura_id: facturaId });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factura', facturaId] });
      qc.invalidateQueries({ queryKey: ['facturas'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Pago registrado correctamente');
    },
  });
}
