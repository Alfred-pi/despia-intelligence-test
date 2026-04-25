import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, Cpu, Plus } from 'lucide-react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { MessageInput } from '@/components/chat/MessageInput';
import { ConversationList } from '@/components/chat/ConversationList';
import { Sheet } from '@/components/ui';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/store/chat';

export function ChatPage() {
  const navigate = useNavigate();
  const { send, cancel, streaming, messages, activeModelId } = useChat();
  const conversations = useChatStore((s) => s.conversations);
  const currentConvId = useChatStore((s) => s.currentConvId);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const [sheetOpen, setSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const activeMessage = messages[messages.length - 1];
  const streamingAssistant =
    streaming && activeMessage?.role === 'assistant' ? activeMessage : null;
  const emptyAssistant = streamingAssistant && streamingAssistant.content.length === 0;

  const newChat = () => {
    useChatStore.setState({ currentConvId: null, messages: [] });
    setSheetOpen(false);
  };

  return (
    <div className="chat-page">
      <div className="chat-top-bar">
        <button
          type="button"
          className="chat-top-icon"
          onClick={() => setSheetOpen(true)}
          aria-label="Conversations"
        >
          <Menu size={20} />
        </button>
        <div className="chat-top-title">Intelligence</div>
        <button
          type="button"
          className="chat-top-icon"
          onClick={() => navigate('/models')}
          aria-label="Models"
        >
          <Cpu size={18} />
          {activeModelId && <span className="chat-top-model">{activeModelId}</span>}
        </button>
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-scroll-inner">
          {messages.length === 0 && (
            <motion.div
              className="chat-empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="chat-empty-title">On-device chat</div>
              <div className="chat-empty-sub">
                {activeModelId
                  ? `Running ${activeModelId}. Prompts never leave your device.`
                  : 'Pick a model to start chatting.'}
              </div>
              {!activeModelId && (
                <button
                  type="button"
                  className="chat-empty-cta"
                  onClick={() => navigate('/models')}
                >
                  <Plus size={14} />
                  Choose a model
                </button>
              )}
            </motion.div>
          )}
          {messages.map((m) => (
            <ChatBubble
              key={m.id}
              message={m}
              streaming={streaming && m.id === streamingAssistant?.id}
            />
          ))}
          {emptyAssistant && <TypingIndicator />}
        </div>
      </div>

      <MessageInput
        onSend={(text) => send(text)}
        onCancel={cancel}
        streaming={streaming}
        disabled={!activeModelId}
        placeholder={activeModelId ? 'Message' : 'Pick a model first'}
      />

      <Sheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Conversations">
        <ConversationList
          conversations={conversations}
          currentId={currentConvId}
          onSelect={async (id) => {
            await selectConversation(id);
            setSheetOpen(false);
          }}
          onDelete={(id) => void deleteConversation(id)}
          onNew={newChat}
        />
      </Sheet>
    </div>
  );
}
