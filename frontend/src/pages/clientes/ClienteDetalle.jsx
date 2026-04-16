import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ClienteForm from '../../components/forms/ClienteForm';
import AbonoGeneralForm from '../../components/forms/AbonoGeneralForm';
import PagoForm from '../../components/forms/PagoForm';
import { useCliente, useEditarCliente } from '../../hooks/useClientes';
import { useFacturas } from '../../hooks/useFacturas';
import { useAbonoGeneral, usePagoMultiple } from '../../hooks/usePagos';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters';

// Estados elegibles para pagos
const ESTADOS_ELEGIBLES = ['pendiente', 'parcial', 'vencida'];

const FACTURA_COLS_LABELS = [
  { key: 'numero_factura', label: 'Factura' },
  { key: 'estado', label: 'Estado' },
  { key: 'valor_total', label: 'Valor Total' },
  { key: 'saldo_pendiente', label: 'Saldo Pendiente' },
  { key: 'fecha_vencimiento', label: 'Vencimiento' },
];

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="font-semibold text-on-surface mt-0.5">{value ?? '—'}</span>
    </div>
  );
}

/** Fila de factura con checkbox */
function FacturaRow({ factura, checked, onToggle, onClick, elegible }) {
  return (
    <tr
      className="hover:bg-slate-50/50 transition-colors"
    >
      {/* Checkbox */}
      <td className="px-4 py-4 w-10">
        {elegible ? (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => { e.stopPropagation(); onToggle(factura.id); }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 accent-primary cursor-pointer rounded"
          />
        ) : (
          <span className="block w-4 h-4" />
        )}
      </td>
      {/* Factura — celdas clickeables */}
      <td className="px-6 py-4 cursor-pointer" onClick={() => onClick(factura)}>
        <span className="font-mono font-bold text-primary">
          {factura.numero_factura ?? `#${factura.id?.slice(0, 8)}`}
        </span>
      </td>
      <td className="px-6 py-4 cursor-pointer" onClick={() => onClick(factura)}>
        <Badge estado={factura.estado} tipo="factura" />
      </td>
      <td className="px-6 py-4 cursor-pointer" onClick={() => onClick(factura)}>
        <span className="font-mono font-bold">{formatCurrency(factura.valor_total)}</span>
      </td>
      <td className="px-6 py-4 cursor-pointer" onClick={() => onClick(factura)}>
        <span className="font-mono text-error font-bold">{formatCurrency(factura.saldo_pendiente)}</span>
      </td>
      <td className="px-6 py-4 cursor-pointer" onClick={() => onClick(factura)}>
        <span className="text-sm">{formatDate(factura.fecha_vencimiento)}</span>
      </td>
    </tr>
  );
}

/** Modal de pago múltiple con monto pre-llenado (solo fecha + método) */
function PagoMultipleForm({ onSubmit, onCancel, loading, facturas }) {
  const totalSaldo = facturas.reduce((s, f) => s + (f.saldo_pendiente ?? 0), 0);
  return (
    <PagoForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={loading}
      saldoPendiente={totalSaldo}
      montoFijo={totalSaldo}
    />
  );
}

