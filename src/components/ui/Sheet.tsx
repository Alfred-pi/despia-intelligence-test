import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  leftAction?: {
    label: string;
    onPress: () => void;
  };
  rightAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
  children: ReactNode;
  /** Height: 'half' (50vh), 'large' (85vh), 'full' (100vh) */
  size?: 'half' | 'large' | 'full';
}

/**
 * Sheet - iOS 16+ style modal sheet
 * Large draggable sheet with header and card stack effect
 */
export function Sheet({ 
  isOpen, 
  onClose, 
  title,
  leftAction,
  rightAction,
  children,
  size = 'large'
}: SheetProps) {

  // Lock body scroll and add card stack effect
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-sheet-open', 'true');
      haptic('light');
    } else {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-sheet-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-sheet-open');
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="sheet-wrapper"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
          }}
        >
          {/* Backdrop */}
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            className={`sheet sheet-${size}`}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              margin: 0,
              padding: 0,
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 350,
              mass: 0.8
            }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) {
                onClose();
              }
            }}
          >
            {/* Drag indicator */}
            <div className="sheet-indicator">
              <div className="sheet-indicator-bar" />
            </div>

            {/* Header */}
            <div className="sheet-header">
              <div className="sheet-header-left">
                {leftAction ? (
                  <button 
                    className="sheet-header-btn"
                    onClick={leftAction.onPress}
                  >
                    {leftAction.label}
                  </button>
                ) : (
                  <button 
                    className="sheet-header-btn"
                    onClick={onClose}
                  >
                    <X size={22} />
                  </button>
                )}
              </div>
              
              <h2 className="sheet-title">{title}</h2>
              
              <div className="sheet-header-right">
                {rightAction && (
                  <button 
                    className="sheet-header-btn primary"
                    onClick={rightAction.onPress}
                    disabled={rightAction.disabled}
                  >
                    {rightAction.label}
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="sheet-content">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
