import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Square } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface Props {
  onSend: (text: string) => void;
  onCancel: () => void;
  streaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, onCancel, streaming, disabled, placeholder }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [text]);

  const handleSubmit = () => {
    if (streaming) {
      haptic('light');
      onCancel();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    haptic('medium');
    onSend(trimmed);
    setText('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="message-input-bar">
      <div className="message-input-inner">
        <textarea
          ref={textareaRef}
          className="message-input-field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? 'Message'}
          rows={1}
          disabled={disabled}
          aria-label="Message"
        />
        <motion.button
          type="button"
          className="message-input-send"
          onClick={handleSubmit}
          disabled={!streaming && (text.trim().length === 0 || disabled)}
          whileTap={{ scale: 0.92 }}
          aria-label={streaming ? 'Stop' : 'Send'}
        >
          {streaming ? <Square size={16} fill="currentColor" /> : <ArrowUp size={18} strokeWidth={2.5} />}
        </motion.button>
      </div>
    </div>
  );
}
