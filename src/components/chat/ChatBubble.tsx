import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/store/chat';

interface Props {
  message: Message;
  streaming?: boolean;
}

export function ChatBubble({ message, streaming }: Props) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      className={`chat-bubble-wrap ${isUser ? 'is-user' : 'is-ai'}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
        {isUser ? (
          <p className="chat-bubble-text">{message.content}</p>
        ) : (
          <div className="chat-bubble-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || (streaming ? '' : '…')}
            </ReactMarkdown>
            {streaming && <span className="chat-cursor">▍</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
