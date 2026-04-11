import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { METODOS_PAGO, METODOS_PAGO_LABELS } from '../../utils/constants';
import LoadingSpinner from '../ui/LoadingSpinner';

function buildSchema(maxMonto) {
  return z.object({
    monto: z.coerce
      .number()
      .min(1, 'El monto debe ser mayor a 0')
      .max(maxMonto, `El monto no puede superar $${maxMonto.toLocaleString('es-CO')}`),
    fecha_pago: z.string().min(1, 'La fecha es obligatoria'),
    metodo_pago: z.enum(METODOS_PAGO).optional(),
    referencia: z.string().optional(),
    notas: z.string().optional(),
  });
}

const inputCls =
  'w-full bg-surface-container-highest border-none rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/40 font-semibold text-sm transition-all';

export default function PagoForm({ onSubmit, onCancel, loading, saldoPendiente = 0 }) {
  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildSchema(saldoPendiente)),
    defaultValues: { fecha_pago: today, metodo_pago: 'transferencia' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Monto */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-on-surface-variant uppercase">Monto del abono *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">$</span>
          <input {...register('monto')} type="number" min="1" placeholder="0.00" className={`${inputCls} pl-7`} />
        </div>
        {errors.monto && <p className="text-xs text-error font-semibold">{errors.monto.message}</p>}
      </div>

      {/* Fecha */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-on-surface-variant uppercase">Fecha del pago *</label>
        <input {...register('fecha_pago')} type="date" className={inputCls} />
        {errors.fecha_pago && <p className="text-xs text-error font-semibold">{errors.fecha_pago.message}</p>}
      </div>

      {/* Método */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-on-surface-variant uppercase">Método de pago</label>
        <select {...register('metodo_pago')} className={inputCls}>
          {METODOS_PAGO.map((m) => (
            <option key={m} value={m}>{METODOS_PAGO_LABELS[m]}</option>
          ))}
        </select>
      </div>

      {/* Referencia */}
      <div className="space-y-1 md:col-span-1">
        <label className="text-xs font-bold text-on-surface-variant uppercase">Referencia</label>
        <input {...register('referencia')} placeholder="Número de comprobante" className={inputCls} />
      </div>

      {/* Notas */}
      <div className="space-y-1 md:col-span-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase">Notas</label>
        <input {...register('notas')} placeholder="Observaciones adicionales" className={inputCls} />
      </div>

      {/* Actions */}
      <div className="md:col-span-3 flex justify-end gap-3 pt-2 border-t border-surface-container-high">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-sm bg-primary text-white shadow-lg hover:bg-primary-container transition-all disabled:opacity-60"
        >
          {loading && <LoadingSpinner size="sm" />}
          Registrar Abono
        </button>
      </div>
    </form>
  );
}
