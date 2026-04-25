import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/haptics';

interface ActionSheetOption {
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
}

/**
 * ActionSheet - iOS 16+ style with card stack effect
 * Background scales down, sheet slides up
 */
export function ActionSheet({ 
  isOpen, 
  onClose, 
  title, 
  message,
  options,
  cancelLabel = 'Cancel'
}: ActionSheetProps) {

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

  const handleOptionPress = (option: ActionSheetOption) => {
    if (option.disabled) return;
    haptic(option.destructive ? 'error' : 'selection');
    option.onPress();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="actionsheet-wrapper">
          {/* Backdrop */}
          <motion.div
            className="actionsheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            className="actionsheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 32, 
              stiffness: 400,
              mass: 0.8
            }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                onClose();
              }
            }}
          >
            {/* Drag indicator */}
            <div className="actionsheet-indicator">
              <div className="actionsheet-indicator-bar" />
            </div>

            {/* Content card */}
            <div className="actionsheet-card">
              {/* Header */}
              {(title || message) && (
                <div className="actionsheet-header">
                  {title && <p className="actionsheet-title">{title}</p>}
                  {message && <p className="actionsheet-message">{message}</p>}
                </div>
              )}

              {/* Options */}
              <div className="actionsheet-options">
                {options.map((option, index) => (
                  <button
                    key={index}
                    className={`actionsheet-option ${option.destructive ? 'destructive' : ''} ${option.disabled ? 'disabled' : ''}`}
                    onClick={() => handleOptionPress(option)}
                    disabled={option.disabled}
                  >
                    {option.icon && <span className="actionsheet-icon">{option.icon}</span>}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cancel button - separate card */}
            <button
              className="actionsheet-cancel"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
