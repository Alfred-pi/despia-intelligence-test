import { memo } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/store/chat';

interface Props {
  message: Message;
  streaming?: boolean;
}

function ChatBubbleImpl({ message, streaming }: Props) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      className={`bubble-row ${isUser ? 'is-user' : 'is-ai'}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    >
      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-ai'}`}>
        {isUser ? (
          <p className="bubble-text">{message.content}</p>
        ) : (
          <div className="bubble-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || ' '}
            </ReactMarkdown>
            {streaming && message.content.length > 0 && <span className="bubble-cursor">▍</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const ChatBubble = memo(ChatBubbleImpl);
