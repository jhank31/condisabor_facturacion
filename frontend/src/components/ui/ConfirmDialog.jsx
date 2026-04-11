import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Confirmar acción?',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}) {
  const confirmClasses =
    variant === 'danger'
      ? 'bg-error text-white hover:bg-error/90'
      : 'bg-gradient-to-r from-primary to-primary-container text-white';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="p-8 space-y-6">
        {message && <p className="text-sm text-on-surface-variant">{message}</p>}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${confirmClasses} disabled:opacity-60`}
          >
            {loading && <LoadingSpinner size="sm" />}
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-outline-variant rounded-xl font-bold text-sm text-slate-600 hover:bg-surface-container transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
