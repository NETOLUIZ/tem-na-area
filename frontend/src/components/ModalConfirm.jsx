export default function ModalConfirm({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  error = ""
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <h3>{title}</h3>
        <p>{description}</p>
        {error ? <p className="error-text">{error}</p> : null}
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Processando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

