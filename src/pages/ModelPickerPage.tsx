import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Download, Trash2, RefreshCw, Smartphone, Sparkles } from 'lucide-react';
import { useModels } from '@/hooks/useModels';
import { useChatStore } from '@/store/chat';
import { DownloadProgress } from '@/components/chat/DownloadProgress';
import { MODEL_META, type Model } from '@/lib/intelligence';
import { detectDevice, isModelRecommendedFor, TIER_RANK } from '@/lib/device';
import { haptic } from '@/lib/haptics';

export function ModelPickerPage() {
  const navigate = useNavigate();
  const { available, installed, loading, error, catalogFallback, download, remove, refresh } = useModels();
  const activeModelId = useChatStore((s) => s.activeModelId);
  const setActiveModel = useChatStore((s) => s.setActiveModel);
  const downloads = useChatStore((s) => s.downloads);

  const device = useMemo(() => detectDevice(), []);
  const installedIds = new Set(installed.map((m) => m.id));

  // Group: installed first; then recommended for device tier; then heavier; then unknown.
  const installedSet = available.filter((m) => installedIds.has(m.id));
  const notInstalled = available.filter((m) => !installedIds.has(m.id));
  const recommended = sortByFit(
    notInstalled.filter((m) => {
      const meta = MODEL_META[m.id];
      return meta && isModelRecommendedFor(meta.tier, device.tier);
    }),
  );
  const heavier = sortByFit(
    notInstalled.filter((m) => {
      const meta = MODEL_META[m.id];
      return meta && !isModelRecommendedFor(meta.tier, device.tier);
    }),
  );
  const uncategorized = notInstalled.filter((m) => !MODEL_META[m.id]);

  const handleSelect = async (id: string) => {
    haptic('success');
    await setActiveModel(id);
    navigate(-1);
  };

  return (
    <>
      <header className="ios-header">
        <button type="button" className="ios-header-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={20} strokeWidth={2.4} />
        </button>
        <div className="ios-header-title-static">
          <span className="ios-header-eyebrow muted">{available.length} text models</span>
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
        <motion.div
          className="device-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          <div className="device-card-icon">
            <Smartphone size={18} strokeWidth={2.2} />
          </div>
          <div className="device-card-text">
            <div className="device-card-row">
              <span className="device-card-label">{device.model}</span>
              <span className={`tier-badge tier-${device.tier.toLowerCase()}`}>{device.tier}</span>
            </div>
            <div className="device-card-hint">{device.hint}</div>
          </div>
        </motion.div>

        {error && (
          <div className="error-card">
            <p>Could not load catalog</p>
            <span>{error}</span>
            <button type="button" onClick={refresh}>Retry</button>
          </div>
        )}

        {loading && available.length === 0 && (
          <div className="loading-card">
            <div className="loading-card-spinner" />
            <span>Loading model catalog…</span>
          </div>
        )}

        {catalogFallback && !loading && (
          <div className="info-card">
            <p>Showing the official text model list.</p>
            <span>
              The runtime did not push its catalog yet. These IDs are from the
              SDK README — try Download to see if the native runtime accepts them.
            </span>
          </div>
        )}

        <AnimatePresence>
          {installedSet.length > 0 && (
            <motion.section
              key="installed"
              className="model-section"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="model-section-title">Installed</h2>
              <div className="model-section-list">
                {installedSet.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    deviceTier={device.tier}
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

        {recommended.length > 0 && (
          <section className="model-section">
            <h2 className="model-section-title">
              <Sparkles size={11} strokeWidth={2.5} className="model-section-icon" />
              Recommended for your {device.os === 'ios' ? 'iPhone' : device.os === 'android' ? 'Android' : 'device'}
            </h2>
            <div className="model-section-list">
              {recommended.map((model) => {
                const dl = downloads[model.id];
                return (
                  <ModelCard
                    key={model.id}
                    model={model}
                    deviceTier={device.tier}
                    download={dl}
                    onDownload={() => {
                      haptic('medium');
                      download(model.id);
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}

        {heavier.length > 0 && (
          <section className="model-section">
            <h2 className="model-section-title">May be slow on your device</h2>
            <div className="model-section-list">
              {heavier.map((model) => {
                const dl = downloads[model.id];
                return (
                  <ModelCard
                    key={model.id}
                    model={model}
                    deviceTier={device.tier}
                    heavy
                    download={dl}
                    onDownload={() => {
                      haptic('medium');
                      download(model.id);
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}

        {uncategorized.length > 0 && (
          <section className="model-section">
            <h2 className="model-section-title">Other</h2>
            <div className="model-section-list">
              {uncategorized.map((model) => {
                const dl = downloads[model.id];
                return (
                  <ModelCard
                    key={model.id}
                    model={model}
                    deviceTier={device.tier}
                    download={dl}
                    onDownload={() => {
                      haptic('medium');
                      download(model.id);
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}

        {!loading && available.length === 0 && !error && (
          <div className="empty-soft">No models in the catalog.</div>
        )}

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
  deviceTier: 'Any' | 'Modern' | 'Flagship';
  installed?: boolean;
  active?: boolean;
  heavy?: boolean;
  download?: { progress: number; status: 'starting' | 'downloading' | 'done' | 'error'; error?: string };
  onSelect?: () => void;
  onRemove?: () => void;
  onDownload?: () => void;
}

function ModelCard({
  model,
  deviceTier,
  installed,
  active,
  heavy,
  download,
  onSelect,
  onRemove,
  onDownload,
}: CardProps) {
  const meta = MODEL_META[model.id];
  const isDownloading = download && download.status !== 'done' && download.status !== 'error';

  return (
    <motion.div
      className={`model-card ${active ? 'is-active' : ''} ${heavy ? 'is-heavy' : ''}`}
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
            {meta && (
              <span className={`tier-badge tier-${meta.tier.toLowerCase()}`}>
                {meta.tier}
              </span>
            )}
            {meta && TIER_RANK[meta.tier] > TIER_RANK[deviceTier] && (
              <span className="tier-warn">heavy</span>
            )}
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

function sortByFit(models: Model[]): Model[] {
  return [...models].sort((a, b) => {
    const ma = MODEL_META[a.id];
    const mb = MODEL_META[b.id];
    if (!ma || !mb) return 0;
    if (ma.tier !== mb.tier) return TIER_RANK[ma.tier] - TIER_RANK[mb.tier];
    return ma.sizeMB - mb.sizeMB;
  });
}

function formatSize(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${mb} MB`;
}
