import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

function LoginField({ label, error, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-error font-semibold">{error}</p>}
    </div>
  );
}

export default function Login() {
  const { user, login, loading: authLoading } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  if (!authLoading && user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async ({ email, password }) => {
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg = err?.message ?? 'Credenciales incorrectas';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-slate-100/80 border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-white/50 text-on-surface placeholder:text-slate-400 font-medium text-sm transition-all';

  return (
    <div className="min-h-screen flex bg-primary overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary-container to-primary" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-white fill-icon">restaurant_menu</span>
            </div>
            <div>
              <h1 className="text-xl font-bold font-headline text-white tracking-tight">Condisabor</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Institutional Hearth</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold font-headline text-white leading-tight mb-4">
            Gestión de<br />
            <span className="text-secondary-container">Cartera</span>
          </h2>
          <p className="text-white/60 text-sm">
            Plataforma centralizada de control y seguimiento de cartera comercial.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Clientes activos', val: '0', icon: 'group' },
            { label: 'Facturas pendientes', val: '0', icon: 'receipt_long' },
            { label: 'Cartera total', val: '$0', icon: 'account_balance_wallet' },
            { label: 'Mora activa', val: '0%', icon: 'warning' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <span className="material-symbols-outlined text-white/40 text-sm mb-2 block">{s.icon}</span>
              <p className="text-2xl font-bold font-headline text-white">{s.val}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 bg-surface flex items-center justify-center p-8 relative">
        <div className="grain-overlay opacity-[0.02]" />

        <div className="w-full max-w-md z-10">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-10">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg fill-icon">restaurant_menu</span>
            </div>
            <span className="text-2xl font-bold font-headline text-primary">Condisabor</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200/50">
            <h2 className="text-2xl font-bold font-headline text-primary mb-1">Bienvenido</h2>
            <p className="text-slate-500 text-sm mb-8">Ingresa tus credenciales para continuar.</p>

            {authLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <LoginField label="Correo electrónico" error={errors.email?.message}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">email</span>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="tu@empresa.com"
                      autoComplete="email"
                      className={`${inputCls} pl-12`}
                    />
                  </div>
                </LoginField>

                <LoginField label="Contraseña" error={errors.password?.message}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">lock</span>
                    <input
                      {...register('password')}
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`${inputCls} pl-12 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">
                        {showPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </LoginField>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:scale-100"
                >
                  {submitting ? <LoadingSpinner size="sm" /> : <span className="material-symbols-outlined">login</span>}
                  Iniciar Sesión
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Sistema de uso interno. &copy; {new Date().getFullYear()} Condisabor.
          </p>
        </div>
      </div>
    </div>
  );
}
