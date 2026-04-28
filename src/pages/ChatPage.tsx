import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, ChevronDown, Plus, Sparkles } from 'lucide-react';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { MessageInput } from '@/components/chat/MessageInput';
import { ConversationsSheet } from '@/components/chat/ConversationsSheet';
import { RuntimeBanner } from '@/components/chat/RuntimeBanner';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/store/chat';
import type { RuntimeReport } from '@/lib/intelligence';
import { haptic } from '@/lib/haptics';

const SUGGESTED_PROMPTS = [
  { title: 'Plan a weekend', subtitle: '2 days in the mountains' },
  { title: 'Explain a concept', subtitle: 'TCP packet loss in 3 lines' },
  { title: 'Write a message', subtitle: 'Reply: thanks for the gift' },
  { title: 'Brainstorm', subtitle: 'Names for a small company' },
];

interface Props {
  runtime: RuntimeReport;
}

export function ChatPage({ runtime }: Props) {
  const navigate = useNavigate();
  const { send, cancel, streaming, messages, activeModelId } = useChat();
  const [sheetOpen, setSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: streaming ? 'auto' : 'smooth' });
  }, [messages, streaming]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const lastMessage = messages[messages.length - 1];
  const showTyping =
    streaming && lastMessage?.role === 'assistant' && lastMessage.content.length === 0;

  const newChat = () => {
    haptic('selection');
    useChatStore.setState({ currentConvId: null, messages: [] });
    setSheetOpen(false);
  };

  const submitPrompt = (text: string) => {
    haptic('medium');
    void send(text);
  };

  return (
    <>
      <header className="ios-header">
        <button
          type="button"
          className="ios-header-btn"
          onClick={() => {
            haptic('light');
            setSheetOpen(true);
          }}
          aria-label="Conversations"
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          className="ios-header-title-btn"
          onClick={() => navigate('/models')}
        >
          <span className="ios-header-eyebrow">
            <span className={`ios-status-dot readiness-${runtime.readiness}`} />
            <span>{runtimeLabel(runtime)}</span>
          </span>
          <span className="ios-header-title">
            {activeModelId ?? 'Choose model'}
            <ChevronDown size={14} strokeWidth={2.5} />
          </span>
        </button>
        <button
          type="button"
          className="ios-header-btn"
          onClick={newChat}
          aria-label="New chat"
        >
          <Plus size={20} strokeWidth={2.2} />
        </button>
      </header>

      <RuntimeBanner runtime={runtime} />

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-scroll-inner">
          {messages.length === 0 ? (
            <EmptyHero
              activeModelId={activeModelId}
              onPick={() => navigate('/models')}
              onPrompt={submitPrompt}
            />
          ) : (
            messages.map((m, idx) => (
              <ChatBubble
                key={m.id}
                message={m}
                streaming={streaming && idx === messages.length - 1 && m.role === 'assistant'}
              />
            ))
          )}
          {showTyping && (
            <div className="chat-typing-row">
              <TypingIndicator />
            </div>
          )}
        </div>
      </div>

      <MessageInput
        onSend={submitPrompt}
        onCancel={cancel}
        streaming={streaming}
        disabled={!activeModelId}
        placeholder={activeModelId ? 'Message' : 'Pick a model first'}
      />

      <ConversationsSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onNew={newChat} />
    </>
  );
}

function runtimeLabel(runtime: RuntimeReport): string {
  if (runtime.readiness === 'ready') return 'Live · on-device';
  if (runtime.readiness === 'flagged-only') return 'Runtime partial';
  if (runtime.status === 'outdated') return 'Update Despia';
  if (runtime.status === 'unavailable') return 'Preview UI';
  return 'Preview';
}

interface EmptyProps {
  activeModelId: string | null;
  onPick: () => void;
  onPrompt: (text: string) => void;
}

function EmptyHero({ activeModelId, onPick, onPrompt }: EmptyProps) {
  return (
    <motion.div
      className="empty-hero"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 28 }}
    >
      <div className="empty-hero-icon" aria-hidden="true">
        <Sparkles size={26} strokeWidth={2} />
      </div>
      <h1 className="empty-hero-title">On-device chat</h1>
      <p className="empty-hero-sub">
        {activeModelId
          ? `Running ${activeModelId}. Prompts never leave your phone.`
          : 'Pick a small model to get started — the smaller, the faster.'}
      </p>
      {!activeModelId ? (
        <motion.button
          type="button"
          className="empty-hero-cta"
          onClick={onPick}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Choose a model
        </motion.button>
      ) : (
        <div className="prompt-grid">
          {SUGGESTED_PROMPTS.map((p, i) => (
            <motion.button
              key={p.title}
              type="button"
              className="prompt-card"
              onClick={() => onPrompt(`${p.title}: ${p.subtitle}`)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="prompt-card-title">{p.title}</span>
              <span className="prompt-card-sub">{p.subtitle}</span>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