export default function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = ['admin', 'gestor'].includes(user?.rol);

  const { data: cliente, isLoading } = useCliente(id);
  const { data: facturasData } = useFacturas({ cliente_id: id, limit: 50 });
  const { mutate: editar, isPending: editando } = useEditarCliente(id);
  const { mutate: aplicarAbono, isPending: aplicandoAbono } = useAbonoGeneral(id);
  const { mutate: pagarMultiple, isPending: pagandoMultiple } = usePagoMultiple(id);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalAbono, setModalAbono] = useState(false);
  const [modalPagoMultiple, setModalPagoMultiple] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState(new Set());

  const facturas = facturasData?.data ?? [];

  // Solo las facturas elegibles para pago/selección
  const facturasElegibles = facturas.filter((f) => ESTADOS_ELEGIBLES.includes(f.estado));

  // Facturas pendientes para el abono general (con saldo > 0)
  const facturasPendientes = facturasElegibles.filter((f) => (f.saldo_pendiente ?? 0) > 0);

  // Facturas actualmente seleccionadas
  const facturasSeleccionadas = facturas.filter((f) => seleccionadas.has(f.id));

  const totalSeleccionado = useMemo(
    () => facturasSeleccionadas.reduce((s, f) => s + (f.saldo_pendiente ?? 0), 0),
    [facturasSeleccionadas]
  );

  const totalFacturado = facturas.reduce((s, f) => s + (f.valor_total ?? 0), 0);
  const totalCobrado = facturas.reduce((s, f) => s + ((f.valor_total ?? 0) - (f.saldo_pendiente ?? 0)), 0);
  const totalPendiente = facturas.reduce((s, f) => s + (f.saldo_pendiente ?? 0), 0);

  // Toggle de checkbox individual
  const toggleSeleccion = (facturaId) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(facturaId)) next.delete(facturaId);
      else next.add(facturaId);
      return next;
    });
  };

  // Toggle seleccionar todas las elegibles
  const toggleAll = () => {
    const elegiblesIds = facturasElegibles.map((f) => f.id);
    const allSelected = elegiblesIds.every((id) => seleccionadas.has(id));
    if (allSelected) setSeleccionadas(new Set());
    else setSeleccionadas(new Set(elegiblesIds));
  };

  const allElegiblesSelected =
    facturasElegibles.length > 0 &&
    facturasElegibles.every((f) => seleccionadas.has(f.id));

  const someSelected = seleccionadas.size > 0;

  const handleEditar = (values) => {
    editar(values, { onSuccess: () => setModalEditar(false) });
  };

  const handleAbonoGeneral = (values) => {
    aplicarAbono(values, {
      onSuccess: () => {
        setModalAbono(false);
      },
    });
  };

  const handlePagoMultiple = (values) => {
    const factura_ids = [...seleccionadas];
    pagarMultiple(
      { ...values, monto: totalSeleccionado, factura_ids },
      {
        onSuccess: () => {
          setSeleccionadas(new Set());
          setModalPagoMultiple(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-8 text-center">
        <p className="text-on-surface-variant">Cliente no encontrado.</p>
        <button onClick={() => navigate('/clientes')} className="mt-4 text-primary font-bold hover:underline">
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 pb-32 md:pb-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link to="/clientes" className="hover:text-primary transition-colors">Clientes</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary font-semibold">{cliente.nombre_negocio}</span>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-primary to-primary-container rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold font-headline">
              {getInitials(cliente.nombre_negocio)}
            </div>
            <div>
              <h2 className="text-2xl font-bold font-headline">{cliente.nombre_negocio}</h2>
              <p className="text-white/60 text-sm">{cliente.tipo_id}: {cliente.numero_id}</p>
              <div className="mt-2">
                <Badge estado={cliente.estado_credito} tipo="credito" />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          {canWrite && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Abono General */}
              {facturasPendientes.length > 0 && (
                <button
                  id="btn-abono-general"
                  onClick={() => setModalAbono(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-sm transition-all"
                >
                  <span className="material-symbols-outlined text-sm">payments</span>
                  Abono General
                </button>
              )}
              {/* Editar */}
              <button
                id="btn-editar-cliente"
                onClick={() => setModalEditar(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-sm transition-all"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Editar Cliente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPIs financieros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border-b-4 border-primary/20">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Facturado</p>
          <p className="text-2xl font-bold font-headline text-primary mt-1">{formatCurrency(totalFacturado)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border-b-4 border-green-300">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cobrado</p>
          <p className="text-2xl font-bold font-headline text-green-600 mt-1">{formatCurrency(totalCobrado)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border-b-4 border-error/30">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Saldo Pendiente</p>
          <p className="text-2xl font-bold font-headline text-error mt-1">{formatCurrency(totalPendiente)}</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <InfoRow label="Ciudad" value={cliente.ciudad} />
        <InfoRow label="Dirección" value={cliente.direccion} />
        <InfoRow label="Teléfono" value={cliente.telefono} />
        <InfoRow label="Email" value={cliente.email} />
        <InfoRow label="Límite de Crédito" value={formatCurrency(cliente.limite_credito ?? 0)} />
        <InfoRow label="Registrado" value={formatDate(cliente.created_at)} />
      </div>

      {/* Notas */}
      {cliente.notas && (
        <div className="bg-surface-container-low rounded-xl px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Notas internas</p>
          <p className="text-sm text-on-surface-variant">{cliente.notas}</p>
        </div>
      )}

      {/* Facturas con tabla y checkboxes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-primary font-headline">Historial de Facturas</h3>
          {canWrite && (
            <Link
              to={`/facturas/crear`}
              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Nueva factura
            </Link>
          )}
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  {/* Checkbox seleccionar todas */}
                  <th className="px-4 py-4 w-10">
                    {canWrite && facturasElegibles.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allElegiblesSelected}
                        onChange={toggleAll}
                        className="w-4 h-4 accent-primary cursor-pointer rounded"
                        title="Seleccionar todas las facturas pendientes"
                      />
                    )}
                  </th>
                  {FACTURA_COLS_LABELS.map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {facturas.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                        <p className="font-semibold text-sm">Sin facturas</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  facturas.map((f) => (
                    <FacturaRow
                      key={f.id}
                      factura={f}
                      checked={seleccionadas.has(f.id)}
                      onToggle={canWrite ? toggleSeleccion : () => {}}
                      onClick={(fac) => navigate(`/facturas/${fac.id}`)}
                      elegible={canWrite && ESTADOS_ELEGIBLES.includes(f.estado)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      <Modal isOpen={modalEditar} onClose={() => setModalEditar(false)} title="Editar Cliente" size="lg">
        <ClienteForm
          defaultValues={cliente}
          onSubmit={handleEditar}
          onCancel={() => setModalEditar(false)}
          loading={editando}
        />
      </Modal>

      <Modal
        isOpen={modalAbono}
        onClose={() => setModalAbono(false)}
        title="Abono General"
        subtitle={`Distribuye automáticamente entre ${facturasPendientes.length} factura(s) pendiente(s)`}
        size="lg"
      >
        <AbonoGeneralForm
          onSubmit={handleAbonoGeneral}
          onCancel={() => setModalAbono(false)}
          loading={aplicandoAbono}
          facturasPendientes={facturasPendientes}
        />
      </Modal>

      <Modal
        isOpen={modalPagoMultiple}
        onClose={() => { setModalPagoMultiple(false); }}
        title={`Pagar ${seleccionadas.size} factura(s) seleccionada(s)`}
        subtitle={`Total a pagar: ${formatCurrency(totalSeleccionado)}`}
        size="md"
      >
        <PagoForm
          onSubmit={handlePagoMultiple}
          onCancel={() => setModalPagoMultiple(false)}
          loading={pagandoMultiple}
          saldoPendiente={totalSeleccionado}
        />
      </Modal>

      {/* Barra flotante de pago múltiple */}
      {canWrite && someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-primary text-white px-6 py-4 rounded-2xl shadow-2xl shadow-primary/40 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-sm font-bold">{seleccionadas.size}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-wide">Facturas seleccionadas</p>
              <p className="text-lg font-bold font-headline">{formatCurrency(totalSeleccionado)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => setSeleccionadas(new Set())}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              id="btn-pagar-seleccionadas"
              onClick={() => setModalPagoMultiple(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-primary font-bold text-sm hover:bg-white/90 transition-all shadow-lg"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              Pagar Seleccionadas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
