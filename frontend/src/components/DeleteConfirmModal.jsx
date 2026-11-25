export default function DeleteConfirmModal({
  patient,
  onCancel,
  onConfirm,
  deleting,
}) {
  if (!patient) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card modal-card-sm">
        <div className="modal-header">
          <h2>Delete Patient Record</h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onCancel}
            aria-label="Close confirmation"
          >
            ✕
          </button>
        </div>

        <p className="confirm-text">
          Are you sure you want to delete <strong>{patient.name}</strong> (
          {patient.ward}, {patient.department})? This action cannot be undone.
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
