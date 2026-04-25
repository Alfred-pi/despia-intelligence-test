import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Show dot indicator */
  dot?: boolean;
  /** Pill shape (fully rounded) */
  pill?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  outline: 'bg-transparent border border-border text-foreground',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

/**
 * Badge Component
 * 
 * Features:
 * - Multiple variants
 * - Optional dot indicator
 * - Pill or rounded shape
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pill = true,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium
        ${pill ? 'rounded-full' : 'rounded-lg'}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`
            w-1.5 h-1.5 rounded-full
            ${variant === 'default' ? 'bg-muted-foreground' : 'bg-current'}
          `}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Notification Badge - for counts on icons
 */
interface NotificationBadgeProps {
  count?: number;
  max?: number;
  showZero?: boolean;
  children: ReactNode;
}

export function NotificationBadge({
  count = 0,
  max = 99,
  showZero = false,
  children,
}: NotificationBadgeProps) {
  const displayCount = count > max ? `${max}+` : count;
  const showBadge = count > 0 || showZero;

  return (
    <div className="relative inline-flex">
      {children}
      {showBadge && (
        <span
          className={`
            absolute -top-1 -right-1
            flex items-center justify-center
            min-w-[18px] h-[18px] px-1
            rounded-full
            bg-error text-white
            text-xs font-bold
            ring-2 ring-background
          `}
        >
          {displayCount}
        </span>
      )}
    </div>
  );
}

/**
 * Status Badge - with pulse animation
 */
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  label?: string;
  pulse?: boolean;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  online: { color: 'bg-success', label: 'Online' },
  offline: { color: 'bg-muted-foreground', label: 'Offline' },
  busy: { color: 'bg-error', label: 'Busy' },
  away: { color: 'bg-warning', label: 'Away' },
};

export function StatusBadge({ status, label, pulse = true }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {pulse && status === 'online' && (
          <span
            className={`
              absolute inline-flex h-full w-full rounded-full
              ${config.color} opacity-75 animate-ping
            `}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`} />
      </span>
      <span className="text-sm text-muted-foreground">{label || config.label}</span>
    </span>
  );
}
