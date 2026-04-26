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
  try {
    const list = await realIntel.models.available();
    const probedAvailable = Array.isArray(list) ? list.length : 0;
    if (probedAvailable > 0 && realIntel.runtime.ok) {
      publishReport({
        ...runtimeReport,
        ok: true,
        status: 'ready',
        message: null,
        source: 'sdk',
        diagnostics: { ...runtimeReport.diagnostics, probedAvailable },
      });
    } else {
      publishReport({
        ...runtimeReport,
        ok: false,
        source: 'mock',
        diagnostics: { ...runtimeReport.diagnostics, probedAvailable },
      });
    }
  } catch {
    publishReport({
      ...runtimeReport,
      ok: false,
      source: 'mock',
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

function isLive() {
  return runtimeReport.ok;
}

export async function listAvailableModels(): Promise<Model[]> {
  if (isLive()) return realIntel.models.available();
  return MOCK_CATALOG;
}

export async function listInstalledModels(): Promise<Model[]> {
  if (isLive()) {
    const r = await realIntel.models.installed();
    return Array.isArray(r) ? r : [];
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
    const handle = realIntel.run(
      { type: 'text', stream: true, ...params },
      {
        stream: (chunk) => onUpdate({ status: 'streaming', text: chunk }),
        complete: (text) => onUpdate({ status: 'done', text }),
        error: (err) =>
          onUpdate({
            status: 'error',
            text: '',
            error: { code: err.code, message: err.message },
          }),
      },
    );
    return () => {
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
