import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
}

const sizeStyles = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'w-4 h-4',
    translate: 16,
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 20,
  },
  lg: {
    track: 'w-14 h-8',
    thumb: 'w-7 h-7',
    translate: 24,
  },
};

/**
 * Toggle / Switch Component
 * 
 * Features:
 * - Smooth spring animation
 * - Haptic feedback
 * - iOS-style design
 * - Label + description support
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
}: ToggleProps) {
  const styles = sizeStyles[size];

  const handleToggle = () => {
    if (disabled) return;
    haptic('selection');
    onChange(!checked);
  };

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      className={`
        relative inline-flex items-center
        ${styles.track}
        rounded-full
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? 'bg-primary' : 'bg-muted'}
      `}
    >
      <motion.span
        initial={false}
        animate={{ x: checked ? styles.translate : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`
          ${styles.thumb}
          rounded-full bg-white shadow-md
        `}
      />
    </button>
  );

  if (!label) return toggle;

  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1">
        <span className="font-medium text-foreground">{label}</span>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {toggle}
    </label>
  );
}

/**
 * Checkbox variant
 */
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}: CheckboxProps) {
  const handleChange = () => {
    if (disabled) return;
    haptic('selection');
    onChange(!checked);
  };

  const checkbox = (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleChange}
      className={`
        relative w-6 h-6 rounded-lg
        border-2 transition-all duration-200
        flex items-center justify-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${checked 
          ? 'bg-primary border-primary' 
          : 'bg-transparent border-border hover:border-primary/50'
        }
      `}
    >
      <motion.svg
        initial={false}
        animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-4 h-4 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </motion.svg>
    </button>
  );

  if (!label) return checkbox;

  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      {checkbox}
      <div className="flex-1 pt-0.5">
        <span className="font-medium text-foreground">{label}</span>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

/**
 * Radio Group
 */
interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
}

export function RadioGroup({ value, onChange, options, disabled = false }: RadioGroupProps) {
  const handleChange = (optionValue: string) => {
    if (disabled) return;
    haptic('selection');
    onChange(optionValue);
  };

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-start gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
        >
          <button
            type="button"
            role="radio"
            aria-checked={value === option.value}
            disabled={disabled}
            onClick={() => handleChange(option.value)}
            className={`
              relative w-6 h-6 rounded-full
              border-2 transition-all duration-200
              flex items-center justify-center
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              ${value === option.value 
                ? 'border-primary' 
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <motion.span
              initial={false}
              animate={{ 
                scale: value === option.value ? 1 : 0,
                opacity: value === option.value ? 1 : 0,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-3 h-3 rounded-full bg-primary"
            />
          </button>
          <div className="flex-1 pt-0.5">
            <span className="font-medium text-foreground">{option.label}</span>
            {option.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
