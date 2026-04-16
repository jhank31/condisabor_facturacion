export function formatCurrency(value) {
  if (value == null || value === '') return '$0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a raw numeric string into COP display format in real-time.
 * E.g. "2500000" → "2.500.000"
 */
export function formatCurrencyInput(raw) {
  if (raw == null || raw === '' || raw === '-') return '';
  const cleaned = String(raw).replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  const num = parseInt(cleaned, 10);
  return num.toLocaleString('es-CO');
}

/**
 * Parses a COP-formatted string back to a plain number.
 * E.g. "2.500.000" → 2500000, "$1.000" → 1000
 */
export function parseCurrencyInput(display) {
  if (!display) return 0;
  const cleaned = String(display).replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDateTime(ts) {
  if (!ts) return '—';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getDiasRestantes(fechaVenc) {
  if (!fechaVenc) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVenc);
  venc.setHours(0, 0, 0, 0);
  return Math.round((venc - hoy) / (1000 * 60 * 60 * 24));
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function getEstadoCreditoClasses(estado) {
  const map = {
    al_dia: 'bg-green-100 text-green-700',
    en_mora: 'bg-orange-100 text-orange-700',
    reportado: 'bg-red-100 text-error',
    bloqueado: 'bg-slate-200 text-slate-700',
  };
  return map[estado] ?? 'bg-slate-100 text-slate-600';
}

export function getEstadoFacturaClasses(estado) {
  const map = {
    pendiente: 'bg-blue-100 text-blue-700',
    parcial: 'bg-orange-50 text-orange-600',
    pagada: 'bg-green-100 text-green-700',
    vencida: 'bg-red-100 text-error',
    anulada: 'bg-slate-100 text-slate-500',
  };
  return map[estado] ?? 'bg-slate-100 text-slate-600';
}

export function getRolClasses(rol) {
  const map = {
    admin: 'bg-primary/10 text-primary-container',
    gestor: 'bg-secondary-container/10 text-secondary-container',
    auditor: 'bg-slate-100 text-slate-600',
  };
  return map[rol] ?? 'bg-slate-100 text-slate-600';
}

