import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { METODOS_PAGO, METODOS_PAGO_LABELS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import CurrencyInput from '../ui/CurrencyInput';
import LoadingSpinner from '../ui/LoadingSpinner';

function buildSchema(maxMonto) {
  return z.object({
    monto: z.number({ invalid_type_error: 'Ingrese un monto válido' })
      .min(1, 'El monto debe ser mayor a 0')
      .max(maxMonto, `El monto no puede superar ${formatCurrency(maxMonto)}`),
    fecha_pago: z.string().min(1, 'La fecha es obligatoria'),
    metodo_pago: z.enum(METODOS_PAGO).optional(),
    referencia: z.string().optional(),
    notas: z.string().optional(),
  });
}

const inputCls =
  'w-full bg-surface-container-highest border-none rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/40 font-semibold text-sm transition-all';

/**
 * Campo de monto: editable si no hay montoFijo, de solo lectura si sí.
 */
function MontoField({ control, errors, maxMonto, montoFijo }) {
  const { field } = useController({ name: 'monto', control });

  if (montoFijo != null && montoFijo > 0) {
    // Modo lectura: monto fijo (pago múltiple)
    return (
      <div className="space-y-1 md:col-span-2">
        <label className="text-xs font-bold text-on-surface-variant uppercase">
          Monto a pagar
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm pointer-events-none">
            $
          </span>
          <div className={`${inputCls} pl-7 text-lg font-bold bg-surface-container-low text-primary flex items-center`}>
            {formatCurrency(montoFijo)}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">lock</span>
          Monto fijo: saldo total de las facturas seleccionadas
        </p>
      </div>
    );
  }

  // Modo editable: abono libre
  return (
    <div className="space-y-1 md:col-span-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase">
        Monto del abono *
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm pointer-events-none">
          $
        </span>
        <CurrencyInput
          id="pago-monto"
          value={field.value || 0}
          onChange={field.onChange}
          placeholder="0"
          className={`${inputCls} pl-7 text-lg font-bold`}
        />
      </div>
      {maxMonto > 0 && (
        <p className="text-[11px] text-slate-400 font-medium">
          Saldo pendiente:{' '}
          <span className="text-primary font-bold">{formatCurrency(maxMonto)}</span>
        </p>
      )}
      {errors.monto && (
        <p className="text-xs text-error font-semibold">{errors.monto.message}</p>
      )}
    </div>
  );
}

/**
 * PagoForm — Formulario de abono a una factura.
 * Props:
 *   saldoPendiente — máximo permitido (y valor para la etiqueta informativa)
 *   montoFijo      — si se pasa, el monto queda bloqueado en ese valor (pago múltiple)
 */
export default function PagoForm({ onSubmit, onCancel, loading, saldoPendiente = 0, montoFijo }) {
  const today = new Date().toISOString().split('T')[0];
  const efectivoMax = montoFijo ?? saldoPendiente;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildSchema(efectivoMax)),
    defaultValues: {
      fecha_pago: today,
      metodo_pago: 'transferencia',
      monto: montoFijo ?? 0,
    },
  });

  const handleFormSubmit = (data) => {
    // Si hay monto fijo, asegurar que va el valor correcto
    onSubmit({ ...data, monto: montoFijo ?? data.monto });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* Monto — fila completa */}
      <MontoField
        control={control}
        errors={errors}
        maxMonto={saldoPendiente}
        montoFijo={montoFijo}
      />

      {/* Fecha */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-on-surface-variant uppercase">Fecha del pago *</label>
        <input {...register('fecha_pago')} type="date" className={inputCls} />
        {errors.fecha_pago && (
          <p className="text-xs text-error font-semibold">{errors.fecha_pago.message}</p>
        )}
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
      <div className="space-y-1">
        <label className="text-xs font-bold text-on-surface-variant uppercase">Referencia</label>
        <input
          {...register('referencia')}
          placeholder="Número de comprobante"
          className={inputCls}
        />
      </div>

      {/* Notas */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-on-surface-variant uppercase">Notas</label>
        <input
          {...register('notas')}
          placeholder="Observaciones adicionales"
          className={inputCls}
        />
      </div>

      {/* Actions */}
      <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-surface-container-high">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-sm bg-primary text-white shadow-lg hover:bg-primary-container transition-all disabled:opacity-60"
        >
          {loading && <LoadingSpinner size="sm" />}
          {montoFijo ? 'Confirmar Pago' : 'Registrar Abono'}
        </button>
      </div>
    </form>
  );
}
