import { useCallback, useEffect, useState } from 'react';
import {
  downloadModel,
  listAvailableModels,
  listInstalledModels,
  removeModel,
  type Model,
} from '@/lib/intelligence';
import { useChatStore } from '@/store/chat';

export interface ModelsState {
  available: Model[];
  installed: Model[];
  loading: boolean;
  error: string | null;
}

export function useModels() {
  const [state, setState] = useState<ModelsState>({
    available: [],
    installed: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [available, installed] = await Promise.all([
        listAvailableModels(),
        listInstalledModels(),
      ]);
      setState({ available, installed, loading: false, error: null });
    } catch (err) {
      setState({
        available: [],
        installed: [],
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const download = useCallback(
    (modelId: string) => {
      const store = useChatStore.getState();
      store.setDownloadStart(modelId);
      downloadModel(modelId, {
        onStart: () => store.setDownloadStart(modelId),
        onProgress: (pct) => store.setDownloadProgress(modelId, pct),
        onEnd: () => {
          store.setDownloadEnd(modelId);
          void refresh();
        },
        onError: (err) => store.setDownloadError(modelId, err),
      });
    },
    [refresh],
  );

  const remove = useCallback(
    async (modelId: string) => {
      await removeModel(modelId);
      await refresh();
    },
    [refresh],
  );

  return { ...state, refresh, download, remove };
}
