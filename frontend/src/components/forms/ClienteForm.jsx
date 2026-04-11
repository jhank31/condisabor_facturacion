import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TIPOS_ID, ESTADOS_CREDITO, ESTADOS_CREDITO_LABELS } from '../../utils/constants';
import LoadingSpinner from '../ui/LoadingSpinner';

const schema = z.object({
  nombre_negocio: z.string().min(1, 'El nombre del negocio es obligatorio'),
  tipo_id: z.enum(TIPOS_ID, { errorMap: () => ({ message: 'Seleccione un tipo de ID' }) }),
  numero_id: z.string().min(1, 'El número de identificación es obligatorio'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  estado_credito: z.enum(ESTADOS_CREDITO).optional(),
  limite_credito: z.coerce.number().min(0, 'Debe ser mayor o igual a 0').optional(),
  notas: z.string().optional(),
});

function Field({ label, error, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-slate-700">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-error font-semibold">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/40 placeholder:text-slate-400 font-medium text-sm transition-all';

export default function ClienteForm({ defaultValues, onSubmit, onCancel, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {
      estado_credito: 'al_dia',
      limite_credito: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
      {/* Información del negocio */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-sm">storefront</span>
          </div>
          <h3 className="font-bold text-primary">Información del Negocio</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nombre del negocio" required error={errors.nombre_negocio?.message}>
            <input {...register('nombre_negocio')} placeholder="Ej: Distribuidora Central" className={inputCls} />
          </Field>

          <Field label="Estado de crédito" error={errors.estado_credito?.message}>
            <select {...register('estado_credito')} className={inputCls}>
              {ESTADOS_CREDITO.map((e) => (
                <option key={e} value={e}>{ESTADOS_CREDITO_LABELS[e]}</option>
              ))}
            </select>
          </Field>

          <Field label="Tipo de identificación" required error={errors.tipo_id?.message}>
            <select {...register('tipo_id')} className={inputCls}>
              <option value="">Seleccionar...</option>
              {TIPOS_ID.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Número de identificación" required error={errors.numero_id?.message}>
            <input {...register('numero_id')} placeholder="900.000.000-0" className={inputCls} />
          </Field>

          <Field label="Límite de crédito ($)" error={errors.limite_credito?.message}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">$</span>
              <input {...register('limite_credito')} type="number" min="0" placeholder="0" className={`${inputCls} pl-8`} />
            </div>
          </Field>
        </div>
      </div>

      {/* Contacto */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-sm">contact_phone</span>
          </div>
          <h3 className="font-bold text-primary">Información de Contacto</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Teléfono" error={errors.telefono?.message}>
            <input {...register('telefono')} placeholder="300 000 0000" className={inputCls} />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="contacto@negocio.com" className={inputCls} />
          </Field>

          <Field label="Dirección" error={errors.direccion?.message}>
            <input {...register('direccion')} placeholder="Cra. 1 # 2-3" className={inputCls} />
          </Field>

          <Field label="Ciudad" error={errors.ciudad?.message}>
            <input {...register('ciudad')} placeholder="Bogotá" className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Notas */}
      <Field label="Notas internas" error={errors.notas?.message}>
        <textarea
          {...register('notas')}
          rows={3}
          placeholder="Observaciones sobre hábitos de pago..."
          className={`${inputCls} resize-none`}
        />
      </Field>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-low">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
        >
          {loading && <LoadingSpinner size="sm" />}
          {defaultValues ? 'Guardar Cambios' : 'Crear Cliente'}
        </button>
      </div>
    </form>
  );
}
