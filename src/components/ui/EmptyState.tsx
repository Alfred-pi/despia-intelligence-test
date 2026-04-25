import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Inbox, Search, Wifi, AlertCircle, FileQuestion } from 'lucide-react';
import { Button } from './Button';

type EmptyStateVariant = 'empty' | 'search' | 'offline' | 'error' | 'custom';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  /** Custom icon */
  icon?: ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Compact mode (less padding) */
  compact?: boolean;
  className?: string;
}

const defaultIcons: Record<EmptyStateVariant, ReactNode> = {
  empty: <Inbox className="w-16 h-16" />,
  search: <Search className="w-16 h-16" />,
  offline: <Wifi className="w-16 h-16" />,
  error: <AlertCircle className="w-16 h-16" />,
  custom: <FileQuestion className="w-16 h-16" />,
};

/**
 * Empty State Component
 * 
 * Use for:
 * - Empty lists/data
 * - No search results
 * - Offline state
 * - Error states
 * - Onboarding prompts
 */
export function EmptyState({
  variant = 'empty',
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        flex flex-col items-center justify-center text-center
        ${compact ? 'py-8 px-4' : 'py-16 px-6'}
        ${className}
      `}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-muted-foreground/50 mb-6"
      >
        {icon || defaultIcons[variant]}
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Pre-configured empty states
 */
export function NoResults({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={query ? `No results for "${query}"` : 'Try adjusting your search or filters'}
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  );
}

export function NoData({ 
  title = 'Nothing here yet', 
  description,
  action,
}: { 
  title?: string; 
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <EmptyState
      variant="empty"
      title={title}
      description={description}
      action={action}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      variant="offline"
      title="You're offline"
      description="Check your connection and try again"
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
    />
  );
}

export function ErrorState({ 
  message = 'Something went wrong',
  onRetry,
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      variant="error"
      title="Oops!"
      description={message}
      action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
    />
  );
}

/**
 * Onboarding Empty State - with illustration slot
 */
interface OnboardingStateProps {
  illustration?: ReactNode;
  title: string;
  description: string;
  action: {
    label: string;
    onClick: () => void;
  };
}

export function OnboardingState({
  illustration,
  title,
  description,
  action,
}: OnboardingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center text-center py-12 px-6"
    >
      {illustration && (
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {illustration}
        </motion.div>
      )}

      <motion.h2
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-foreground mb-3"
      >
        {title}
      </motion.h2>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-md mb-8"
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button variant="primary" size="lg" onClick={action.onClick}>
          {action.label}
        </Button>
      </motion.div>
    </motion.div>
  );
}
