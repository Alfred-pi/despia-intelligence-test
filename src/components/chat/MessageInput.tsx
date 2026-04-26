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
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = '0px';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [text]);

  const submit = () => {
    if (streaming) {
      haptic('light');
      onCancel();
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSubmit = streaming || (text.trim().length > 0 && !disabled);

  return (
    <div className="composer">
      <div className={`composer-inner ${disabled ? 'is-disabled' : ''}`}>
        <textarea
          ref={taRef}
          className="composer-field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder ?? 'Message'}
          rows={1}
          disabled={disabled}
          aria-label="Message"
          autoCapitalize="sentences"
          autoCorrect="on"
        />
        <motion.button
          type="button"
          className={`composer-send ${streaming ? 'is-stop' : ''}`}
          onClick={submit}
          disabled={!canSubmit}
          whileTap={canSubmit ? { scale: 0.9 } : undefined}
          animate={{ scale: canSubmit ? 1 : 0.92, opacity: canSubmit ? 1 : 0.45 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          aria-label={streaming ? 'Stop' : 'Send'}
        >
          {streaming ? <Square size={14} fill="currentColor" /> : <ArrowUp size={18} strokeWidth={2.6} />}
        </motion.button>
      </div>
    </div>
  );
}
