import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ClienteForm from '../../components/forms/ClienteForm';
import { useCliente, useEditarCliente } from '../../hooks/useClientes';
import { useFacturas } from '../../hooks/useFacturas';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters';
import { ROLES_LABELS } from '../../utils/constants';

const FACTURA_COLS = [
  {
    key: 'numero_factura',
    label: 'Factura',
    render: (row) => <span className="font-mono font-bold text-primary">{row.numero_factura ?? `#${row.id?.slice(0, 8)}`}</span>,
  },
  {
    key: 'estado',
    label: 'Estado',
    render: (row) => <Badge estado={row.estado} tipo="factura" />,
  },
  {
    key: 'valor_total',
    label: 'Valor Total',
    render: (row) => <span className="font-mono font-bold">{formatCurrency(row.valor_total)}</span>,
  },
  {
    key: 'saldo_pendiente',
    label: 'Saldo Pendiente',
    render: (row) => <span className="font-mono text-error font-bold">{formatCurrency(row.saldo_pendiente)}</span>,
  },
  {
    key: 'fecha_vencimiento',
    label: 'Vencimiento',
    render: (row) => <span className="text-sm">{formatDate(row.fecha_vencimiento)}</span>,
  },
];

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="font-semibold text-on-surface mt-0.5">{value ?? '—'}</span>
    </div>
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
  const [modalEditar, setModalEditar] = useState(false);

  const facturas = facturasData?.data ?? [];

  const handleEditar = (values) => {
    editar(values, { onSuccess: () => setModalEditar(false) });
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

  const totalFacturado = facturas.reduce((s, f) => s + (f.valor_total ?? 0), 0);
  const totalCobrado = facturas.reduce((s, f) => s + ((f.valor_total ?? 0) - (f.saldo_pendiente ?? 0)), 0);
  const totalPendiente = facturas.reduce((s, f) => s + (f.saldo_pendiente ?? 0), 0);

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link to="/clientes" className="hover:text-primary transition-colors">Clientes</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary font-semibold">{cliente.nombre_negocio}</span>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-primary to-primary-container rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
          {canWrite && (
            <button
              onClick={() => setModalEditar(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-sm transition-all"
            >
              <span className="material-symbols-outlined">edit</span>
              Editar Cliente
            </button>
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

      {/* Facturas */}
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
        <DataTable
          columns={FACTURA_COLS}
          data={facturas}
          onRowClick={(f) => navigate(`/facturas/${f.id}`)}
          emptyIcon="receipt_long"
          emptyTitle="Sin facturas"
        />
      </div>

      {/* Modal Editar */}
      <Modal isOpen={modalEditar} onClose={() => setModalEditar(false)} title="Editar Cliente" size="lg">
        <ClienteForm
          defaultValues={cliente}
          onSubmit={handleEditar}
          onCancel={() => setModalEditar(false)}
          loading={editando}
        />
      </Modal>
    </div>
  );
}
