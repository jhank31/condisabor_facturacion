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

export function useAbonoGeneral(clienteId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post('/api/pagos/abono-general', {
        ...data,
        cliente_id: clienteId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['facturas'] });
      qc.invalidateQueries({ queryKey: ['cliente', clienteId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(
        data?.message ?? `Abono general aplicado: ${data?.pagos_creados ?? 0} pago(s) creado(s).`
      );
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ?? 'Error al aplicar el abono general.';
      toast.error(msg);
    },
  });
}

export function usePagoMultiple(clienteId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await apiClient.post('/api/pagos/pago-multiple', data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['facturas'] });
      if (clienteId) qc.invalidateQueries({ queryKey: ['cliente', clienteId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(
        data?.message ?? `Pago múltiple registrado: ${data?.pagos_creados ?? 0} factura(s) saldada(s).`
      );
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ?? 'Error al registrar el pago múltiple.';
      toast.error(msg);
    },
  });
}
