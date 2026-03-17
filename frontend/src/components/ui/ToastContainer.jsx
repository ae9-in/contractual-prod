export default function ToastContainer({ items }) {
  if (!items.length) return null;

  return (
    <div className="toast-wrap" aria-live="polite" aria-atomic="true">
      {items.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || 'success'}`} style={{ whiteSpace: 'pre-wrap' }}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
