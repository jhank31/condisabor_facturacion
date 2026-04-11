import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ClienteForm from '../../components/forms/ClienteForm';
import { useClientes, useCrearCliente, useEliminarCliente } from '../../hooks/useClientes';
import { useAuth } from '../../hooks/useAuth';
import { ESTADOS_CREDITO, ESTADOS_CREDITO_LABELS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

const COLUMNS = [
  {
    key: 'nombre_negocio',
    label: 'Negocio',
    render: (row) => (
      <div>
        <p className="font-bold text-primary">{row.nombre_negocio}</p>
        <p className="text-xs text-slate-500 font-mono">{row.tipo_id}: {row.numero_id}</p>
      </div>
    ),
  },
  {
    key: 'estado_credito',
    label: 'Estado',
    render: (row) => <Badge estado={row.estado_credito} tipo="credito" />,
  },
  { key: 'ciudad', label: 'Ciudad', render: (row) => <span className="text-sm">{row.ciudad ?? '—'}</span> },
  {
    key: 'limite_credito',
    label: 'Límite de crédito',
    render: (row) => <span className="font-mono font-bold">{formatCurrency(row.limite_credito ?? 0)}</span>,
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    render: (row) => <span className="text-sm font-medium">{row.telefono ?? '—'}</span>,
  },
];

export default function ClientesLista() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = ['admin', 'gestor'].includes(user?.rol);

  const [page, setPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading } = useClientes({ page, limit: 15, buscar: buscar || undefined, estado_credito: estadoFilter || undefined });
  const { mutate: crear, isPending: creando } = useCrearCliente();
  const { mutate: eliminar, isPending: eliminando } = useEliminarCliente();

  const clientes = data?.data ?? [];
  const pagination = data
    ? { total: data.count, page: data.page, limit: data.limit, totalPages: data.totalPages }
    : null;

  const handleCrear = (values) => {
    crear(values, {
      onSuccess: () => setModalCrear(false),
    });
  };

  const handleEliminar = () => {
    if (!confirmDelete) return;
    eliminar(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
    });
  };

  const columnsWithActions = [
    ...COLUMNS,
    ...(canWrite
      ? [
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(row); }}
                className="p-2 rounded-full text-slate-400 hover:bg-error/10 hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary">Clientes</h2>
          <p className="text-sm text-on-surface-variant">{data?.count ?? 0} clientes registrados</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setModalCrear(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            Nuevo Cliente
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
          <input
            value={buscar}
            onChange={(e) => { setBuscar(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, NIT..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={estadoFilter}
          onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[180px]"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_CREDITO.map((e) => (
            <option key={e} value={e}>{ESTADOS_CREDITO_LABELS[e]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columnsWithActions}
        data={clientes}
        loading={isLoading}
        pagination={pagination ? { ...pagination, totalPages: Math.ceil(pagination.total / pagination.limit) } : undefined}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/clientes/${row.id}`)}
        emptyIcon="group"
        emptyTitle="Sin clientes"
        emptyDescription="Crea el primer cliente usando el botón de arriba."
      />

      {/* Modal Crear */}
      <Modal isOpen={modalCrear} onClose={() => setModalCrear(false)} title="Nuevo Cliente" size="lg">
        <ClienteForm onSubmit={handleCrear} onCancel={() => setModalCrear(false)} loading={creando} />
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleEliminar}
        title="Eliminar cliente"
        message={`¿Estás seguro de eliminar a "${confirmDelete?.nombre_negocio}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        loading={eliminando}
      />
    </div>
  );
}
