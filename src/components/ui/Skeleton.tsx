import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

/**
 * Skeleton Loader Component
 * 
 * NO generic spinners! Always use skeleton loaders
 * that mimic the content structure.
 * 
 * See AGENTS.md Section 8 - Forbidden Patterns #4
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded-md h-4',
    circular: 'rounded-full aspect-square',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={`
        animate-pulse bg-muted
        ${variantStyles[variant]}
        ${className}
      `}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * Pre-built skeleton patterns
 */
export function SkeletonCard() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton variant="rectangular" height={120} className="w-full" />
      <Skeleton width="60%" />
      <Skeleton width="80%" />
      <Skeleton width="40%" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" />
            <Skeleton width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}
