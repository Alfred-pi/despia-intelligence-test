/**
 * Haptic Feedback via Despia Native Bridge
 * 
 * Every significant interaction needs tactile feedback.
 * This is MANDATORY for native-grade UX.
 */

import { isDespia } from './platform';

type HapticType = 'success' | 'error' | 'selection' | 'light' | 'medium' | 'heavy';

const hapticCommands: Record<HapticType, string> = {
  success: 'successhaptic://',
  error: 'errorhaptic://',
  selection: 'lightimpackhaptic://',
  light: 'lightimpackhaptic://',
  medium: 'mediumimpackhaptic://',
  heavy: 'heavyimpackhaptic://',
};

/**
 * Trigger haptic feedback
 * 
 * @param type - Type of haptic feedback
 * 
 * Usage:
 * - success: Form submit, purchase complete
 * - error: Validation fail, error state
 * - selection: Tab switch, list item select
 * - light/medium/heavy: Custom intensity
 */
export function haptic(type: HapticType = 'selection'): void {
  if (!isDespia()) {
    // In dev mode, log haptic calls for debugging
    if (import.meta.env.DEV) {
      console.log('[Haptic]', type);
    }
    return;
  }

  try {
    // Dynamic import to avoid issues when despia-native isn't available
    import('despia-native').then((module) => {
      const despia = module.default;
      despia(hapticCommands[type]);
    }).catch(() => {
      console.warn('[Haptic] despia-native not available');
    });
  } catch {
    console.warn('[Haptic] Failed to trigger:', type);
  }
}

/**
 * Haptic decorator for event handlers
 * Wraps a function to trigger haptic before execution
 */
export function withHaptic<T extends (...args: unknown[]) => unknown>(
  fn: T,
  type: HapticType = 'selection'
): T {
  return ((...args: Parameters<T>) => {
    haptic(type);
    return fn(...args);
  }) as T;
}
