import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import { useFacturas } from '../../hooks/useFacturas';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate, getDiasRestantes } from '../../utils/formatters';
import { ESTADOS_FACTURA, ESTADOS_FACTURA_LABELS } from '../../utils/constants';

const COLUMNS = [
  {
    key: 'numero_factura',
    label: 'Factura',
    render: (row) => (
      <span className="font-mono font-bold text-primary">
        {row.numero_factura ?? `#${row.id?.slice(0, 8)}`}
      </span>
    ),
  },
  {
    key: 'cliente',
    label: 'Cliente',
    render: (row) => (
      <div>
        <p className="font-semibold text-sm text-primary">{row.clientes?.nombre_negocio ?? '—'}</p>
        <p className="text-xs text-slate-500 font-mono">{row.clientes?.numero_id}</p>
      </div>
    ),
  },
  {
    key: 'estado',
    label: 'Estado',
    render: (row) => <Badge estado={row.estado} tipo="factura" />,
  },
  {
    key: 'valor_total',
    label: 'Valor Total',
    render: (row) => <span className="font-mono font-bold text-sm">{formatCurrency(row.valor_total)}</span>,
  },
  {
    key: 'saldo_pendiente',
    label: 'Saldo Pendiente',
    render: (row) => (
      <span className={`font-mono font-bold text-sm ${row.saldo_pendiente > 0 ? 'text-error' : 'text-green-600'}`}>
        {formatCurrency(row.saldo_pendiente)}
      </span>
    ),
  },
  {
    key: 'fecha_vencimiento',
    label: 'Vencimiento',
    render: (row) => {
      const dias = getDiasRestantes(row.fecha_vencimiento);
      const vencida = dias !== null && dias < 0 && row.estado !== 'pagada';
      return (
        <div>
          <p className={`text-sm font-semibold ${vencida ? 'text-error' : ''}`}>{formatDate(row.fecha_vencimiento)}</p>
          {vencida && <p className="text-xs text-error">Vencida hace {Math.abs(dias)}d</p>}
          {dias !== null && dias >= 0 && dias <= 7 && row.estado !== 'pagada' && (
            <p className="text-xs text-orange-500">Vence en {dias}d</p>
          )}
        </div>
      );
    },
  },
];

export default function FacturasLista() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = ['admin', 'gestor'].includes(user?.rol);

  const [page, setPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const { data, isLoading } = useFacturas({ page, limit: 15, buscar: buscar || undefined, estado: estadoFilter || undefined });
  const facturas = data?.data ?? [];
  const pagination = data
    ? { total: data.count, page: data.page, limit: data.limit, totalPages: data.totalPages }
    : null;

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary">Facturas</h2>
          <p className="text-sm text-on-surface-variant">{data?.count ?? 0} facturas registradas</p>
        </div>
        {canCreate && (
          <Link
            to="/facturas/crear"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            Nueva Factura
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
          <input
            value={buscar}
            onChange={(e) => { setBuscar(e.target.value); setPage(1); }}
            placeholder="Buscar por número de factura..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={estadoFilter}
          onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[180px]"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_FACTURA.map((e) => (
            <option key={e} value={e}>{ESTADOS_FACTURA_LABELS[e]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={COLUMNS}
        data={facturas}
        loading={isLoading}
        pagination={pagination ? { ...pagination, totalPages: Math.ceil(pagination.total / pagination.limit) } : undefined}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/facturas/${row.id}`)}
        emptyIcon="receipt_long"
        emptyTitle="Sin facturas"
        emptyDescription="Crea la primera factura usando el botón de arriba."
      />
    </div>
  );
}
