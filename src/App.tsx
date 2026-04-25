import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ChatPage } from '@/pages/ChatPage';
import { ModelPickerPage } from '@/pages/ModelPickerPage';
import { OpenInDespiaPage } from '@/pages/OpenInDespiaPage';
import { DebugOverlay } from '@/components/chat/DebugOverlay';
import { intelligence, getRuntimeState } from '@/lib/intelligence';
import { useChatStore } from '@/store/chat';

export default function App() {
  const location = useLocation();
  const hydrate = useChatStore((s) => s.hydrate);
  const runtime = getRuntimeState();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!runtime.ok) return;
    const store = useChatStore.getState();
    const offStart = intelligence.on('downloadStart', (id) => store.setDownloadStart(id));
    const offProgress = intelligence.on('downloadProgress', (id, pct) =>
      store.setDownloadProgress(id, pct),
    );
    const offEnd = intelligence.on('downloadEnd', (id) => store.setDownloadEnd(id));
    const offError = intelligence.on('downloadError', (id, err) =>
      store.setDownloadError(id, err),
    );
    return () => {
      offStart();
      offProgress();
      offEnd();
      offError();
    };
  }, [runtime.ok]);

  if (!runtime.ok) {
    return <OpenInDespiaPage status={runtime.status} message={runtime.message} />;
  }

  return (
    <>
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
