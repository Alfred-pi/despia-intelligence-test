# CLAUDE.md — Despia Intelligence Test App

## But
App test pour évaluer despia-intelligence (IA on-device via Despia Native Runtime). Pas une app de production — un lab pour tester les modèles, la perfo, et les cas d'usage.

## SDK: despia-intelligence
- **npm:** `despia-intelligence` (v1.0.3, MIT License)
- **Doc:** https://www.npmjs.com/package/despia-intelligence
- **Repo:** https://github.com/despia-native/despia-intelligence
- **Principe:** LLM inference directement sur device (iOS/Android), zéro cloud, zéro API key, offline

## API réelle (vérifiée 2026-04-25)

```typescript
import intelligence from 'despia-intelligence';

// Gate runtime
if (!intelligence.runtime.ok) { /* status: 'outdated' | 'unavailable' */ }

// Inference (callbacks, pas async iterator)
const handle = intelligence.run(
  { type: 'text', model: 'qwen3-0.6b', prompt, system?, stream: true },
  {
    stream:   (chunk) => { /* chunk = texte ACCUMULÉ complet, replace */ },
    complete: (text)  => { /* final */ },
    error:    (err)   => { /* { code, message } */ },
  }
);
handle.cancel();

// Models
await intelligence.models.available();   // catalog
await intelligence.models.installed();   // downloaded
intelligence.models.download(id, { onStart, onProgress, onEnd, onError });
await intelligence.models.remove(id);

// Global events (survivent aux relaunches)
intelligence.on('downloadProgress', (id, pct) => {});
intelligence.on('downloadEnd', (id) => {});
```

**Background/resume automatique** — ne PAS coder de visibilitychange custom.

## Modèles disponibles

| Modèle | Taille | Tier | Usage |
|--------|--------|------|-------|
| lfm2.5-350m | 350M | Any | Autocomplete, classif |
| qwen3-0.6b | 600M | Any | Chat baseline (défaut) |
| lfm2-700m | 700M | Any | Quick assistant |
| gemma-3-1b-it | 1B | Modern | General assistant |
| lfm2.5-1.2b-instruct | 1.2B | Modern | JSON/structured |
| lfm2.5-1.2b-thinking | 1.2B | Modern | Reasoning |
| qwen3-1.7b | 1.7B | Modern | Longer convos, code |
| youtu-llm-2b | 2B | Modern | CN/EN |
| lfm2-2.6b | 2.6B | Modern+ | Long-form |
| gemma-3n-e4b-it | 4B eff | Flagship | Premium assistant |
| lfm2-8b-a1b | 8B MoE | Flagship | Quasi-cloud quality |

Tous en int4 (rapide) et int8 (qualité).

## Persistance
- **IndexedDB via `idb`** pour historique conversations (pas de limite de clés)
- `despia-native writevalue://` backup pour settings critiques (1 seule clé `storedValues`)
- **Pas de SQL natif Despia** — vérifié, ça n'existe pas

## Features app
1. **OpenInDespiaPage** — écran bloquant si hors runtime Despia
2. **ModelPickerPage** — liste, download, select, remove
3. **ChatPage** — stream avec typing indicator, bubbles, markdown
4. **Conversations** — historique sidebar sheet, persiste IndexedDB

## Stack
- React 19 + Vite 6 + TypeScript 5.7
- Tailwind 4 + design tokens boilerplate (8pt grid)
- Framer Motion (spring 300/30)
- Zustand (state)
- react-markdown + remark-gfm
- idb (IndexedDB wrapper)
- HashRouter (compat gh-pages)

## Apple App Store — IA locale: AUTORISÉE, aucun problème

### Pourquoi Apple valide
- **Privacy narrative Apple** = data reste on-device. L'IA locale est exactement leur positioning (Apple Intelligence).
- Plusieurs apps IA locale déjà sur l'App Store et approuvées: Private LLM, On-Device AI, Haplo AI, Apollo AI, NoemaAI, Nomad AI.
- Apple encourage Core ML + Metal + Neural Engine pour l'inference locale.

### Apps de référence sur l'App Store
| App | Modèles | Prix |
|-----|---------|------|
| Private LLM | Llama 3.1/3.2, Qwen3, Gemma, DeepSeek, Mixtral | Payant |
| On-Device AI | Qwen3, DeepSeek R1, QwenLong + import GGUF custom | Freemium |
| Haplo AI | Small models, easy download | Gratuit |
| Apollo AI | Open-source, llama.cpp | Gratuit |
| NoemaAI | Gros modèles (FlashAttention) | Payant |

### Pattern approuvé par Apple (celui qu'on utilise)
```
App Store binaire (petit, <100MB)
  → Après install: écran "Download a model"
  → Téléchargement depuis Hugging Face
  → Stocké dans app container
  → Inference locale (despia-intelligence runtime)
```
Les modèles NE sont PAS dans le binaire. Téléchargés après install. Apple est OK avec ça.

### Guidelines Apple à respecter
- **5.1.2(i):** Si données envoyées au cloud → disclosure + consent. → **Nous: RIEN ne sort. On-device = exempt.**
- **2.5.2:** Pas d'app vibe-codée de mauvaise qualité. → **On code propre.**
- **Pas de bypass IAP:** Utiliser StoreKit/RevenueCat pour digital. Pas Stripe direct. → **RevenueCat = OK.**

### Limites techniques Apple
- Binaire: max 4GB total, 60MB par exécutable
- On-Demand Resources: max 8GB/asset pack (iOS 18+)
- Download cellulaire: recommandé <200MB pour binaire initial. Modèles se download en WiFi.
- Notre app = petit binaire + modèles téléchargés après = **zéro problème de taille.**

### Avantage marketing
"100% private. Your data never leaves your phone." = argument de vente massif sur l'App Store.

## Deploy
- Repo public **Alfred-pi/despia-intelligence-test**
- GitHub Actions → gh-pages
- URL: `https://alfred-pi.github.io/despia-intelligence-test/`
- À coller dans Despia Studio pour build native iOS

## Dev/Prod pattern
```typescript
import intelligence from 'despia-intelligence';
if (!intelligence.runtime.ok) return <OpenInDespiaPage />;
```

Pas de mock DEV — on bloque l'app hors Despia.
