import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { DIAS_PLAZO } from '../../utils/constants';
import { apiClient } from '../../lib/axios';
import FileDropzone from '../ui/FileDropzone';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';
import CurrencyInput from '../ui/CurrencyInput';

const schema = z.object({
  cliente_id: z.string().uuid('Seleccione un cliente'),
  numero_factura: z.string().optional(),
  valor_total: z.coerce.number().min(1, 'El valor total es obligatorio'),
  dias_plazo: z.coerce.number().refine((v) => DIAS_PLAZO.includes(v), 'Seleccione un plazo'),
  fecha_emision: z.string().min(1, 'La fecha de emisión es obligatoria'),
  fecha_vencimiento: z.string().optional(),
  notas: z.string().optional(),
});

const inputCls =
  'w-full bg-white border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/40 shadow-sm text-sm transition-all placeholder:text-slate-400';

function Field({ label, error, required, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-semibold text-on-surface">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-error font-semibold">{error}</p>}
    </div>
  );
}

export default function FacturaForm({ onSubmit, loading }) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha_emision: today,
      dias_plazo: 30,
    },
  });

  const diasPlazo = watch('dias_plazo');
  const fechaEmision = watch('fecha_emision');

  useEffect(() => {
    if (!fechaEmision || !diasPlazo) return;
    const d = new Date(fechaEmision);
    d.setUTCDate(d.getUTCDate() + Number(diasPlazo));
    setValue('fecha_vencimiento', d.toISOString().split('T')[0]);
  }, [fechaEmision, diasPlazo, setValue]);

  useEffect(() => {
    if (!busqueda || busqueda.length < 2) { setClientes([]); return; }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await apiClient.get('/api/clientes', { params: { buscar: busqueda, limit: 8 } });
        setClientes(res.data.data ?? []);
        setShowDropdown(true);
      } catch { setClientes([]); }
      finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const handleClienteSelect = (c) => {
    setClienteSeleccionado(c);
    setBusqueda(c.nombre_negocio);
    setValue('cliente_id', c.id);
    setShowDropdown(false);
  };

  const handleFileSelect = (f, err) => {
    if (err) { setFileError(err); setFile(null); return; }
    setFile(f); setFileError('');
  };

  const onFormSubmit = (data) => {
    onSubmit(data, file);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* Sección 1: Datos de la factura */}
      <div className="bg-surface-container-low rounded-xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-secondary-container fill-icon">description</span>
          <h4 className="font-bold text-lg text-primary">Datos de la Factura</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cliente */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-sm font-semibold text-on-surface">
              Cliente asociado <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
              <input
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setClienteSeleccionado(null); setValue('cliente_id', ''); }}
                onFocus={() => clientes.length > 0 && setShowDropdown(true)}
                placeholder="Buscar por NIT o nombre de empresa..."
                className={`${inputCls} pl-12`}
              />
              {buscando && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              {showDropdown && clientes.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl border border-outline-variant/20 z-10 mt-1 overflow-hidden">
                  {clientes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => handleClienteSelect(c)}
                      className="flex items-center justify-between w-full px-4 py-3 hover:bg-surface-container-low text-left transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold text-primary">{c.nombre_negocio}</p>
                        <p className="text-xs text-slate-500">{c.tipo_id}: {c.numero_id}</p>
                      </div>
                      <Badge estado={c.estado_credito} tipo="credito" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {clienteSeleccionado?.estado_credito === 'bloqueado' && (
              <div className="flex items-center gap-2 text-xs text-secondary font-semibold bg-secondary-container/10 px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-sm">warning</span>
                Este cliente tiene el crédito bloqueado.
              </div>
            )}
            <input type="hidden" {...register('cliente_id')} />
            {errors.cliente_id && <p className="text-xs text-error font-semibold">{errors.cliente_id.message}</p>}
          </div>

          {/* Número de factura */}
          <Field label="Número de factura" error={errors.numero_factura?.message}>
            <input {...register('numero_factura')} placeholder="Se genera automáticamente" className={`${inputCls} font-mono`} />
          </Field>

          {/* Valor total */}
          <Field label="Valor total ($)" required error={errors.valor_total?.message}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">$</span>
              <Controller
                name="valor_total"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="factura-valor-total"
                    value={field.value || 0}
                    onChange={field.onChange}
                    placeholder="0"
                    className={`${inputCls} pl-8 font-bold text-lg`}
                  />
                )}
              />
            </div>
          </Field>

          {/* Fecha emisión */}
          <Field label="Fecha de emisión" error={errors.fecha_emision?.message}>
            <input {...register('fecha_emision')} type="date" className={inputCls} />
          </Field>

          {/* Días de plazo */}
          <Field label="Días de plazo" required error={errors.dias_plazo?.message}>
            <Controller
              name="dias_plazo"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-4 gap-2">
                  {DIAS_PLAZO.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => field.onChange(d)}
                      className={`py-3 rounded-lg text-sm font-bold transition-all ${
                        field.value === d
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            />
          </Field>

          {/* Fecha vencimiento */}
          <Field label="Fecha de vencimiento" error={errors.fecha_vencimiento?.message}>
            <input {...register('fecha_vencimiento')} type="date" className={`${inputCls} italic bg-white/60`} />
          </Field>

          {/* Notas */}
          <Field label="Notas" className="md:col-span-2">
            <textarea {...register('notas')} rows={3} placeholder="Observaciones adicionales..." className={`${inputCls} resize-none`} />
          </Field>
        </div>
      </div>

      {/* Sección 2: PDF */}
      <div className="bg-surface-container-low rounded-xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-secondary-container fill-icon">upload_file</span>
          <h4 className="font-bold text-lg text-primary">Adjunto Soporte</h4>
        </div>
        <FileDropzone
          file={file}
          onFileSelect={handleFileSelect}
          onRemove={() => { setFile(null); setFileError(''); }}
        />
        {fileError && <p className="text-xs text-error font-semibold mt-2">{fileError}</p>}
      </div>

      {/* Buttons */}
      <div className="flex flex-col md:flex-row items-center justify-end gap-4 pb-6">
        <button
          type="button"
          onClick={() => navigate('/facturas')}
          className="w-full md:w-auto px-8 py-3 text-secondary font-bold hover:bg-secondary/5 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-3 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
        >
          {loading && <LoadingSpinner size="sm" />}
          Crear Factura
        </button>
      </div>
    </form>
  );
}
