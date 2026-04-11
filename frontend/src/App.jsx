import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { setupAxiosInterceptors } from './lib/axios';
import { useAuth } from './hooks/useAuth';

export default function AppBootstrap() {
  const { getToken, logout } = useAuth();

  useEffect(() => {
    setupAxiosInterceptors(getToken, logout);
  }, [getToken, logout]);

  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <Outlet />
    </>
  );
}
