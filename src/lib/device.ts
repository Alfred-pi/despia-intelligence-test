export type DeviceTier = 'Any' | 'Modern' | 'Flagship';

export interface DeviceInfo {
  tier: DeviceTier;
  os: 'ios' | 'android' | 'other';
  model: string;
  memoryGB: number | null;
  cores: number | null;
  hint: string;
}

export function detectDevice(): DeviceInfo {
  if (typeof navigator === 'undefined') {
    return { tier: 'Any', os: 'other', model: 'Unknown', memoryGB: null, cores: null, hint: 'Pick a small model.' };
  }

  const ua = navigator.userAgent;
  const memoryGB =
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number'
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null
      : null;
  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null;

  if (/iPhone|iPad|iPod/i.test(ua)) {
    return classifyApple(ua, memoryGB, cores);
  }
  if (/Android/i.test(ua)) {
    return classifyAndroid(ua, memoryGB, cores);
  }
  return {
    tier: 'Any',
    os: 'other',
    model: 'Browser',
    memoryGB,
    cores,
    hint: 'Browser preview — pick a small model to test the UI.',
  };
}

function classifyApple(ua: string, memoryGB: number | null, cores: number | null): DeviceInfo {
  const iosMatch = ua.match(/OS (\d+)[._](\d+)/);
  const iosMajor = iosMatch ? parseInt(iosMatch[1], 10) : 0;
  // iPhone model can't be reliably extracted from UA in Safari/WKWebView.
  // We fall back to tier from cores + iOS version. Apple chips:
  //   - Flagship (A16+/A17 Pro/A18): typically 6 cores, >= iOS 16, modern WebView
  //   - Modern (A14/A15): 6 cores, iOS 14+
  //   - Any (A12/A13): 6 cores, older iOS
  const c = cores ?? 6;
  let tier: DeviceTier = 'Any';
  if (iosMajor >= 17 && c >= 6) tier = 'Flagship';
  else if (iosMajor >= 15 && c >= 6) tier = 'Modern';

  const hint =
    tier === 'Flagship'
      ? 'Your iPhone runs flagship models. Try Gemma 3n or LFM2 8B for best quality.'
      : tier === 'Modern'
      ? 'Your iPhone handles 1–2B models well. Qwen3 0.6B or Gemma 3 1B are great defaults.'
      : 'Stick to small models (350M–700M) for smooth speed.';

  return {
    tier,
    os: 'ios',
    model: `iPhone · iOS ${iosMajor || '?'}`,
    memoryGB,
    cores,
    hint,
  };
}

function classifyAndroid(ua: string, memoryGB: number | null, cores: number | null): DeviceInfo {
  const androidMatch = ua.match(/Android (\d+)/);
  const androidMajor = androidMatch ? parseInt(androidMatch[1], 10) : 0;
  let tier: DeviceTier = 'Any';
  const mem = memoryGB ?? 4;
  if (mem >= 8 && androidMajor >= 13) tier = 'Flagship';
  else if (mem >= 4 && androidMajor >= 12) tier = 'Modern';

  const hint =
    tier === 'Flagship'
      ? 'Your Android runs flagship models. Try Gemma 3n or LFM2 8B.'
      : tier === 'Modern'
      ? 'Mid-range Android — 1–2B models work well. Qwen3 0.6B or Gemma 3 1B.'
      : 'Stick to small models (350M–700M).';

  return {
    tier,
    os: 'android',
    model: `Android ${androidMajor || '?'}${memoryGB ? ` · ${memoryGB}GB` : ''}`,
    memoryGB,
    cores,
    hint,
  };
}

export const TIER_RANK: Record<DeviceTier, number> = { Any: 0, Modern: 1, Flagship: 2 };

export function isModelRecommendedFor(modelTier: DeviceTier, deviceTier: DeviceTier): boolean {
  return TIER_RANK[modelTier] <= TIER_RANK[deviceTier];
}
