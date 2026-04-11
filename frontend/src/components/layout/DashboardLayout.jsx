import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS } from '../../utils/constants';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.rol)
  ).slice(0, 4);

  return (
    <div className="bg-surface min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-screen w-64 z-50">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-primary/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 flex-shrink-0 z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="md:pl-64 min-h-screen flex flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex justify-around items-center py-3 px-2 z-40">
        {visibleItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-slate-400'}`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
