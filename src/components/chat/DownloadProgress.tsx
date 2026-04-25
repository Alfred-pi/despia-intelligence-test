import { motion } from 'framer-motion';
import type { DownloadState } from '@/store/chat';

interface Props {
  state: DownloadState;
}

export function DownloadProgress({ state }: Props) {
  const pct = Math.max(0, Math.min(100, state.progress));
  return (
    <div className={`download-progress status-${state.status}`}>
      <div className="download-progress-head">
        <span className="download-progress-label">
          {state.status === 'starting' && 'Preparing…'}
          {state.status === 'downloading' && `Downloading ${Math.round(pct)}%`}
          {state.status === 'done' && 'Installed'}
          {state.status === 'error' && `Failed: ${state.error ?? 'unknown'}`}
        </span>
      </div>
      <div className="download-progress-track">
        <motion.div
          className="download-progress-fill"
          animate={{ width: `${pct}%` }}
          transition={{ ease: 'easeOut', duration: 0.25 }}
        />
      </div>
    </div>
  );
}
