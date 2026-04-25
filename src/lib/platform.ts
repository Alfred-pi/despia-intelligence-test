/**
 * Platform Detection for DEV/PROD/Despia modes
 * 
 * This is CRITICAL for the development workflow:
 * - DEV: localStorage, skip Firebase, full testing
 * - PROD + Despia: Firebase Auth + Firestore + native features
 * - PROD + browser: "Download the app" message
 */

/**
 * Check if running in development mode (Vite dev server)
 */
export const isDev = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Check if running in production mode
 */
export const isProd = (): boolean => {
  return import.meta.env.PROD;
};

/**
 * Check if running inside Despia native wrapper.
 * Preferred signal: `window.native_runtime === 'despia'` set by the runtime
 * (the despia-intelligence SDK reads the same). Falls back to user-agent.
 */
export const isDespia = (): boolean => {
  if (typeof window !== 'undefined') {
    const runtime = (window as unknown as { native_runtime?: string }).native_runtime;
    if (runtime === 'despia') return true;
  }
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.toLowerCase().includes('despia');
};

/**
 * Check if running in a mobile browser (not Despia)
 */
export const isMobileBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) && !isDespia();
};

/**
 * Get the current platform mode
 */
export type PlatformMode = 'dev' | 'despia' | 'browser';

export const getPlatformMode = (): PlatformMode => {
  if (isDev()) return 'dev';
  if (isDespia()) return 'despia';
  return 'browser';
};

/**
 * Check if native features are available
 * Native features only work in Despia mode
 */
export const hasNativeFeatures = (): boolean => {
  return isDespia();
};

/**
 * Log platform info (useful for debugging)
 */
export const logPlatformInfo = (): void => {
  console.log('[Platform]', {
    mode: getPlatformMode(),
    isDev: isDev(),
    isProd: isProd(),
    isDespia: isDespia(),
    isMobileBrowser: isMobileBrowser(),
    hasNativeFeatures: hasNativeFeatures(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
  });
};
