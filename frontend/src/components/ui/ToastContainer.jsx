import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
};

export default function ToastContainer({ items }) {
  if (!items.length) return null;

  return (
    <div className="toast-wrap" aria-live="polite" aria-atomic="true">
      {items.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || 'success'}`}>
          {(() => {
            const Icon = ICONS[toast.type || 'success'] || CheckCircle2;

            return (
              <>
                <Icon size={20} style={{ flexShrink: 0, marginTop: toast.title ? '2px' : 0 }} />
                <div style={{ display: 'grid', gap: toast.title ? '2px' : 0 }}>
                  {toast.title && <strong style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>{toast.title}</strong>}
                  {toast.message && <span style={{ lineHeight: 1.45 }}>{toast.message}</span>}
                </div>
              </>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
