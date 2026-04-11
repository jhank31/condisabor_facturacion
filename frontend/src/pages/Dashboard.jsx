import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import KpiCard from '../components/ui/KpiCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import {
  useDashboardKpis,
  useClientesMora,
  useCobrosMensuales,
  useResumenCartera,
} from '../hooks/useDashboard';
import { formatCurrency, formatDate } from '../utils/formatters';

const PIE_COLORS = ['#031636', '#fc9430', '#ba1a1a', '#44474e'];

function CobrosMensualesChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCobros" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#031636" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#031636" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e1e3e4" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#75777f' }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
          tick={{ fontSize: 11, fill: '#75777f' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          formatter={(v) => formatCurrency(v)}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        />
        <Area type="monotone" dataKey="total" stroke="#031636" strokeWidth={2.5} fill="url(#gradCobros)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CarteraPieChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="valor">
          {data.map((_, idx) => (
            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => formatCurrency(v)}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function MoraTable({ clientes = [], navigate }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="bg-red-50">
          <th className="px-4 py-3 text-xs font-bold uppercase text-error/80">Cliente</th>
          <th className="px-4 py-3 text-xs font-bold uppercase text-error/80">Estado</th>
          <th className="px-4 py-3 text-xs font-bold uppercase text-error/80">Saldo Vencido</th>
          <th className="px-4 py-3 text-xs font-bold uppercase text-error/80">Días mora</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {clientes.map((c) => (
          <tr
            key={c.cliente_id}
            onClick={() => navigate(`/clientes/${c.cliente_id}`)}
            className="hover:bg-slate-50/50 cursor-pointer transition-colors"
          >
            <td className="px-4 py-3 font-semibold text-primary">{c.nombre_negocio}</td>
            <td className="px-4 py-3"><Badge estado={c.estado_credito} tipo="credito" /></td>
            <td className="px-4 py-3 font-mono font-bold text-error">{formatCurrency(c.total_saldo_vencido)}</td>
            <td className="px-4 py-3 text-xs text-slate-500">{c.dias_mora_maximo ?? 0}d</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis();
  const { data: mora } = useClientesMora();
  const { data: cobros } = useCobrosMensuales();
  const { data: cartera } = useResumenCartera();

  const clientesMora = mora?.data ?? [];
  // Backend devuelve el array directamente
  const cobrosMensuales = Array.isArray(cobros) ? cobros : [];
  // Backend: { por_estado: { pendientes, parciales, vencidas, pagadas } }
  const carteraPie = cartera?.por_estado
    ? [
        { estado: 'pendiente', valor: Number(cartera.por_estado.pendientes ?? 0) },
        { estado: 'parcial',   valor: Number(cartera.por_estado.parciales ?? 0) },
        { estado: 'vencida',   valor: Number(cartera.por_estado.vencidas ?? 0) },
        { estado: 'pagada',    valor: Number(cartera.por_estado.pagadas ?? 0) },
      ].filter((i) => i.valor > 0)
    : [];

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 space-y-8">
      {/* KPIs */}
      {kpisLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <KpiCard
            titulo="Cartera Total"
            valor={formatCurrency(kpis?.total_cartera_pendiente ?? 0)}
            icono="account_balance_wallet"
            colorBorde="border-primary/30"
            colorIcono="text-primary"
            bgIcono="bg-primary/10"
            subtexto="Saldo global pendiente"
          />
          <KpiCard
            titulo="Cobrado Este Mes"
            valor={formatCurrency(kpis?.cobrado_este_mes ?? 0)}
            icono="payments"
            colorBorde="border-green-300"
            colorIcono="text-green-600"
            bgIcono="bg-green-50"
            subtexto="Recaudo del mes actual"
          />
          <KpiCard
            titulo="Facturas Pendientes"
            valor={kpis?.facturas_pendientes_count ?? 0}
            icono="receipt_long"
            colorBorde="border-secondary-container/30"
            colorIcono="text-secondary-container"
            bgIcono="bg-secondary-container/10"
            subtexto={`${kpis?.facturas_vencidas_count ?? 0} vencidas`}
          />
          <KpiCard
            titulo="Clientes Activos"
            valor={kpis?.total_clientes_activos ?? 0}
            icono="group"
            colorBorde="border-primary-fixed-dim/30"
            colorIcono="text-primary"
            bgIcono="bg-primary-fixed/30"
            subtexto={`${kpis?.clientes_en_mora_count ?? 0} en mora`}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Cobros Mensuales */}
        <div className="xl:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-primary font-headline">Cobros Mensuales</h3>
              <p className="text-xs text-slate-500">Recaudo de los últimos 6 meses</p>
            </div>
            <div className="w-9 h-9 bg-surface-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
            </div>
          </div>
          <CobrosMensualesChart data={cobrosMensuales} />
        </div>

        {/* Distribución Cartera */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-primary font-headline">Distribución</h3>
              <p className="text-xs text-slate-500">Por estado de crédito</p>
            </div>
          </div>
          <CarteraPieChart data={carteraPie} />
          <div className="space-y-2 mt-2">
            {carteraPie.map((item, idx) => (
              <div key={item.estado} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                  <span className="text-on-surface-variant capitalize">{item.estado?.replace('_', ' ')}</span>
                </div>
                <span className="font-bold text-on-surface">{formatCurrency(item.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clientes en Mora */}
      {clientesMora.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-red-50/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-error font-headline">Alertas de Mora</h3>
                <p className="text-xs text-error/60">{clientesMora.length} clientes requieren atención</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/clientes')}
              className="text-sm font-bold text-error hover:text-error/70 transition-colors"
            >
              Ver todos
            </button>
          </div>
          <MoraTable clientes={clientesMora.slice(0, 5)} navigate={navigate} />
        </div>
      )}
    </div>
  );
}
