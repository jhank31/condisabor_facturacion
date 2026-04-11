export const TIPOS_ID = ['CC', 'NIT', 'RUT', 'CE', 'PASAPORTE'];

export const ESTADOS_CREDITO = ['al_dia', 'en_mora', 'reportado', 'bloqueado'];

export const ESTADOS_CREDITO_LABELS = {
  al_dia: 'Al día',
  en_mora: 'En mora',
  reportado: 'Reportado',
  bloqueado: 'Bloqueado',
};

export const ESTADOS_FACTURA = ['pendiente', 'parcial', 'pagada', 'vencida', 'anulada'];

export const ESTADOS_FACTURA_LABELS = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagada: 'Pagada',
  vencida: 'Vencida',
  anulada: 'Anulada',
};

export const METODOS_PAGO = ['efectivo', 'transferencia', 'cheque', 'otro'];

export const METODOS_PAGO_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  otro: 'Otro',
};

export const DIAS_PLAZO = [15, 30, 60, 90];

export const ROLES = ['admin', 'gestor'];

export const ROLES_LABELS = {
  admin: 'Administrador',
  gestor: 'Gestor',
};

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard', roles: ['admin', 'gestor'] },
  { key: 'clientes', label: 'Clientes', icon: 'group', path: '/clientes', roles: ['admin', 'gestor'] },
  { key: 'facturas', label: 'Facturas', icon: 'receipt_long', path: '/facturas', roles: ['admin', 'gestor'] },
  { key: 'usuarios', label: 'Usuarios', icon: 'manage_accounts', path: '/usuarios', roles: ['admin'] },
];
