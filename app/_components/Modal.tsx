export function Modal({ open, onClose, children, title }:{ open: boolean; onClose: () => void; children: React.ReactNode; title?: string; }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
