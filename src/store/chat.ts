import { create } from 'zustand';
import {
  listConversations,
  listMessages,
  saveConversation,
  deleteConversation as dbDeleteConversation,
  saveMessage,
  loadSettings,
  saveSettings,
  newId,
  type StoredConversation,
  type StoredMessage,
  type StoredSettings,
} from '@/lib/storage';

export type Message = StoredMessage;
export type Conversation = StoredConversation;

export interface DownloadState {
  modelId: string;
  progress: number;
  status: 'starting' | 'downloading' | 'done' | 'error';
  error?: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConvId: string | null;
  messages: Message[];
  activeModelId: string | null;
  theme: 'dark' | 'light';
  streaming: boolean;
  streamError: string | null;
  downloads: Record<string, DownloadState>;

  // Bootstrap
  hydrate: () => Promise<void>;

  // Conversations
  createConversation: (modelId: string, title?: string) => Promise<Conversation>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;

  // Messages
  appendUserMessage: (content: string) => Promise<Message>;
  startAssistantMessage: () => Message;
  updateAssistantStream: (messageId: string, content: string) => void;
  finalizeAssistantMessage: (messageId: string, content: string) => Promise<void>;
  failAssistantMessage: (messageId: string, error: string) => Promise<void>;
  setStreaming: (v: boolean) => void;
  setStreamError: (err: string | null) => void;

  // Settings
  setActiveModel: (modelId: string) => Promise<void>;
  setTheme: (theme: 'dark' | 'light') => Promise<void>;

  // Downloads
  setDownloadProgress: (modelId: string, progress: number) => void;
  setDownloadStart: (modelId: string) => void;
  setDownloadEnd: (modelId: string) => void;
  setDownloadError: (modelId: string, error: string) => void;
}

const persistSettings = async (state: StoredSettings) => {
  await saveSettings(state);
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConvId: null,
  messages: [],
  activeModelId: null,
  theme: 'dark',
  streaming: false,
  streamError: null,
  downloads: {},

  hydrate: async () => {
    const [conversations, settings] = await Promise.all([
      listConversations(),
      loadSettings(),
    ]);
    set({
      conversations,
      activeModelId: settings.activeModelId,
      theme: settings.theme,
    });
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  },

  createConversation: async (modelId, title) => {
    const now = Date.now();
    const conv: Conversation = {
      id: newId(),
      title: title ?? 'New conversation',
      modelId,
      createdAt: now,
      updatedAt: now,
    };
    await saveConversation(conv);
    set((s) => ({
      conversations: [conv, ...s.conversations],
      currentConvId: conv.id,
      messages: [],
    }));
    return conv;
  },

  selectConversation: async (id) => {
    const messages = await listMessages(id);
    set({ currentConvId: id, messages });
  },

  deleteConversation: async (id) => {
    await dbDeleteConversation(id);
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      const isCurrent = s.currentConvId === id;
      return {
        conversations,
        currentConvId: isCurrent ? null : s.currentConvId,
        messages: isCurrent ? [] : s.messages,
      };
    });
  },

  renameConversation: async (id, title) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    const updated: Conversation = { ...conv, title, updatedAt: Date.now() };
    await saveConversation(updated);
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? updated : c)),
    }));
  },

  appendUserMessage: async (content) => {
    const convId = get().currentConvId;
    if (!convId) throw new Error('no active conversation');
    const msg: Message = {
      id: newId(),
      convId,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    await saveMessage(msg);
    const conv = get().conversations.find((c) => c.id === convId);
    if (conv) {
      const updated: Conversation = { ...conv, updatedAt: msg.timestamp };
      if (conv.title === 'New conversation') {
        updated.title = content.slice(0, 40);
      }
      await saveConversation(updated);
      set((s) => ({
        conversations: s.conversations.map((c) => (c.id === convId ? updated : c)),
      }));
    }
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },

  startAssistantMessage: () => {
    const convId = get().currentConvId;
    if (!convId) throw new Error('no active conversation');
    const msg: Message = {
      id: newId(),
      convId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },

  updateAssistantStream: (messageId, content) => {
    set((s) => ({
      messages: s.messages.map((m) => (m.id === messageId ? { ...m, content } : m)),
    }));
  },

  finalizeAssistantMessage: async (messageId, content) => {
    const now = Date.now();
    const final: Message | undefined = get().messages.find((m) => m.id === messageId);
    if (!final) return;
    const updated: Message = { ...final, content, timestamp: final.timestamp || now };
    await saveMessage(updated);
    set((s) => ({
      messages: s.messages.map((m) => (m.id === messageId ? updated : m)),
    }));
  },

  failAssistantMessage: async (messageId, error) => {
    const content = `⚠️ ${error}`;
    const final = get().messages.find((m) => m.id === messageId);
    if (!final) return;
    const updated: Message = { ...final, content };
    await saveMessage(updated);
    set((s) => ({
      messages: s.messages.map((m) => (m.id === messageId ? updated : m)),
      streamError: error,
    }));
  },

  setStreaming: (v) => set({ streaming: v }),
  setStreamError: (err) => set({ streamError: err }),

  setActiveModel: async (modelId) => {
    set({ activeModelId: modelId });
    await persistSettings({ activeModelId: modelId, theme: get().theme });
  },

  setTheme: async (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    await persistSettings({ activeModelId: get().activeModelId, theme });
  },

  setDownloadStart: (modelId) =>
    set((s) => ({
      downloads: { ...s.downloads, [modelId]: { modelId, progress: 0, status: 'starting' } },
    })),

  setDownloadProgress: (modelId, progress) =>
    set((s) => ({
      downloads: {
        ...s.downloads,
        [modelId]: { modelId, progress, status: 'downloading' },
      },
    })),

  setDownloadEnd: (modelId) =>
    set((s) => ({
      downloads: {
        ...s.downloads,
        [modelId]: { modelId, progress: 100, status: 'done' },
      },
    })),

  setDownloadError: (modelId, error) =>
    set((s) => ({
      downloads: {
        ...s.downloads,
        [modelId]: { modelId, progress: 0, status: 'error', error },
      },
    })),
}));
