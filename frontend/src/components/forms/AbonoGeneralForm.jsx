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
 * Calcula cómo se distribuiría el abono entre las facturas (de más vieja a más nueva).
 * Retorna array de { factura, montoAplicado, queda0 }
 */
function calcularDistribucion(facturas, montoTotal) {
  let restante = montoTotal;
  return facturas.map((f) => {
    if (restante <= 0) return { factura: f, montoAplicado: 0, saldada: false };
    const saldo = f.saldo_pendiente ?? 0;
    const aplicado = Math.min(restante, saldo);
    restante -= aplicado;
    return { factura: f, montoAplicado: aplicado, saldada: aplicado >= saldo };
  });
}

function MontoField({ control, errors, maxMonto }) {
  const { field } = useController({ name: 'monto', control });
  return (
    <div className="space-y-1.5 col-span-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase">
        Monto del abono general *
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-base pointer-events-none">
          $
        </span>
        <CurrencyInput
          id="abono-general-monto"
          value={field.value || 0}
          onChange={field.onChange}
          placeholder="0"
          className={`${inputCls} pl-7 text-xl font-bold py-3`}
        />
      </div>
      <p className="text-[11px] text-slate-400 font-medium">
        Total pendiente del cliente:{' '}
        <span className="text-primary font-bold">{formatCurrency(maxMonto)}</span>
      </p>
      {errors.monto && (
        <p className="text-xs text-error font-semibold">{errors.monto.message}</p>
      )}
    </div>
  );
}

export default function AbonoGeneralForm({
  onSubmit,
  onCancel,
  loading,
  facturasPendientes = [],
}) {
  const today = new Date().toISOString().split('T')[0];

  // Facturas ordenadas de más vieja a más nueva (ASC por fecha_emision).
  // Tiebreaker: created_at ASC (igual que el backend) para facturas del mismo día.
  const facturasOrdenadas = [...facturasPendientes].sort((a, b) => {
    const dateA = new Date(a.fecha_emision ?? a.fecha_vencimiento ?? 0);
    const dateB = new Date(b.fecha_emision ?? b.fecha_vencimiento ?? 0);
    if (dateA - dateB !== 0) return dateA - dateB; // fecha_emision ASC
    // Desempate: más vieja creada primero (created_at ASC)
    const createdA = new Date(a.created_at ?? 0);
    const createdB = new Date(b.created_at ?? 0);
    return createdA - createdB;
  });

  const totalPendiente = facturasOrdenadas.reduce(
    (s, f) => s + (f.saldo_pendiente ?? 0),
    0
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildSchema(totalPendiente)),
    defaultValues: {
      fecha_pago: today,
      metodo_pago: 'transferencia',
      monto: 0,
    },
  });

  const montoActual = watch('monto') || 0;
  const distribucion = montoActual > 0
    ? calcularDistribucion(facturasOrdenadas, montoActual)
    : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      {/* Grid superior — monto + campos */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monto — fila completa */}
        <MontoField control={control} errors={errors} maxMonto={totalPendiente} />

        {/* Fecha */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant uppercase">
            Fecha del pago *
          </label>
          <input {...register('fecha_pago')} type="date" className={inputCls} />
          {errors.fecha_pago && (
            <p className="text-xs text-error font-semibold">{errors.fecha_pago.message}</p>
          )}
        </div>

        {/* Método */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant uppercase">
            Método de pago
          </label>
          <select {...register('metodo_pago')} className={inputCls}>
            {METODOS_PAGO.map((m) => (
              <option key={m} value={m}>
                {METODOS_PAGO_LABELS[m]}
              </option>
            ))}
          </select>
        </div>

        {/* Referencia */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant uppercase">Referencia</label>
          <input
            {...register('referencia')}
            placeholder="Número de comprobante"
            className={inputCls}
          />
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-on-surface-variant uppercase">Notas</label>
          <input
            {...register('notas')}
            placeholder="Observaciones adicionales"
            className={inputCls}
          />
        </div>
      </div>

      {/* Preview de distribución */}
      {facturasOrdenadas.length > 0 && (
        <div className="bg-surface-container-low rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-surface-container">
            <span className="material-symbols-outlined text-primary text-sm">sort</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Distribución del abono
              </p>
              <p className="text-[10px] text-slate-400">De más antigua a más reciente</p>
            </div>
          </div>
          <div className="divide-y divide-surface-container">
            {facturasOrdenadas.map((f, idx) => {
              const dist = distribucion[idx];
              const aplicado = dist?.montoAplicado ?? 0;
              const saldada = dist?.saldada ?? false;
              const touched = aplicado > 0;
              const fechaMostrar = f.fecha_emision ?? f.fecha_vencimiento;

              return (
                <div
                  key={f.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    saldada
                      ? 'bg-green-50/60'
                      : touched
                      ? 'bg-amber-50/60'
                      : 'opacity-60'
                  }`}
                >
                  {/* Orden numérico */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      saldada
                        ? 'bg-green-100 text-green-700'
                        : touched
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {saldada ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Info factura */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary font-mono truncate">
                      {f.numero_factura ?? `#${f.id?.slice(0, 8)}`}
                    </p>
                    <p className="text-[11px] text-slate-500 flex gap-2">
                      {fechaMostrar && (
                        <span>
                          Emitida:{' '}
                          <span className="font-semibold">
                            {new Date(fechaMostrar).toLocaleDateString('es-CO', {
                              day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
                            })}
                          </span>
                        </span>
                      )}
                      <span>
                        Saldo:{' '}
                        <span className="font-semibold text-error">{formatCurrency(f.saldo_pendiente)}</span>
                      </span>
                    </p>
                  </div>

                  {/* Abono aplicado */}
                  {touched && (
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-sm font-bold ${
                          saldada ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {saldada ? '✓ Saldada' : `Abono: ${formatCurrency(aplicado)}`}
                      </p>
                      {!saldada && (
                        <p className="text-[11px] text-slate-400">
                          Queda: {formatCurrency((f.saldo_pendiente ?? 0) - aplicado)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Resumen total */}
          {montoActual > 0 && (
            <div className="px-4 py-3 bg-surface-container flex items-center justify-between">
              <p className="text-xs font-bold text-on-surface-variant uppercase">Total abonado</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(montoActual)}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-container-high">
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
          disabled={loading || montoActual <= 0}
          className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-sm bg-gradient-to-r from-secondary-container to-secondary text-white shadow-lg hover:opacity-90 transition-all disabled:opacity-60"
        >
          {loading && <LoadingSpinner size="sm" />}
          <span className="material-symbols-outlined text-sm">payments</span>
          Aplicar Abono General
        </button>
      </div>
    </form>
  );
}
