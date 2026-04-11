import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useUsuarios, useCrearUsuario, useEditarUsuario } from '../../hooks/useUsuarios';
import { formatDate, getInitials } from '../../utils/formatters';
import { ROLES, ROLES_LABELS } from '../../utils/constants';

const createSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre_completo: z.string().min(2, 'El nombre es obligatorio'),
  rol: z.enum(ROLES),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

const editSchema = z.object({
  nombre_completo: z.string().min(2, 'El nombre es obligatorio'),
  rol: z.enum(ROLES),
  activo: z.boolean().optional(),
});

const inputCls =
  'w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/40 placeholder:text-slate-400 font-medium text-sm transition-all';

function UsuarioForm({ defaultValues, onCreate, onEdit, onCancel, loading, isEdit }) {
  const schema = isEdit ? editSchema : createSchema;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues });

  const onSubmit = isEdit ? onEdit : onCreate;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {!isEdit && (
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Email *</label>
            <input {...register('email')} type="email" placeholder="usuario@empresa.com" className={inputCls} />
            {errors.email && <p className="text-xs text-error font-semibold">{errors.email.message}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700">Nombre Completo *</label>
          <input {...register('nombre_completo')} placeholder="Nombre del usuario" className={inputCls} />
          {errors.nombre_completo && <p className="text-xs text-error font-semibold">{errors.nombre_completo.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700">Rol *</label>
          <select {...register('rol')} className={inputCls}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLES_LABELS[r]}</option>)}
          </select>
          {errors.rol && <p className="text-xs text-error font-semibold">{errors.rol.message}</p>}
        </div>

        {!isEdit && (
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Contraseña inicial *</label>
            <input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" className={inputCls} />
            {errors.password && <p className="text-xs text-error font-semibold">{errors.password.message}</p>}
          </div>
        )}

        {isEdit && (
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Estado</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input {...register('activo')} type="checkbox" className="w-5 h-5 rounded accent-primary" />
              <span className="text-sm font-semibold text-on-surface">Usuario activo</span>
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-low">
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
        >
          {loading && <LoadingSpinner size="sm" />}
          {isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  );
}

export default function Usuarios() {
  const [modalCrear, setModalCrear] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const { data, isLoading } = useUsuarios();
  const { mutate: crear, isPending: creando } = useCrearUsuario();
  const { mutate: editar, isPending: editando } = useEditarUsuario(editTarget?.id);

  const usuarios = data?.data ?? [];

  const COLUMNS = [
    {
      key: 'nombre_completo',
      label: 'Usuario',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {getInitials(row.nombre_completo)}
          </div>
          <div>
            <p className="font-bold text-primary text-sm">{row.nombre_completo}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'rol',
      label: 'Rol',
      render: (row) => <Badge estado={row.rol} tipo="rol" />,
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (row) => (
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${row.activo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Creado',
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setEditTarget(row); }}
          className="p-2 rounded-full text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
      ),
    },
  ];

  const handleCrear = (values) => {
    crear(values, { onSuccess: () => setModalCrear(false) });
  };

  const handleEditar = (values) => {
    editar(values, { onSuccess: () => setEditTarget(null) });
  };

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline text-primary">Gestión de Usuarios</h2>
          <p className="text-sm text-on-surface-variant">{usuarios.length} usuarios en el sistema</p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <span className="material-symbols-outlined">person_add</span>
          Nuevo Usuario
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={COLUMNS}
        data={usuarios}
        loading={isLoading}
        emptyIcon="manage_accounts"
        emptyTitle="Sin usuarios"
        emptyDescription="Crea el primer usuario del sistema."
      />

      {/* Modal Crear */}
      <Modal isOpen={modalCrear} onClose={() => setModalCrear(false)} title="Nuevo Usuario" subtitle="Crea una cuenta de acceso al sistema">
        <UsuarioForm
          onCreate={handleCrear}
          onCancel={() => setModalCrear(false)}
          loading={creando}
          isEdit={false}
        />
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Usuario" subtitle={editTarget?.email}>
        <UsuarioForm
          defaultValues={editTarget ?? {}}
          onEdit={handleEditar}
          onCancel={() => setEditTarget(null)}
          loading={editando}
          isEdit
        />
      </Modal>
    </div>
  );
}
