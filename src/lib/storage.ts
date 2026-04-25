import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface StoredMessage {
  id: string;
  convId: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface StoredConversation {
  id: string;
  title: string;
  modelId: string;
  createdAt: number;
  updatedAt: number;
}

export interface StoredSettings {
  activeModelId: string | null;
  theme: 'dark' | 'light';
}

interface ChatDB extends DBSchema {
  conversations: {
    key: string;
    value: StoredConversation;
    indexes: { byUpdated: number };
  };
  messages: {
    key: string;
    value: StoredMessage;
    indexes: { byConv: string };
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = 'despia-intelligence-test';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ChatDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ChatDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ChatDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const conv = db.createObjectStore('conversations', { keyPath: 'id' });
        conv.createIndex('byUpdated', 'updatedAt');
        const msg = db.createObjectStore('messages', { keyPath: 'id' });
        msg.createIndex('byConv', 'convId');
        db.createObjectStore('settings', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export async function listConversations(): Promise<StoredConversation[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('conversations', 'byUpdated');
  return all.reverse();
}

export async function getConversation(id: string): Promise<StoredConversation | undefined> {
  const db = await getDB();
  return db.get('conversations', id);
}

export async function saveConversation(conv: StoredConversation): Promise<void> {
  const db = await getDB();
  await db.put('conversations', conv);
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['conversations', 'messages'], 'readwrite');
  await tx.objectStore('conversations').delete(id);
  const msgIdx = tx.objectStore('messages').index('byConv');
  let cursor = await msgIdx.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function listMessages(convId: string): Promise<StoredMessage[]> {
  const db = await getDB();
  const msgs = await db.getAllFromIndex('messages', 'byConv', convId);
  return msgs.sort((a, b) => a.timestamp - b.timestamp);
}

export async function saveMessage(msg: StoredMessage): Promise<void> {
  const db = await getDB();
  await db.put('messages', msg);
}

const SETTINGS_KEY = 'app-settings';

export async function loadSettings(): Promise<StoredSettings> {
  const db = await getDB();
  const row = await db.get('settings', SETTINGS_KEY);
  const defaults: StoredSettings = { activeModelId: null, theme: 'dark' };
  if (!row) return defaults;
  return { ...defaults, ...(row.value as Partial<StoredSettings>) };
}

export async function saveSettings(settings: StoredSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key: SETTINGS_KEY, value: settings });
  void syncSettingsToDespia(settings);
}

async function syncSettingsToDespia(settings: StoredSettings): Promise<void> {
  try {
    const despiaMod = await import('despia-native').catch(() => null);
    const despiaFn: ((url: string) => Promise<unknown>) | undefined =
      (despiaMod as { default?: (url: string) => Promise<unknown> } | null)?.default;
    if (!despiaFn) return;
    const payload = encodeURIComponent(JSON.stringify(settings));
    await despiaFn(`writevalue://${payload}`);
  } catch {
    // best-effort backup; ignore failures
  }
}

export function newId(): string {
  return (
    crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
}
