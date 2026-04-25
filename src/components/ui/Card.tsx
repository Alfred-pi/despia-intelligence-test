import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
}

/**
 * Card Component
 * 
 * Features:
 * - 8pt grid spacing
 * - Squircle corners (iOS style)
 * - Optional glassmorphism
 * - Hover/press states
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverable = false, glass = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-2xl border border-border/50
          ${glass ? 'glass' : 'bg-background'}
          ${hoverable ? 'pressable cursor-pointer hover:shadow-md hover:border-border transition-all' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header
 */
export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 border-b border-border/50 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Content
 */
export function CardContent({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer
 */
export function CardFooter({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4 border-t border-border/50 ${className}`} {...props}>
      {children}
    </div>
  );
}
