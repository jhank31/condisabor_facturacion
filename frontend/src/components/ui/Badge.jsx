import {
  getEstadoCreditoClasses,
  getEstadoFacturaClasses,
  getRolClasses,
} from '../../utils/formatters';
import {
  ESTADOS_CREDITO_LABELS,
  ESTADOS_FACTURA_LABELS,
  ROLES_LABELS,
} from '../../utils/constants';

export default function Badge({ estado, tipo = 'credito' }) {
  let label = estado;
  let classes = '';

  if (tipo === 'credito') {
    label = ESTADOS_CREDITO_LABELS[estado] ?? estado;
    classes = getEstadoCreditoClasses(estado);
  } else if (tipo === 'factura') {
    label = ESTADOS_FACTURA_LABELS[estado] ?? estado;
    classes = getEstadoFacturaClasses(estado);
  } else if (tipo === 'rol') {
    label = ROLES_LABELS[estado] ?? estado;
    classes = getRolClasses(estado);
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${classes}`}
    >
      {label}
    </span>
  );
}
