import { InputHTMLAttributes, forwardRef, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  hint?: string;
  size?: 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Input Component with Floating Label
 * 
 * Features:
 * - Floating label animation
 * - 44px minimum touch target
 * - Error & hint states
 * - Optional icons
 * - 8pt grid alignment
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    hint, 
    size = 'md',
    leftIcon,
    rightIcon,
    className = '', 
    id,
    disabled,
    value,
    defaultValue,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value || !!defaultValue);

    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    };

    const sizeStyles = {
      md: 'h-14 text-base',
      lg: 'h-16 text-lg',
    };

    return (
      <div className={`relative ${className}`}>
        {/* Input Container */}
        <div
          className={`
            relative flex items-center
            ${sizeStyles[size]}
            rounded-2xl border-2 transition-colors duration-200
            ${error 
              ? 'border-error bg-error/5' 
              : isFocused 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-muted/30'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {/* Left Icon */}
          {leftIcon && (
            <div className="pl-4 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              flex-1 h-full bg-transparent outline-none
              px-4 pt-4 pb-2
              text-foreground placeholder-transparent
              ${leftIcon ? 'pl-2' : ''}
              ${rightIcon ? 'pr-2' : ''}
            `}
            placeholder={label}
            {...props}
          />

          {/* Floating Label */}
          <motion.label
            htmlFor={inputId}
            initial={false}
            animate={{
              y: isFloating ? -10 : 0,
              scale: isFloating ? 0.75 : 1,
              x: isFloating ? (leftIcon ? -8 : 0) : 0,
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`
              absolute left-4 origin-left pointer-events-none
              transition-colors duration-200
              ${leftIcon ? 'left-12' : ''}
              ${error 
                ? 'text-error' 
                : isFocused 
                  ? 'text-primary' 
                  : 'text-muted-foreground'
              }
            `}
          >
            {label}
          </motion.label>

          {/* Right Icon */}
          {rightIcon && (
            <div className="pr-4 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error / Hint Message */}
        <AnimatePresence mode="wait">
          {(error || hint) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={`
                mt-2 px-4 text-sm
                ${error ? 'text-error' : 'text-muted-foreground'}
              `}
            >
              {error || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea variant
 */
interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const isFloating = isFocused || hasValue;

    return (
      <div className={`relative ${className}`}>
        <div
          className={`
            relative
            rounded-2xl border-2 transition-colors duration-200
            ${error 
              ? 'border-error bg-error/5' 
              : isFocused 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-muted/30'
            }
          `}
        >
          <textarea
            ref={ref}
            id={inputId}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              setHasValue(!!e.target.value);
            }}
            className="w-full min-h-[120px] bg-transparent outline-none px-4 pt-6 pb-3 text-foreground placeholder-transparent resize-none"
            placeholder={label}
            {...props}
          />

          <motion.label
            htmlFor={inputId}
            initial={false}
            animate={{
              y: isFloating ? -8 : 8,
              scale: isFloating ? 0.75 : 1,
            }}
            className={`
              absolute left-4 top-3 origin-left pointer-events-none
              ${error ? 'text-error' : isFocused ? 'text-primary' : 'text-muted-foreground'}
            `}
          >
            {label}
          </motion.label>
        </div>

        <AnimatePresence mode="wait">
          {(error || hint) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`mt-2 px-4 text-sm ${error ? 'text-error' : 'text-muted-foreground'}`}
            >
              {error || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
