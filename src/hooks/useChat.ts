import { useCallback, useRef } from 'react';
import { runStream } from '@/lib/intelligence';
import { useChatStore } from '@/store/chat';

export function useChat() {
  const cancelRef = useRef<(() => void) | null>(null);
  const currentConvId = useChatStore((s) => s.currentConvId);
  const activeModelId = useChatStore((s) => s.activeModelId);
  const streaming = useChatStore((s) => s.streaming);
  const streamError = useChatStore((s) => s.streamError);
  const messages = useChatStore((s) => s.messages);

  const send = useCallback(
    async (text: string, system?: string) => {
      const store = useChatStore.getState();
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!store.activeModelId) {
        store.setStreamError('Select a model first');
        return;
      }
      let convId = store.currentConvId;
      if (!convId) {
        const conv = await store.createConversation(store.activeModelId);
        convId = conv.id;
      }
      await store.appendUserMessage(trimmed);
      const assistant = store.startAssistantMessage();
      store.setStreaming(true);
      store.setStreamError(null);

      cancelRef.current = runStream(
        {
          model: store.activeModelId,
          prompt: trimmed,
          system,
        },
        (state) => {
          const s = useChatStore.getState();
          if (state.status === 'streaming') {
            s.updateAssistantStream(assistant.id, state.text);
          } else if (state.status === 'done') {
            void s.finalizeAssistantMessage(assistant.id, state.text);
            s.setStreaming(false);
            cancelRef.current = null;
          } else if (state.status === 'error') {
            void s.failAssistantMessage(
              assistant.id,
              `${state.error.code}: ${state.error.message}`,
            );
            s.setStreaming(false);
            cancelRef.current = null;
          }
        },
      );
    },
    [],
  );

  const cancel = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    useChatStore.getState().setStreaming(false);
  }, []);

  return {
    send,
    cancel,
    streaming,
    streamError,
    messages,
    currentConvId,
    activeModelId,
  };
}
