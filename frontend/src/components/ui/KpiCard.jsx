export default function KpiCard({ titulo, valor, icono, colorBorde = 'border-primary/20', colorIcono = 'text-primary', bgIcono = 'bg-surface-container-low', subtexto }) {
  return (
    <div className={`bg-surface-container-lowest p-6 rounded-xl shadow-sm border-b-4 ${colorBorde} hover:-translate-y-1 transition-transform`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 ${bgIcono} rounded-lg ${colorIcono}`}>
          <span className="material-symbols-outlined">{icono}</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{titulo}</p>
      <h3 className={`text-2xl font-bold font-headline ${colorIcono}`}>{valor}</h3>
      {subtexto && <p className="text-xs text-on-surface-variant mt-1">{subtexto}</p>}
    </div>
  );
}
