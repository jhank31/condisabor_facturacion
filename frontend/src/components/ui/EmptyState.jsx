export default function EmptyState({ icon = 'inbox', title = 'Sin resultados', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-outline">{icon}</span>
      </div>
      <h3 className="font-headline font-bold text-primary text-lg mb-1">{title}</h3>
      {description && <p className="text-on-surface-variant text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
