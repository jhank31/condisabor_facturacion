import { useMatches } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getInitials, getRolClasses } from '../../utils/formatters';
import { ROLES_LABELS } from '../../utils/constants';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/clientes': 'Clientes',
  '/facturas': 'Facturas',
  '/facturas/crear': 'Nueva Factura',
  '/auditoria': 'Auditoría',
  '/usuarios': 'Usuarios',
};

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname ?? '';

  let title = PAGE_TITLES[currentPath] ?? '';
  if (!title) {
    const base = '/' + currentPath.split('/')[1];
    if (base === '/clientes') title = 'Detalle de Cliente';
    else if (base === '/facturas') title = 'Detalle de Factura';
    else title = PAGE_TITLES[base] ?? '';
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden text-primary p-1"
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-lg font-bold text-primary font-headline uppercase tracking-tight hidden md:block">
          {title}
        </h1>
        <h1 className="text-lg font-bold text-primary font-headline md:hidden">Condisabor</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200/50">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-primary leading-none">{user.nombre_completo}</p>
              <p className="text-xs text-slate-500">{ROLES_LABELS[user.rol] ?? user.rol}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs">
              {getInitials(user.nombre_completo)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
