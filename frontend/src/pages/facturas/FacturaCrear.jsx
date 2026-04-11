import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import FacturaForm from '../../components/forms/FacturaForm';
import { useCrearFactura } from '../../hooks/useFacturas';

export default function FacturaCrear() {
  const navigate = useNavigate();
  const { mutate: crear, isPending } = useCrearFactura();

  const handleSubmit = (data, file) => {
    crear(
      { data, file },
      { onSuccess: (res) => navigate(`/facturas/${res.data?.id ?? ''}`) }
    );
  };

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link to="/facturas" className="hover:text-primary transition-colors">Facturas</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary font-semibold">Nueva Factura</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold font-headline text-primary">Crear Nueva Factura</h2>
        <p className="text-sm text-on-surface-variant mt-1">Completa los datos para registrar la factura en cartera.</p>
      </div>

      <FacturaForm onSubmit={handleSubmit} loading={isPending} />
    </div>
  );
}
