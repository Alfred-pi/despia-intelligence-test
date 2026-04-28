import realIntel, {
  type Model,
  type ModelCategory,
  type RuntimeStatus,
} from 'despia-intelligence';

export type { Model, ModelCategory, RuntimeStatus };

export type StreamState =
  | { status: 'streaming'; text: string }
  | { status: 'done'; text: string }
  | { status: 'error'; text: string; error: { code: number; message: string } };

export type RunParams = { model: string; prompt: string; system?: string };

export type DownloadCallbacks = {
  onStart?: () => void;
  onProgress?: (pct: number) => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
};

export type DownloadEvent =
  | 'downloadStart'
  | 'downloadProgress'
  | 'downloadEnd'
  | 'downloadError';

export type RuntimeReport = {
  ok: boolean;
  status: RuntimeStatus;
  message: string | null;
  source: 'sdk' | 'probe' | 'mock';
  diagnostics: {
    nativeRuntime: string | null;
    userAgent: string;
    sdkRuntimeOk: boolean;
    sdkRuntimeStatus: RuntimeStatus;
    probedAvailable: number | null;
  };
};

let runtimeReport: RuntimeReport = {
  ok: realIntel.runtime.ok,
  status: realIntel.runtime.status,
  message: realIntel.runtime.message,
  source: realIntel.runtime.ok ? 'sdk' : 'mock',
  diagnostics: {
    nativeRuntime:
      typeof window !== 'undefined'
        ? ((window as unknown as { native_runtime?: string }).native_runtime ?? null)
        : null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    sdkRuntimeOk: realIntel.runtime.ok,
    sdkRuntimeStatus: realIntel.runtime.status,
    probedAvailable: null,
  },
};

const reportListeners = new Set<(r: RuntimeReport) => void>();

function publishReport(next: RuntimeReport) {
  runtimeReport = next;
  for (const fn of reportListeners) fn(next);
}

export function getRuntimeReport(): RuntimeReport {
  return runtimeReport;
}

export function subscribeRuntimeReport(fn: (r: RuntimeReport) => void): () => void {
  reportListeners.add(fn);
  return () => {
    reportListeners.delete(fn);
  };
}

let probedOnce = false;
export async function probeRuntime(): Promise<RuntimeReport> {
  if (probedOnce) return runtimeReport;
  probedOnce = true;
  // Decision is driven by realIntel.runtime.ok (synchronous, set at SDK import).
  // The probe only enriches diagnostics: how many models the catalog returns
  // when we actually call the SDK. It does NOT flip ok back to false.
  try {
    const list = await realIntel.models.available();
    const probedAvailable = Array.isArray(list) ? list.length : 0;
    publishReport({
      ...runtimeReport,
      ok: realIntel.runtime.ok,
      source: realIntel.runtime.ok ? 'sdk' : 'mock',
      diagnostics: {
        ...runtimeReport.diagnostics,
        probedAvailable,
        sdkRuntimeOk: realIntel.runtime.ok,
      },
    });
  } catch {
    publishReport({
      ...runtimeReport,
      ok: realIntel.runtime.ok,
      source: realIntel.runtime.ok ? 'sdk' : 'mock',
      diagnostics: { ...runtimeReport.diagnostics, probedAvailable: 0 },
    });
  }
  return runtimeReport;
}

const MOCK_CATALOG: Model[] = [
  { id: 'lfm2.5-350m', name: 'LFM2.5 350M', category: 'text' },
  { id: 'qwen3-0.6b', name: 'Qwen3 0.6B', category: 'text' },
  { id: 'lfm2-700m', name: 'LFM2 700M', category: 'text' },
  { id: 'gemma-3-1b-it', name: 'Gemma 3 1B Instruct', category: 'text' },
  { id: 'lfm2.5-1.2b-instruct', name: 'LFM2.5 1.2B Instruct', category: 'text' },
  { id: 'lfm2.5-1.2b-thinking', name: 'LFM2.5 1.2B Thinking', category: 'text' },
  { id: 'qwen3-1.7b', name: 'Qwen3 1.7B', category: 'text' },
  { id: 'youtu-llm-2b', name: 'Youtu LLM 2B', category: 'text' },
  { id: 'lfm2-2.6b', name: 'LFM2 2.6B', category: 'text' },
  { id: 'gemma-3n-e4b-it', name: 'Gemma 3n E4B Instruct', category: 'text' },
  { id: 'lfm2-8b-a1b', name: 'LFM2 8B (1B active)', category: 'text' },
];

