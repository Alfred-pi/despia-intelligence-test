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

export type RunParams = {
  model: string;
  prompt: string;
  system?: string;
};

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

export const isLiveRuntime: boolean = realIntel.runtime.ok;

export function getRuntimeState() {
  return {
    ok: realIntel.runtime.ok,
    status: realIntel.runtime.status,
    message: realIntel.runtime.message,
  };
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

const mockInstalled = new Set<string>(['lfm2.5-350m']);
const mockListeners: Record<DownloadEvent, Set<(...args: never[]) => void>> = {
  downloadStart: new Set(),
  downloadProgress: new Set(),
  downloadEnd: new Set(),
  downloadError: new Set(),
};

function emit(event: DownloadEvent, ...args: unknown[]): void {
  for (const fn of mockListeners[event]) {
    (fn as (...a: unknown[]) => void)(...args);
  }
}

export async function listAvailableModels(): Promise<Model[]> {
  if (isLiveRuntime) return realIntel.models.available();
  return MOCK_CATALOG;
}

export async function listInstalledModels(): Promise<Model[]> {
  if (isLiveRuntime) {
    const r = await realIntel.models.installed();
    return Array.isArray(r) ? r : [];
  }
  return MOCK_CATALOG.filter((m) => mockInstalled.has(m.id));
}

export function downloadModel(modelId: string, callbacks?: DownloadCallbacks): void {
  if (isLiveRuntime) {
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
  if (isLiveRuntime) {
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
  if (isLiveRuntime) {
    return realIntel.on(event, fn as never);
  }
  mockListeners[event].add(fn as never);
  return () => {
    mockListeners[event].delete(fn as never);
  };
}

const MOCK_REPLIES = [
  "Voici une réponse simulée. L'app tourne en mode preview UI — pour de vraies réponses, ouvre-la dans Despia. Le SDK *despia-intelligence* fait l'inference 100% on-device.",
  "Bien reçu. En mode démo je ne fais que streamer un texte fictif pour montrer l'UI. Une fois dans Despia, le modèle choisi tournera localement sur le Neural Engine ou GPU du téléphone.\n\n- Aucun token n'est envoyé au cloud\n- Aucun cost par token\n- Marche offline",
  "C'est une démo de l'interface. La logique de streaming, de cancel, et l'historique IndexedDB sont tous fonctionnels — seuls les tokens viennent d'un mock. Essaie d'envoyer un autre message pour voir le typing indicator et le scroll.",
];

let mockReplyIdx = 0;

export function runStream(
  params: RunParams,
  onUpdate: (state: StreamState) => void,
): () => void {
  if (isLiveRuntime) {
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
