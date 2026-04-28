import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatPage } from '@/pages/ChatPage';
import { ModelPickerPage } from '@/pages/ModelPickerPage';
import { DebugOverlay } from '@/components/chat/DebugOverlay';
import {
  getRuntimeReport,
  listInstalledModels,
  onDownloadEvent,
  probeRuntime,
  snapshotIntelligenceState,
  subscribeRuntimeReport,
  type RuntimeReport,
} from '@/lib/intelligence';
import { useChatStore } from '@/store/chat';

declare global {
  interface Window {
    __splashRemove?: () => void;
  }
}

export default function App() {
  const location = useLocation();
  const hydrate = useChatStore((s) => s.hydrate);
  const [runtime, setRuntime] = useState<RuntimeReport>(getRuntimeReport());

  useEffect(() => {
    const unsubscribe = subscribeRuntimeReport(setRuntime);
    void (async () => {
      await hydrate();
      await probeRuntime();
      // Push a runtime snapshot into the debug overlay so the state of
      // window.intelligence registrars is visible from inside the app.
      try {
        const fn = (window as unknown as {
          __debugLog?: (e: { source: string; message: string; stack?: string }) => void;
        }).__debugLog;
        if (fn) {
          const snap = snapshotIntelligenceState();
          fn({
            source: 'intelligence',
            message: 'Boot snapshot',
            stack: JSON.stringify(snap, null, 2),
          });
        }
      } catch {
        // ignore
      }
      // If we are now live but the active model (often a mock leftover)
      // is not actually installed, reset it so the user picks a real one.
      const store = useChatStore.getState();
      if (getRuntimeReport().ok && store.activeModelId) {
        const installed = await listInstalledModels();
        if (!installed.some((m) => m.id === store.activeModelId)) {
          useChatStore.setState({ activeModelId: null });
        }
      }
    })();
    return unsubscribe;
  }, [hydrate]);

  useEffect(() => {
    const store = useChatStore.getState();
    const offStart = onDownloadEvent('downloadStart', (id) => store.setDownloadStart(id));
    const offProgress = onDownloadEvent('downloadProgress', (id, pct) =>
      store.setDownloadProgress(id, pct),
    );
    const offEnd = onDownloadEvent('downloadEnd', (id) => store.setDownloadEnd(id));
    const offError = onDownloadEvent('downloadError', (id, err) =>
      store.setDownloadError(id, err),
    );
    return () => {
      offStart();
      offProgress();
      offEnd();
      offError();
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}
        >
          <Routes location={location}>
            <Route path="/" element={<ChatPage runtime={runtime} />} />
            <Route path="/models" element={<ModelPickerPage />} />
            <Route path="*" element={<ChatPage runtime={runtime} />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <DebugOverlay />
    </>
  );
}
