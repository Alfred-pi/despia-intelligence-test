import { motion } from 'framer-motion';
import { Smartphone, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { RuntimeStatus } from '@/lib/intelligence';

interface Props {
  status: RuntimeStatus;
  message: string | null;
}

export function OpenInDespiaPage({ status, message }: Props) {
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== 'undefined' ? window.location.href : '';
  const deepLink = `despia://open?url=${encodeURIComponent(appUrl)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const headline =
    status === 'outdated' ? 'Update the Despia app' : 'Open in the Despia app';

  const body =
    status === 'outdated'
      ? 'This app needs a newer Despia runtime to run on-device AI. Update the Despia app, then reopen this link.'
      : 'On-device AI runs only inside the Despia native runtime. Open this URL in the Despia app to launch the chat.';

  return (
    <div className="open-in-despia">
      <motion.div
        className="open-in-despia-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="open-in-despia-icon">
          <Smartphone size={32} />
        </div>
        <h1 className="open-in-despia-title">{headline}</h1>
        <p className="open-in-despia-body">{body}</p>
        {message && <p className="open-in-despia-note">{message}</p>}

        <div className="open-in-despia-url" onClick={copy}>
          <span>{appUrl || '—'}</span>
          <button type="button" aria-label="Copy URL">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <a className="open-in-despia-cta" href={deepLink}>
          <ExternalLink size={16} />
          Open in Despia
        </a>

        <p className="open-in-despia-footer">
          Chat runs 100% on your device. No cloud. No API keys. No tracking.
        </p>
      </motion.div>
    </div>
  );
}
