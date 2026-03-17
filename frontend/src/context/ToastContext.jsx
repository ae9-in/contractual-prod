import { createContext, useMemo, useState } from 'react';
import ToastContainer from '../components/ui/ToastContainer';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (input, type = 'success') => {
    const id = Date.now() + Math.random();
    const toast = typeof input === 'string'
      ? { id, message: input, type }
      : {
          id,
          type: input?.type || 'success',
          title: input?.title || '',
          message: input?.message || '',
          duration: input?.duration,
        };

    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, toast.duration || 2400);
  };

  const value = useMemo(() => ({ addToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer items={toasts} />
    </ToastContext.Provider>
  );
}
