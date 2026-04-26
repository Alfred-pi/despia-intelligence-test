import { useEffect } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { MessageSquarePlus, Trash2, X } from 'lucide-react';
import { useChatStore, type Conversation } from '@/store/chat';
import { haptic } from '@/lib/haptics';

interface Props {
  open: boolean;
  onClose: () => void;
  onNew: () => void;
}

export function ConversationsSheet({ open, onClose, onNew }: Props) {
  const conversations = useChatStore((s) => s.conversations);
  const currentId = useChatStore((s) => s.currentConvId);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const sections = groupByRecency(conversations);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="conv-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="conv-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="conv-grabber" aria-hidden="true" />
            <div className="conv-head">
              <span className="conv-head-title">Conversations</span>
              <button type="button" className="conv-head-close" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <button
              type="button"
              className="conv-new"
              onClick={() => {
                haptic('selection');
                onNew();
              }}
            >
              <MessageSquarePlus size={16} strokeWidth={2.2} />
              <span>New conversation</span>
            </button>

            <div className="conv-body">
              {conversations.length === 0 && (
                <div className="conv-empty">No conversations yet.</div>
              )}
              {sections.map((section) => (
                <div key={section.label} className="conv-section">
                  <div className="conv-section-label">{section.label}</div>
                  <div className="conv-section-items">
                    {section.items.map((conv) => (
                      <SwipeRow
                        key={conv.id}
                        active={conv.id === currentId}
                        title={conv.title || 'Untitled'}
                        subtitle={`${conv.modelId} · ${formatRelative(conv.updatedAt)}`}
                        onSelect={async () => {
                          haptic('selection');
                          await selectConversation(conv.id);
                          onClose();
                        }}
                        onDelete={() => {
                          haptic('error');
                          void deleteConversation(conv.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SwipeRowProps {
  active: boolean;
  title: string;
  subtitle: string;
  onSelect: () => void;
  onDelete: () => void;
}

function SwipeRow({ active, title, subtitle, onSelect, onDelete }: SwipeRowProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-80, -20, 0], [1, 0.6, 0]);
  const deleteScale = useTransform(x, [-80, -40, 0], [1, 0.8, 0.6]);

  return (
    <div className="conv-row-wrap">
      <motion.div
        className="conv-row-action"
        style={{ opacity: deleteOpacity, scale: deleteScale }}
        onClick={onDelete}
      >
        <Trash2 size={16} />
      </motion.div>
      <motion.div
        className={`conv-row ${active ? 'is-active' : ''}`}
        drag="x"
        dragConstraints={{ left: -88, right: 0 }}
        dragElastic={0.05}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -56) {
            x.set(-72);
          } else {
            x.set(0);
          }
        }}
      >
        <button type="button" className="conv-row-button" onClick={onSelect}>
          <span className="conv-row-title">{title}</span>
          <span className="conv-row-sub">{subtitle}</span>
        </button>
      </motion.div>
    </div>
  );
}

function groupByRecency(list: Conversation[]): Array<{ label: string; items: Conversation[] }> {
  const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const groups: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    'This week': [],
    Earlier: [],
  };
  for (const conv of sorted) {
    const age = now - conv.updatedAt;
    if (age < dayMs) groups.Today.push(conv);
    else if (age < 2 * dayMs) groups.Yesterday.push(conv);
    else if (age < 7 * dayMs) groups['This week'].push(conv);
    else groups.Earlier.push(conv);
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.round(diff / min))}m`;
  if (diff < day) return `${Math.round(diff / hour)}h`;
  if (diff < 7 * day) return `${Math.round(diff / day)}d`;
  return new Date(timestamp).toLocaleDateString();
}
