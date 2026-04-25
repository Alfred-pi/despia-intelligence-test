import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

/**
 * Modal - Swiss Design
 * Clean, rounded, with smooth animations
 */
export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showCloseButton = true,
  size = 'md' 
}: ModalProps) {
  
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      haptic('light');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sizeStyles = {
    sm: { maxWidth: '320px' },
    md: { maxWidth: '400px' },
    lg: { maxWidth: '540px' },
    full: { maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 120px)' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            className="modal-content"
            style={sizeStyles[size]}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="modal-header">
                {title && <h2 className="modal-title">{title}</h2>}
                {showCloseButton && (
                  <motion.button
                    className="modal-close"
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={20} />
                  </motion.button>
                )}
              </div>
            )}
            
            {/* Body */}
            <div className="modal-body">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Modal Footer - for action buttons
 */
export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="modal-footer">{children}</div>;
}
