import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS, ROLES_LABELS } from '../../utils/constants';
import { getInitials } from '../../utils/formatters';

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.rol)
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="h-screen w-64 flex flex-col bg-slate-50 border-r border-slate-200/50 z-50">
      {/* Brand */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white flex-shrink-0">
            <span className="material-symbols-outlined text-sm">restaurant_menu</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-primary font-headline">
              Condisabor
            </span>
            <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-widest">
              Institutional Hearth
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-primary font-bold border-r-4 border-secondary-container bg-surface-container-low opacity-90'
                  : 'text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200/50">
        <div className="px-3 py-2 space-y-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 hover:text-error hover:bg-red-50 transition-colors rounded-lg w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-t border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {getInitials(user.nombre_completo)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-primary truncate">{user.nombre_completo}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {ROLES_LABELS[user.rol] ?? user.rol}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