export const MODEL_META: Record<
  string,
  { tier: 'Any' | 'Modern' | 'Flagship'; sizeMB: number; family: string }
> = {
  'lfm2.5-350m': { tier: 'Any', sizeMB: 220, family: 'Liquid LFM2.5' },
  'qwen3-0.6b': { tier: 'Any', sizeMB: 380, family: 'Alibaba Qwen3' },
  'lfm2-700m': { tier: 'Any', sizeMB: 440, family: 'Liquid LFM2' },
  'gemma-3-1b-it': { tier: 'Modern', sizeMB: 620, family: 'Google Gemma 3' },
  'lfm2.5-1.2b-instruct': { tier: 'Modern', sizeMB: 750, family: 'Liquid LFM2.5' },
  'lfm2.5-1.2b-thinking': { tier: 'Modern', sizeMB: 750, family: 'Liquid LFM2.5' },
  'qwen3-1.7b': { tier: 'Modern', sizeMB: 1080, family: 'Alibaba Qwen3' },
  'youtu-llm-2b': { tier: 'Modern', sizeMB: 1200, family: 'Tencent Youtu' },
  'lfm2-2.6b': { tier: 'Modern', sizeMB: 1600, family: 'Liquid LFM2' },
  'gemma-3n-e4b-it': { tier: 'Flagship', sizeMB: 2400, family: 'Google Gemma 3n' },
  'lfm2-8b-a1b': { tier: 'Flagship', sizeMB: 4800, family: 'Liquid LFM2 MoE' },
};

const mockInstalled = new Set<string>(['lfm2.5-350m']);
const mockListeners: Record<DownloadEvent, Set<(...args: never[]) => void>> = {
  downloadStart: new Set(),
  downloadProgress: new Set(),
  downloadEnd: new Set(),
  downloadError: new Set(),
};

function emit(event: DownloadEvent, ...args: unknown[]) {
  for (const fn of mockListeners[event]) (fn as (...a: unknown[]) => void)(...args);
}

// Single source of truth: trust the SDK at the moment of the call.
// realIntel.runtime is fixed at SDK import per Despia spec.
function isLive() {
  return realIntel.runtime.ok;
}

function onlyText(models: Model[]): Model[] {
  // Tolerate `category` missing or non-text — Despia text runtime is text-only today.
  return models.filter((m) => !m.category || m.category === 'text');
}

const AVAILABLE_POLL_DEADLINE_MS = 6000;
const AVAILABLE_POLL_INTERVAL_MS = 200;

// The SDK reads window.intelligence.availableModels synchronously and returns []
// if the native runtime has not populated it yet. Poll for a few seconds before
// falling back to the curated catalog so the picker has something to show.
async function pollAvailableModels(): Promise<Model[]> {
  const deadline = Date.now() + AVAILABLE_POLL_DEADLINE_MS;
  while (Date.now() < deadline) {
    const list = await realIntel.models.available();
    if (Array.isArray(list) && list.length > 0) return list;
    await new Promise<void>((r) => setTimeout(r, AVAILABLE_POLL_INTERVAL_MS));
  }
  return [];
}

export async function listAvailableModels(): Promise<Model[]> {
  if (!isLive()) return MOCK_CATALOG;
  const live = await pollAvailableModels();
  if (live.length > 0) return onlyText(live);
  // Runtime is live but never populated the catalog. Fall back to the curated
  // text-model list from the official SDK README so the picker is usable.
  return MOCK_CATALOG;
}

export function isCatalogFallback(catalog: Model[]): boolean {
  if (catalog.length !== MOCK_CATALOG.length) return false;
  return catalog.every((m, i) => m.id === MOCK_CATALOG[i].id);
}

export async function listInstalledModels(): Promise<Model[]> {
  if (isLive()) {
    const r = await realIntel.models.installed();
    return Array.isArray(r) ? onlyText(r) : [];
  }
  return MOCK_CATALOG.filter((m) => mockInstalled.has(m.id));
}

