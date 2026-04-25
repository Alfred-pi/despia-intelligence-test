import { useState } from 'react';
import { User } from 'lucide-react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  /** Show online/offline indicator */
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs', status: 'w-2 h-2 border' },
  sm: { container: 'w-8 h-8', text: 'text-sm', status: 'w-2.5 h-2.5 border' },
  md: { container: 'w-10 h-10', text: 'text-base', status: 'w-3 h-3 border-2' },
  lg: { container: 'w-14 h-14', text: 'text-lg', status: 'w-3.5 h-3.5 border-2' },
  xl: { container: 'w-20 h-20', text: 'text-2xl', status: 'w-4 h-4 border-2' },
};

const statusColors: Record<string, string> = {
  online: 'bg-success',
  offline: 'bg-muted-foreground',
  away: 'bg-warning',
  busy: 'bg-error',
};

/**
 * Avatar Component
 * 
 * Features:
 * - Image with fallback to initials
 * - Multiple sizes (8pt grid)
 * - Optional status indicator
 * - Squircle corners
 */
export function Avatar({
  src,
  alt = '',
  name,
  size = 'md',
  className = '',
  status,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const styles = sizeStyles[size];

  // Get initials from name
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Generate consistent color from name
  const getBackgroundColor = (name?: string) => {
    if (!name) return 'bg-muted';
    const colors = [
      'bg-primary/20',
      'bg-success/20',
      'bg-warning/20',
      'bg-error/20',
      'bg-purple-500/20',
      'bg-pink-500/20',
      'bg-cyan-500/20',
      'bg-orange-500/20',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`
          ${styles.container}
          rounded-full overflow-hidden
          flex items-center justify-center
          ${!src || imageError ? getBackgroundColor(name) : 'bg-muted'}
        `}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : initials ? (
          <span className={`font-medium text-foreground/80 ${styles.text}`}>
            {initials}
          </span>
        ) : (
          <User className="w-1/2 h-1/2 text-muted-foreground" />
        )}
      </div>

      {/* Status Indicator */}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${styles.status}
            rounded-full border-background
            ${statusColors[status]}
          `}
        />
      )}
    </div>
  );
}

/**
 * Avatar Group - Stack multiple avatars
 */
interface AvatarGroupProps {
  avatars: Array<{ src?: string; name?: string }>;
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ avatars, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;
  const styles = sizeStyles[size];

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, index) => (
        <div
          key={index}
          className="ring-2 ring-background rounded-full"
          style={{ zIndex: visible.length - index }}
        >
          <Avatar src={avatar.src} name={avatar.name} size={size} />
        </div>
      ))}

      {remaining > 0 && (
        <div
          className={`
            ${styles.container}
            rounded-full bg-muted
            flex items-center justify-center
            ring-2 ring-background
            ${styles.text}
            font-medium text-muted-foreground
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
