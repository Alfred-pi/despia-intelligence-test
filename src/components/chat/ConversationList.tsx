import { motion } from 'framer-motion';
import { MessageSquare, Trash2 } from 'lucide-react';
import type { Conversation } from '@/store/chat';

interface Props {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function ConversationList({
  conversations,
  currentId,
  onSelect,
  onDelete,
  onNew,
}: Props) {
  return (
    <div className="conversation-list">
      <button type="button" className="conversation-new" onClick={onNew}>
        <MessageSquare size={16} />
        <span>New conversation</span>
      </button>
      <div className="conversation-items">
        {conversations.length === 0 && (
          <div className="conversation-empty">No conversations yet</div>
        )}
        {conversations.map((conv) => {
          const active = conv.id === currentId;
          return (
            <motion.div
              key={conv.id}
              className={`conversation-item ${active ? 'is-active' : ''}`}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="button"
                className="conversation-select"
                onClick={() => onSelect(conv.id)}
              >
                <span className="conversation-title">{conv.title || 'Untitled'}</span>
                <span className="conversation-meta">
                  {new Date(conv.updatedAt).toLocaleDateString()} · {conv.modelId}
                </span>
              </button>
              <button
                type="button"
                className="conversation-delete"
                onClick={() => onDelete(conv.id)}
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
