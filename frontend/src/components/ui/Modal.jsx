import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '500px' }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              width: '100%',
              maxWidth,
              padding: '32px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
            >
              <X size={18} />
            </button>

            {title && (
              <h3 style={{ margin: '0 0 16px', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', fontFamily: '"Outfit", sans-serif' }}>
                {title}
              </h3>
            )}

            <div style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
