import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import PagoForm from '../../components/forms/PagoForm';
import { useFactura } from '../../hooks/useFacturas';
import { useRegistrarPago } from '../../hooks/usePagos';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate, formatDateTime, getDiasRestantes } from '../../utils/formatters';
import { METODOS_PAGO_LABELS } from '../../utils/constants';

function ProgressBar({ valor, total }) {
  const pct = total > 0 ? Math.min(100, (valor / total) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5">
      <div
        className="h-2.5 rounded-full bg-gradient-to-r from-secondary-container to-secondary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PagoRow({ pago }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-green-600 text-sm">payments</span>
        </div>
        <div>
          <p className="text-sm font-bold text-primary">{formatCurrency(pago.monto)}</p>
          <p className="text-xs text-slate-500">
            {METODOS_PAGO_LABELS[pago.metodo_pago] ?? pago.metodo_pago ?? 'Sin método'} · {formatDate(pago.fecha_pago)}
          </p>
        </div>
      </div>
      {pago.referencia && (
        <span className="text-xs font-mono bg-surface-container-low px-2 py-1 rounded text-slate-500">
          {pago.referencia}
        </span>
      )}
    </div>
  );
}

export default function FacturaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canPay = ['admin', 'gestor'].includes(user?.rol);

  const { data: responseData, isLoading } = useFactura(id);
  const { mutate: registrarPago, isPending: registrando } = useRegistrarPago(id);
  const [showPagoForm, setShowPagoForm] = useState(false);

  // Backend devuelve { factura, cliente, pagos, url_adjunto }
  const factura = responseData?.factura;
  const cliente = responseData?.cliente;
  const pagos = responseData?.pagos ?? [];
  const archivoUrl = responseData?.url_adjunto;

  const handlePago = (data) => {
    registrarPago(data, { onSuccess: () => setShowPagoForm(false) });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="p-8 text-center">
        <p className="text-on-surface-variant">Factura no encontrada.</p>
        <button onClick={() => navigate('/facturas')} className="mt-4 text-primary font-bold hover:underline">
          Volver al listado
        </button>
      </div>
    );
  }

  const cobrado = (factura.valor_total ?? 0) - (factura.saldo_pendiente ?? 0);
  const diasRestantes = getDiasRestantes(factura.fecha_vencimiento);

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link to="/facturas" className="hover:text-primary transition-colors">Facturas</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary font-semibold">
          {factura.numero_factura ?? `#${id?.slice(0, 8)}`}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="xl:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-container rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="material-symbols-outlined text-white/50">receipt_long</span>
                  <span className="font-mono font-bold text-lg">
                    {factura.numero_factura ?? `#${id?.slice(0, 8)}`}
                  </span>
                </div>
                <h2 className="text-2xl font-bold font-headline">
                  {cliente?.nombre_negocio ?? '—'}
                </h2>
                <p className="text-white/60 text-sm mt-1">
                  Emitida: {formatDate(factura.fecha_emision)}
                </p>
              </div>
              <Badge estado={factura.estado} tipo="factura" />
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Valor Total</p>
                <p className="text-xl font-bold font-headline text-primary">{formatCurrency(factura.valor_total)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cobrado</p>
                <p className="text-xl font-bold font-headline text-green-600">{formatCurrency(cobrado)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pendiente</p>
                <p className="text-xl font-bold font-headline text-error">{formatCurrency(factura.saldo_pendiente)}</p>
              </div>
            </div>
            <ProgressBar valor={cobrado} total={factura.valor_total ?? 0} />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{Math.round((cobrado / (factura.valor_total || 1)) * 100)}% cobrado</span>
              <span>
                {diasRestantes !== null && diasRestantes >= 0
                  ? `Vence en ${diasRestantes} días`
                  : diasRestantes !== null && diasRestantes < 0
                  ? `Venció hace ${Math.abs(diasRestantes)} días`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Detalles */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Fecha Emisión', val: formatDate(factura.fecha_emision) },
              { label: 'Fecha Vencimiento', val: formatDate(factura.fecha_vencimiento) },
              { label: 'Días de Plazo', val: `${factura.dias_plazo ?? '—'} días` },
              { label: 'Cliente', val: cliente?.nombre_negocio },
              { label: 'NIT', val: cliente?.numero_id },
              { label: 'Ciudad', val: cliente?.ciudad },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
                <p className="font-semibold text-on-surface mt-0.5 text-sm">{item.val ?? '—'}</p>
              </div>
            ))}
          </div>

          {/* Notas */}
          {factura.notas && (
            <div className="bg-surface-container-low rounded-xl px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Notas</p>
              <p className="text-sm text-on-surface-variant">{factura.notas}</p>
            </div>
          )}
        </div>

        {/* Payment sidebar */}
        <div className="space-y-6">
          {/* Registrar Pago */}
          {canPay && ['pendiente', 'parcial', 'vencida'].includes(factura.estado) && (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-secondary-container to-secondary px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white">Registrar Abono</h3>
                  <p className="text-white/60 text-xs">Saldo: {formatCurrency(factura.saldo_pendiente)}</p>
                </div>
                <button
                  onClick={() => setShowPagoForm((v) => !v)}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <span className="material-symbols-outlined">{showPagoForm ? 'expand_less' : 'add'}</span>
                </button>
              </div>
              {showPagoForm && (
                <PagoForm
                  onSubmit={handlePago}
                  onCancel={() => setShowPagoForm(false)}
                  loading={registrando}
                  saldoPendiente={factura.saldo_pendiente ?? 0}
                />
              )}
            </div>
          )}

          {/* Historial de pagos */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-surface-container-low flex items-center justify-between">
              <h3 className="font-bold text-primary">Historial de Pagos</h3>
              <span className="bg-surface-container text-slate-500 text-xs font-bold px-2 py-1 rounded-full">
                {pagos.length}
              </span>
            </div>
            <div className="px-6">
              {pagos.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">Sin pagos registrados.</p>
              ) : (
                pagos.map((p) => <PagoRow key={p.id} pago={p} />)
              )}
            </div>
          </div>

          {/* Adjunto PDF */}
          {archivoUrl && (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-primary mb-3">Soporte Adjunto</h3>
              <a
                href={archivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-primary truncate">Factura adjunta</p>
                  <p className="text-[10px] text-slate-400">Ver documento PDF</p>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm">open_in_new</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
