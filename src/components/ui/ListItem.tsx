import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface ListItemProps {
  /** Leading content (icon, avatar, etc.) */
  leading?: ReactNode;
  /** Primary text */
  title: string;
  /** Secondary text */
  subtitle?: string;
  /** Trailing content (icon, badge, toggle, etc.) */
  trailing?: ReactNode;
  /** Show chevron arrow */
  chevron?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Destructive styling */
  destructive?: boolean;
  className?: string;
}

/**
 * List Item Component
 * 
 * Features:
 * - Leading/trailing slots
 * - 44px minimum touch target
 * - Haptic feedback
 * - Chevron for navigation
 * - Destructive variant
 */
export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  chevron = false,
  onClick,
  disabled = false,
  destructive = false,
  className = '',
}: ListItemProps) {
  const handleClick = () => {
    if (disabled || !onClick) return;
    haptic('selection');
    onClick();
  };

  const isInteractive = !!onClick && !disabled;

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center gap-4 px-4 py-3
        min-h-[56px]
        ${isInteractive ? 'cursor-pointer pressable hover:bg-muted/50 active:bg-muted' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Leading */}
      {leading && (
        <div className={`flex-shrink-0 ${destructive ? 'text-error' : 'text-muted-foreground'}`}>
          {leading}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${destructive ? 'text-error' : 'text-foreground'}`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Trailing */}
      {trailing && (
        <div className="flex-shrink-0">
          {trailing}
        </div>
      )}

      {/* Chevron */}
      {chevron && (
        <ChevronRight size={20} className="flex-shrink-0 text-muted-foreground" />
      )}
    </div>
  );
}

/**
 * List Group - Container for list items
 */
interface ListGroupProps {
  children: ReactNode;
  title?: string;
  description?: string;
  /** Inset style (no full-width dividers) */
  inset?: boolean;
  className?: string;
}

export function ListGroup({
  children,
  title,
  description,
  inset = false,
  className = '',
}: ListGroupProps) {
  return (
    <div className={className}>
      {(title || description) && (
        <div className={`px-4 pb-2 ${title ? 'pt-4' : ''}`}>
          {title && (
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      <div
        className={`
          bg-background rounded-2xl overflow-hidden
          ${inset ? '' : 'divide-y divide-border/50'}
        `}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * List Divider
 */
interface ListDividerProps {
  /** Inset from left (for avatar alignment) */
  inset?: boolean;
}

export function ListDivider({ inset = false }: ListDividerProps) {
  return (
    <div className={`h-px bg-border/50 ${inset ? 'ml-16' : ''}`} />
  );
}

/**
 * Swipeable List Item (for delete/actions)
 */
interface SwipeableListItemProps extends ListItemProps {
  onDelete?: () => void;
  deleteLabel?: string;
}

export function SwipeableListItem({
  onDelete,
  deleteLabel = 'Delete',
  ...props
}: SwipeableListItemProps) {
  // For full swipe-to-delete, you'd use a gesture library
  // This is a simplified version with a visible delete button

  return (
    <div className="relative overflow-hidden group">
      <ListItem {...props} />
      {onDelete && (
        <button
          onClick={() => {
            haptic('error');
            onDelete();
          }}
          className="
            absolute right-0 top-0 bottom-0
            px-6 bg-error text-white font-medium
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            flex items-center
          "
        >
          {deleteLabel}
        </button>
      )}
    </div>
  );
}
