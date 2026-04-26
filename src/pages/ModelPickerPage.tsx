import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Download, Trash2, RefreshCw } from 'lucide-react';
import { useModels } from '@/hooks/useModels';
import { useChatStore } from '@/store/chat';
import { DownloadProgress } from '@/components/chat/DownloadProgress';
import { MODEL_META, type Model } from '@/lib/intelligence';
import { haptic } from '@/lib/haptics';

const TIER_ORDER: Record<'Any' | 'Modern' | 'Flagship', number> = {
  Any: 0,
  Modern: 1,
  Flagship: 2,
};

export function ModelPickerPage() {
  const navigate = useNavigate();
  const { available, installed, loading, error, download, remove, refresh } = useModels();
  const activeModelId = useChatStore((s) => s.activeModelId);
  const setActiveModel = useChatStore((s) => s.setActiveModel);
  const downloads = useChatStore((s) => s.downloads);

  const installedIds = new Set(installed.map((m) => m.id));
  const installedSet = available.filter((m) => installedIds.has(m.id));
  const otherModels = sortByTier(available.filter((m) => !installedIds.has(m.id)));

  const handleSelect = async (id: string) => {
    haptic('success');
    await setActiveModel(id);
    navigate(-1);
  };

  return (
    <>
      <header className="ios-header">
        <button
          type="button"
          className="ios-header-btn"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} strokeWidth={2.4} />
        </button>
        <div className="ios-header-title-static">
          <span className="ios-header-eyebrow muted">11 models</span>
          <span className="ios-header-title">Models</span>
        </div>
        <button
          type="button"
          className="ios-header-btn"
          onClick={() => {
            haptic('light');
            void refresh();
          }}
          aria-label="Refresh"
        >
          <motion.span
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.8, repeat: loading ? Infinity : 0, ease: 'linear' }}
            style={{ display: 'inline-flex' }}
          >
            <RefreshCw size={18} strokeWidth={2.2} />
          </motion.span>
        </button>
      </header>

      <div className="page-scroll">
        {error && (
          <div className="error-card">
            <p>Could not load catalog</p>
            <span>{error}</span>
            <button type="button" onClick={refresh}>Retry</button>
          </div>
        )}

        <AnimatePresence>
          {installedSet.length > 0 && (
            <motion.section
              className="model-section"
              key="installed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="model-section-title">Installed</h2>
              <div className="model-section-list">
                {installedSet.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    installed
                    active={activeModelId === model.id}
                    onSelect={() => handleSelect(model.id)}
                    onRemove={() => {
                      haptic('error');
                      void remove(model.id);
                    }}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="model-section">
          <h2 className="model-section-title">
            {installedSet.length > 0 ? 'More models' : 'Available'}
          </h2>
          <div className="model-section-list">
            {otherModels.map((model) => {
              const dl = downloads[model.id];
              return (
                <ModelCard
                  key={model.id}
                  model={model}
                  download={dl}
                  onDownload={() => {
                    haptic('medium');
                    download(model.id);
                  }}
                />
              );
            })}
            {!loading && otherModels.length === 0 && installedSet.length === 0 && (
              <div className="empty-soft">No models in the catalog.</div>
            )}
          </div>
        </section>

        <p className="model-footnote">
          Models download once from Hugging Face and stay on this device.
          Use Wi-Fi for the first download.
        </p>
      </div>
    </>
  );
}

interface CardProps {
  model: Model;
  installed?: boolean;
  active?: boolean;
  download?: { progress: number; status: 'starting' | 'downloading' | 'done' | 'error'; error?: string };
  onSelect?: () => void;
  onRemove?: () => void;
  onDownload?: () => void;
}

function ModelCard({
  model,
  installed,
  active,
  download,
  onSelect,
  onRemove,
  onDownload,
}: CardProps) {
  const meta = MODEL_META[model.id];
  const isDownloading = download && download.status !== 'done' && download.status !== 'error';

  return (
    <motion.div
      className={`model-card ${active ? 'is-active' : ''}`}
      whileTap={installed ? { scale: 0.985 } : undefined}
    >
      <button
        type="button"
        className="model-card-main"
        onClick={installed ? onSelect : undefined}
        disabled={!installed}
      >
        <div className="model-card-text">
          <div className="model-card-row">
            <span className="model-card-name">{model.name}</span>
            {meta && <span className={`tier-badge tier-${meta.tier.toLowerCase()}`}>{meta.tier}</span>}
          </div>
          <div className="model-card-meta">
            <code>{model.id}</code>
            {meta && (
              <>
                <span className="model-card-dot" />
                <span>{meta.family}</span>
                <span className="model-card-dot" />
                <span>{formatSize(meta.sizeMB)}</span>
              </>
            )}
          </div>
        </div>
        {active && (
          <motion.div
            className="model-card-check"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          >
            <Check size={16} strokeWidth={3} />
          </motion.div>
        )}
      </button>

      <div className="model-card-actions">
        {installed ? (
          <button type="button" className="model-card-trash" onClick={onRemove} aria-label="Remove">
            <Trash2 size={14} />
          </button>
        ) : (
          !isDownloading && (
            <button type="button" className="model-card-dl" onClick={onDownload}>
              <Download size={13} strokeWidth={2.4} />
              <span>Download</span>
            </button>
          )
        )}
      </div>

      {download && download.status !== 'done' && (
        <div className="model-card-progress">
          <DownloadProgress state={{ modelId: model.id, ...download }} />
        </div>
      )}
    </motion.div>
  );
}

function sortByTier(models: Model[]): Model[] {
  return [...models].sort((a, b) => {
    const ta = MODEL_META[a.id]?.tier ?? 'Modern';
    const tb = MODEL_META[b.id]?.tier ?? 'Modern';
    return TIER_ORDER[ta] - TIER_ORDER[tb];
  });
}

function formatSize(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${mb} MB`;
}
