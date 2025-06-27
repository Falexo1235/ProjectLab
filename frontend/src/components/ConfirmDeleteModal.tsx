import React from "react";

interface ConfirmDeleteModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  fileName?: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ open, onCancel, onConfirm, fileName }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 320, maxWidth: 400 }}>
        <h2>Удалить файл?</h2>
        <p style={{ marginBottom: 24 }}>
          Вы действительно хотите безвозвратно удалить файл{fileName ? <> <b>{fileName}</b>?</> : "?"}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="upload-cancel" onClick={onCancel}>Отмена</button>
          <button className="upload-submit" style={{ background: "#e74c3c" }} onClick={onConfirm}>Удалить</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal; 