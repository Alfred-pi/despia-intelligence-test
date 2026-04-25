import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Download, Trash2 } from 'lucide-react';
import { useModels } from '@/hooks/useModels';
import { useChatStore } from '@/store/chat';
import { DownloadProgress } from '@/components/chat/DownloadProgress';
import { haptic } from '@/lib/haptics';

export function ModelPickerPage() {
  const navigate = useNavigate();
  const { available, installed, loading, error, download, remove, refresh } = useModels();
  const activeModelId = useChatStore((s) => s.activeModelId);
  const setActiveModel = useChatStore((s) => s.setActiveModel);
  const downloads = useChatStore((s) => s.downloads);

  const installedIds = new Set(installed.map((m) => m.id));

  const handleSelect = async (id: string) => {
    if (!installedIds.has(id)) return;
    haptic('selection');
    await setActiveModel(id);
    navigate(-1);
  };

  return (
    <div className="model-picker">
      <div className="model-picker-head">
        <button
          type="button"
          className="model-picker-back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="model-picker-title">Models</h1>
      </div>

      {loading && <div className="model-picker-loading">Loading catalog…</div>}
      {error && (
        <div className="model-picker-error">
          <p>Could not load models: {error}</p>
          <button type="button" onClick={refresh}>Retry</button>
        </div>
      )}

      <div className="model-list">
        {available.map((model) => {
          const isInstalled = installedIds.has(model.id);
          const isActive = activeModelId === model.id;
          const dl = downloads[model.id];
          return (
            <motion.div
              key={model.id}
              className={`model-item ${isActive ? 'is-active' : ''}`}
              whileTap={isInstalled ? { scale: 0.98 } : undefined}
            >
              <button
                type="button"
                className="model-item-main"
                onClick={() => handleSelect(model.id)}
                disabled={!isInstalled}
              >
                <div className="model-item-text">
                  <div className="model-item-name">{model.name}</div>
                  <div className="model-item-id">{model.id}</div>
                </div>
                {isActive && (
                  <span className="model-item-check">
                    <Check size={16} />
                  </span>
                )}
              </button>
              <div className="model-item-actions">
                {!isInstalled && !dl && (
                  <button
                    type="button"
                    className="model-item-download"
                    onClick={() => {
                      haptic('light');
                      download(model.id);
                    }}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                )}
                {isInstalled && (
                  <button
                    type="button"
                    className="model-item-remove"
                    onClick={() => remove(model.id)}
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {dl && dl.status !== 'done' && <DownloadProgress state={dl} />}
            </motion.div>
          );
        })}
        {!loading && available.length === 0 && !error && (
          <div className="model-picker-empty">No models available yet.</div>
        )}
      </div>
    </div>
  );
}
