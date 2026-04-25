import { useCallback, useEffect, useState } from 'react';
import { intelligence, type Model } from '@/lib/intelligence';
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
      const [availableRaw, installedRaw] = await Promise.all([
        intelligence.models.available(),
        intelligence.models.installed(),
      ]);
      const installed = Array.isArray(installedRaw) ? installedRaw : [];
      setState({
        available: availableRaw,
        installed,
        loading: false,
        error: null,
      });
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

  const download = useCallback((modelId: string) => {
    const store = useChatStore.getState();
    store.setDownloadStart(modelId);
    intelligence.models.download(modelId, {
      onStart: () => store.setDownloadStart(modelId),
      onProgress: (pct) => store.setDownloadProgress(modelId, pct),
      onEnd: () => {
        store.setDownloadEnd(modelId);
        void refresh();
      },
      onError: (err) => store.setDownloadError(modelId, err),
    });
  }, [refresh]);

  const remove = useCallback(
    async (modelId: string) => {
      await intelligence.models.remove(modelId);
      await refresh();
    },
    [refresh],
  );

  return { ...state, refresh, download, remove };
}
