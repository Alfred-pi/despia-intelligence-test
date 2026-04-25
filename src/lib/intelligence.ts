import intelligence, {
  type Model,
  type ModelCategory,
  type RuntimeStatus,
} from 'despia-intelligence';

export { intelligence };
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

export function runStream(
  params: RunParams,
  onUpdate: (state: StreamState) => void,
): () => void {
  const handle = intelligence.run(
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

export function isRuntimeReady(): boolean {
  return intelligence.runtime.ok;
}

export function getRuntimeState() {
  return {
    ok: intelligence.runtime.ok,
    status: intelligence.runtime.status,
    message: intelligence.runtime.message,
  };
}
