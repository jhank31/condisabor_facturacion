import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-slate-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable({
  columns,
  data = [],
  loading = false,
  pagination,
  onPageChange,
  onRowClick,
  emptyIcon = 'table_rows',
  emptyTitle = 'Sin registros',
  emptyDescription,
}) {
  const colCount = columns.length;

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant ${col.className ?? ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={colCount} />)
              : data.length === 0
              ? (
                <tr>
                  <td colSpan={colCount}>
                    <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              )
              : data.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`hover:bg-slate-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 ${col.cellClassName ?? ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-6 py-4 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-semibold text-on-surface-variant">
            Mostrando{' '}
            <span className="text-primary font-bold">
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            de <span className="text-primary font-bold">{pagination.total}</span> registros
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    pagination.page === page
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container-lowest text-primary hover:bg-primary/10'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            {pagination.totalPages > 5 && <span className="text-slate-400 px-1">...</span>}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
