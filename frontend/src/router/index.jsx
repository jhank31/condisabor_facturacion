import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import PrivateRoute from './PrivateRoute';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ClientesLista from '../pages/clientes/ClientesLista';
import ClienteDetalle from '../pages/clientes/ClienteDetalle';
import FacturasLista from '../pages/facturas/FacturasLista';
import FacturaCrear from '../pages/facturas/FacturaCrear';
import FacturaDetalle from '../pages/facturas/FacturaDetalle';
import Usuarios from '../pages/usuarios/Usuarios';
import AppBootstrap from '../App';

function RootLayout() {
  return (
    <AuthProvider>
      <AppBootstrap />
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <Login /> },
      {
        path: '/',
        element: <PrivateRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: 'dashboard', element: <Dashboard /> },
              {
                path: 'clientes',
                element: <PrivateRoute roles={['admin', 'gestor']} />,
                children: [
                  { index: true, element: <ClientesLista /> },
                  { path: ':id', element: <ClienteDetalle /> },
                ],
              },
              {
                path: 'facturas',
                element: <PrivateRoute roles={['admin', 'gestor']} />,
                children: [
                  { index: true, element: <FacturasLista /> },
                  {
                    path: 'crear',
                    element: <PrivateRoute roles={['admin', 'gestor']} />,
                    children: [{ index: true, element: <FacturaCrear /> }],
                  },
                  { path: ':id', element: <FacturaDetalle /> },
                ],
              },
              {
                path: 'usuarios',
                element: <PrivateRoute roles={['admin']} />,
                children: [{ index: true, element: <Usuarios /> }],
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
