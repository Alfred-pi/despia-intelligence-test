import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ChatPage } from '@/pages/ChatPage';
import { ModelPickerPage } from '@/pages/ModelPickerPage';
import { DebugOverlay } from '@/components/chat/DebugOverlay';
import { isLiveRuntime, onDownloadEvent } from '@/lib/intelligence';
import { useChatStore } from '@/store/chat';

export default function App() {
  const location = useLocation();
  const hydrate = useChatStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
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
      {!isLiveRuntime && (
        <div className="preview-banner">
          UI preview · open in Despia for real on-device inference
        </div>
      )}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/models" element={<ModelPickerPage />} />
          <Route path="*" element={<ChatPage />} />
        </Routes>
      </AnimatePresence>
      <DebugOverlay />
    </>
  );
}
