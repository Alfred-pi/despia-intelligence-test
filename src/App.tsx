import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatPage } from '@/pages/ChatPage';
import { ModelPickerPage } from '@/pages/ModelPickerPage';
import { DebugOverlay } from '@/components/chat/DebugOverlay';
import {
  getRuntimeReport,
  onDownloadEvent,
  probeRuntime,
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
    void hydrate();
    void probeRuntime();
    const unsubscribe = subscribeRuntimeReport(setRuntime);
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
