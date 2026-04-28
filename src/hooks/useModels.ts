import { useCallback, useEffect, useState } from 'react';
import {
  downloadModel,
  isCatalogFallback,
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
  catalogFallback: boolean;
}

export function useModels() {
  const [state, setState] = useState<ModelsState>({
    available: [],
    installed: [],
    loading: true,
    error: null,
    catalogFallback: false,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [available, installed] = await Promise.all([
        listAvailableModels(),
        listInstalledModels(),
      ]);
      setState({
        available,
        installed,
        loading: false,
        error: null,
        catalogFallback: isCatalogFallback(available),
      });
    } catch (err) {
      setState({
        available: [],
        installed: [],
        loading: false,
        error: err instanceof Error ? err.message : String(err),
        catalogFallback: false,
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
