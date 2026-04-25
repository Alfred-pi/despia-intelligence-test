import { ButtonHTMLAttributes, forwardRef } from 'react';
import { haptic } from '@/lib/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
  secondary: 'bg-muted text-foreground hover:bg-muted/80',
  ghost: 'bg-transparent hover:bg-muted/50',
  danger: 'bg-error text-white hover:bg-error/90',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-4 text-base rounded-xl',
  lg: 'h-14 px-6 text-lg rounded-2xl',
};

/**
 * Button Component
 * 
 * Features:
 * - Haptic feedback on press
 * - Active scale animation (pressable)
 * - Minimum 44px touch target
 * - Loading state with skeleton
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, disabled, onClick, children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      haptic('selection');
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center font-medium
          transition-all duration-200 ease-out
          pressable touch-target
          disabled:opacity-50 disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
