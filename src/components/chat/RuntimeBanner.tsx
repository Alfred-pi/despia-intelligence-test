import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import type { RuntimeReport } from '@/lib/intelligence';

interface Props {
  runtime: RuntimeReport;
}

export function RuntimeBanner({ runtime }: Props) {
  const [open, setOpen] = useState(false);

  if (runtime.ok) return null;

  const headline =
    runtime.status === 'outdated'
      ? 'Update Despia to use on-device AI'
      : 'Preview mode — responses are simulated';

  return (
    <>
      <motion.button
        type="button"
        className="runtime-banner"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => setOpen(true)}
      >
        <span className="runtime-banner-dot" />
        <span className="runtime-banner-text">{headline}</span>
        <Info size={13} strokeWidth={2.5} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="runtime-modal-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="runtime-modal"
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="runtime-modal-head">
                <span>Runtime status</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="runtime-modal-close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="runtime-modal-body">
                <p className="runtime-modal-line">
                  <strong>Status:</strong> {runtime.status}
                </p>
                {runtime.message && (
                  <p className="runtime-modal-line">{runtime.message}</p>
                )}
                <div className="runtime-modal-divider" />
                <p className="runtime-modal-tech">
                  <span>SDK runtime.ok</span>
                  <span>{String(runtime.diagnostics.sdkRuntimeOk)}</span>
                </p>
                <p className="runtime-modal-tech">
                  <span>window.native_runtime</span>
                  <span>{runtime.diagnostics.nativeRuntime ?? '—'}</span>
                </p>
                <p className="runtime-modal-tech">
                  <span>models.available()</span>
                  <span>
                    {runtime.diagnostics.probedAvailable === null
                      ? 'pending'
                      : `${runtime.diagnostics.probedAvailable} models`}
                  </span>
                </p>
                <p className="runtime-modal-tech runtime-modal-ua">
                  <span>userAgent</span>
                  <span>{runtime.diagnostics.userAgent}</span>
                </p>
                <div className="runtime-modal-divider" />
                <p className="runtime-modal-help">
                  {runtime.status === 'outdated'
                    ? 'Your Despia app sees this URL but the on-device intelligence runtime is not available. Update Despia to the latest version, then reopen this app.'
                    : 'On-device inference only runs inside the Despia native runtime. The chat UI works here for design review.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
