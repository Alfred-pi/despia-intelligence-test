import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Copy } from 'lucide-react';

interface DebugEntry {
  id: string;
  at: number;
  source: 'error' | 'unhandledrejection' | 'intelligence' | 'manual';
  message: string;
  stack?: string;
  extra?: unknown;
}

declare global {
  interface Window {
    __debugLog?: (entry: Omit<DebugEntry, 'id' | 'at'>) => void;
  }
}

export function DebugOverlay({ enabled = true }: { enabled?: boolean }) {
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const [open, setOpen] = useState(false);

  const push = useMemo(
    () => (entry: Omit<DebugEntry, 'id' | 'at'>) => {
      setEntries((prev) => [
        { id: crypto.randomUUID?.() ?? String(Math.random()), at: Date.now(), ...entry },
        ...prev,
      ].slice(0, 50));
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    const onError = (e: ErrorEvent) => {
      push({
        source: 'error',
        message: e.message || 'window.error',
        stack: e.error?.stack,
      });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      push({
        source: 'unhandledrejection',
        message:
          reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : JSON.stringify(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    window.__debugLog = push;

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      if (window.__debugLog === push) delete window.__debugLog;
    };
  }, [enabled, push]);

  if (!enabled) return null;

  const count = entries.length;

  const copy = async (entry: DebugEntry) => {
    const text = `[${entry.source}] ${entry.message}\n${entry.stack ?? ''}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <motion.button
        type="button"
        className={`debug-badge ${count > 0 ? 'has-errors' : ''}`}
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.92 }}
        aria-label="Debug log"
      >
        <AlertTriangle size={14} />
        <span>{count}</span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="debug-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="debug-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="debug-sheet-head">
                <span>Debug log · {count}</span>
                <button
                  type="button"
                  className="debug-sheet-close"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="debug-sheet-body">
                {entries.length === 0 && (
                  <div className="debug-empty">No errors captured</div>
                )}
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="debug-entry"
                    onClick={() => copy(entry)}
                  >
                    <div className="debug-entry-head">
                      <span className={`debug-entry-src src-${entry.source}`}>
                        {entry.source}
                      </span>
                      <span className="debug-entry-time">
                        {new Date(entry.at).toLocaleTimeString()}
                      </span>
                      <Copy size={12} />
                    </div>
                    <div className="debug-entry-msg">{entry.message}</div>
                    {entry.stack && (
                      <pre className="debug-entry-stack">{entry.stack}</pre>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function logDebug(entry: { source: DebugEntry['source']; message: string; stack?: string }) {
  window.__debugLog?.(entry);
}