export function downloadModel(modelId: string, callbacks?: DownloadCallbacks): void {
  if (isLive()) {
    realIntel.models.download(modelId, callbacks);
    return;
  }
  callbacks?.onStart?.();
  emit('downloadStart', modelId);
  let pct = 0;
  const tick = () => {
    pct = Math.min(100, pct + 8 + Math.random() * 6);
    callbacks?.onProgress?.(pct);
    emit('downloadProgress', modelId, pct);
    if (pct >= 100) {
      mockInstalled.add(modelId);
      callbacks?.onEnd?.();
      emit('downloadEnd', modelId);
      return;
    }
    window.setTimeout(tick, 220);
  };
  window.setTimeout(tick, 200);
}

export async function removeModel(modelId: string): Promise<void> {
  if (isLive()) {
    await realIntel.models.remove(modelId);
    return;
  }
  mockInstalled.delete(modelId);
}

export function onDownloadEvent<E extends DownloadEvent>(
  event: E,
  fn: E extends 'downloadProgress'
    ? (modelId: string, pct: number) => void
    : E extends 'downloadError'
    ? (modelId: string, err: string) => void
    : (modelId: string) => void,
): () => void {
  if (isLive()) return realIntel.on(event, fn as never);
  mockListeners[event].add(fn as never);
  return () => {
    mockListeners[event].delete(fn as never);
  };
}

const MOCK_REPLIES = [
  "Voici une réponse simulée. L'app tourne en mode preview UI — pour de vraies réponses, ouvre-la dans Despia avec le runtime intelligence activé.",
  "Bien reçu. En mode démo je ne fais que streamer un texte fictif. Une fois le runtime live, le modèle choisi tournera localement sur le Neural Engine ou GPU du téléphone.\n\n- Aucun token n'est envoyé au cloud\n- Aucun coût par token\n- Marche offline",
  "C'est une démo de l'interface. Streaming, cancel, et historique IndexedDB sont tous fonctionnels — seuls les tokens viennent d'un mock.",
];

let mockReplyIdx = 0;

export function runStream(
  params: RunParams,
  onUpdate: (state: StreamState) => void,
): () => void {
  if (isLive()) {
    let settled = false;
    let firstTokenTimer: number | undefined;
    let staleTimer: number | undefined;
    const FIRST_TOKEN_TIMEOUT_MS = 25_000;
    const STALE_TIMEOUT_MS = 90_000;
    const fail = (code: number, message: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(firstTokenTimer);
      window.clearTimeout(staleTimer);
      onUpdate({ status: 'error', text: '', error: { code, message } });
    };
    const succeed = (text: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(firstTokenTimer);
      window.clearTimeout(staleTimer);
      onUpdate({ status: 'done', text });
    };

    const handle = realIntel.run(
      { type: 'text', stream: true, ...params },
      {
        stream: (chunk) => {
          if (settled) return;
          window.clearTimeout(firstTokenTimer);
          window.clearTimeout(staleTimer);
          staleTimer = window.setTimeout(
            () => fail(-1, 'No new tokens for 90s — the model may be stuck.'),
            STALE_TIMEOUT_MS,
          );
          onUpdate({ status: 'streaming', text: chunk });
        },
        complete: (text) => succeed(text),
        error: (err) => fail(err.code, err.message),
      },
    );

    if (!handle.ok) {
      const status = (handle as { status?: string }).status ?? 'unavailable';
      const message = (handle as { message?: string }).message ?? `Runtime not ready (${status}).`;
      fail(-2, message);
      return () => {};
    }

    firstTokenTimer = window.setTimeout(
      () =>
        fail(
          -3,
          'No response in 25s. The model may not be installed, or the runtime did not accept the call.',
        ),
      FIRST_TOKEN_TIMEOUT_MS,
    );

    return () => {
      window.clearTimeout(firstTokenTimer);
      window.clearTimeout(staleTimer);
      if (handle.ok) handle.cancel();
    };
  }

  const reply = MOCK_REPLIES[mockReplyIdx % MOCK_REPLIES.length];
  mockReplyIdx += 1;
  let i = 0;
  let cancelled = false;
  const tick = () => {
    if (cancelled) return;
    i = Math.min(reply.length, i + 2 + Math.floor(Math.random() * 4));
    onUpdate({ status: 'streaming', text: reply.slice(0, i) });
    if (i >= reply.length) {
      onUpdate({ status: 'done', text: reply });
      return;
    }
    window.setTimeout(tick, 40 + Math.random() * 50);
  };
  window.setTimeout(tick, 350);

  return () => {
    cancelled = true;
  };
}
