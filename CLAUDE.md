# CLAUDE.md — Despia Intelligence Test App

## But
Lab pour évaluer `despia-intelligence` (LLM on-device via Despia Native Runtime). Pas une app de prod — un terrain pour valider:
- Quels modèles sont viables sur quel iPhone
- Qualité des réponses pour kids-reading-stories / kids-finance
- Impact batterie / chaleur
- Pattern UX d'une app chat Swiss + Gift framework

## Live URL
- **gh-pages:** https://alfred-pi.github.io/despia-intelligence-test/
- **Repo public:** github.com/Alfred-pi/despia-intelligence-test
- À coller dans Despia Studio pour build native iOS

## État actuel (2026-04-29)

⚠️ **Le runtime Despia Intelligence est en BETA partielle.**

Le CEO Despia (NoCode ProCode, sur YouTube) a annoncé "Just merged Despia AI" le 27 avril, mais le binaire iOS qu'on a testé est dans un état **`flagged-only`**:
- ✅ `window.native_runtime === 'despia'` (le flag est posé)
- ❌ `window.intelligence` est vide (`{}`)
- ❌ Aucun registrar exposé: `onDownloadStart/Progress/End/Error`, `onRemove*` tous `undefined`
- ❌ `availableModels` jamais peuplé
- Résultat: SDK fire les commandes, le natif ne stream rien en retour. Download bloque, run() ne stream pas.

**Hypothèse forte (pattern Despia):** il manque probablement un toggle dans le Despia Dashboard (`App > Integrations` ou similaire) à activer en plus du rebuild — c'est le pattern utilisé pour HealthKit, OneSignal Critical Alerts, Background Location, etc. Le toggle "Local Intelligence" n'est peut-être pas encore exposé dans le dashboard pour la beta. **À vérifier dans le dashboard.**

**Réponse du CEO sur YouTube:** "Correct" (à la question ambiguë "rebuild from dashboard or activate something?"). À recontacter avec les diagnostics précis.

## Comportement de l'app face à ce bug

L'app détecte le cas `flagged-only` et **bascule automatiquement en mode mock** pour rester utilisable (preview UI) — pas de chat infini, pas de download stuck.

Source de vérité: `src/lib/intelligence.ts`
- `isLive()` retourne `realIntel.runtime.ok && checkRegistrarsExposed()`
- Si `flagged-only` → mock catalog + mock streaming + warning banner
- Si `ready` → vraie inference, vrai download, vrai catalog
- Si `unavailable` (browser pur) → même mock (preview UX)

3 readiness states surfacées dans l'UI:
- `ready` (dot vert) → tout marche
- `flagged-only` (dot orange) → "Despia AI runtime is partial — wait for the next build"
- `outdated` / `unavailable` (dot orange/gris) → "Update Despia" / "Preview UI"

## SDK: despia-intelligence

- **npm:** `despia-intelligence` v1.0.3, MIT
- **Doc officielle:** https://setup.despia.com/local-intelligence/Introduction
- **Reference:** https://setup.despia.com/local-intelligence/reference
- **Repo:** github.com/despia-native/despia-intelligence
- **Auteur:** Yacine Nedjar
- **Status:** publié 21 avril 2026 (4 commits le même jour, aucun depuis). 0 stars, 0 issues, 0 releases formelles.

### API (vérifiée par lecture du code source `node_modules/despia-intelligence/index.js`)

```typescript
import intelligence from 'despia-intelligence';

// Runtime: fixed at SDK import via window.native_runtime check
intelligence.runtime.ok       // boolean
intelligence.runtime.status   // 'ready' | 'outdated' | 'unavailable'
intelligence.runtime.message  // string | null

// Inference (callbacks, NOT async iterator)
const handle = intelligence.run(
  { type: 'text', model: 'qwen3-0.6b', prompt, system?, stream: true },
  {
    stream:   (chunk) => { /* chunk = FULL ACCUMULATED text — replace, never append */ },
    complete: (text)  => { /* final */ },
    error:    (err)   => { /* { code, message }, code 2 = missing id, code 3 = inference */ },
    interrupted: (intent) => { /* fired on focusout, resume is auto */ },
  }
);
handle.cancel();

// Models — IMPORTANT: available() reads window.intelligence.availableModels
// SYNCHRONOUSLY. Returns [] if native hasn't populated it yet.
// Our wrapper polls window.intelligence.availableModels every 50ms for 8s.
await intelligence.models.available();   // catalog
await intelligence.models.installed();   // downloaded (SDK polls 30s with timeout)
intelligence.models.download(id, { onStart, onProgress, onEnd, onError });
await intelligence.models.remove(id);
await intelligence.models.removeAll();

// Global events — survive force-quit, fire even after relaunch
intelligence.on('downloadStart', (id) => {});
intelligence.on('downloadProgress', (id, pct) => {});  // 0-100 integer
intelligence.on('downloadEnd', (id) => {});
intelligence.on('downloadError', (id, err) => {});
```

**Background/resume automatique** — ne JAMAIS coder de `visibilitychange` / `pagehide` custom. SDK fait tout via `window.focusout` / `window.focusin`.

## Modèles disponibles (text-only, beta)

| Modèle | Size | Tier | Usage |
|--------|------|------|-------|
| `lfm2.5-350m` | 350M | Any | Autocomplete, classif |
| `qwen3-0.6b` | 600M | Any | Chat baseline (defaut SDK) |
| `lfm2-700m` | 700M | Any | Quick assistant |
| `gemma-3-1b-it` | 1B | Modern | General assistant |
| `lfm2.5-1.2b-instruct` | 1.2B | Modern | JSON/structured |
| `lfm2.5-1.2b-thinking` | 1.2B | Modern | Reasoning |
| `qwen3-1.7b` | 1.7B | Modern | Longer convos, code |
| `youtu-llm-2b` | 2B | Modern | CN/EN |
| `lfm2-2.6b` | 2.6B | Modern+ | Long-form |
| `gemma-3n-e4b-it` | 4B eff | Flagship | Premium |
| `lfm2-8b-a1b` | 8B MoE | Flagship | Quasi-cloud |

Audio/vision/embed/transcription: `enabled: false` dans le SDK pour le moment (text only).
Tous en int4 (rapide) et int8 (qualité). Runtime pick automatiquement selon device.

## Stack

- React 19 + Vite 6 + TypeScript 5.7 (strict)
- Tailwind 4 (mais on n'utilise PAS de utility classes — design tokens CSS variables only)
- Framer Motion 11 (spring 300/30 partout)
- Zustand 5 (chat store)
- `react-markdown` + `remark-gfm` (markdown rendering dans bubbles AI)
- `idb` (IndexedDB wrapper) pour historique conversations
- `react-router-dom` v7 avec **HashRouter** (gh-pages compat)
- `lucide-react` pour les icônes
- `despia-native` v1.0.x pour les commandes natives (haptics, writevalue/readvalue)

## Architecture

```
src/
├── App.tsx                           # Router + runtime probe + DebugOverlay mount
├── main.tsx                          # HashRouter + ToastProvider
├── index.css                         # All styles (design tokens + chat surface)
├── design-tokens.css                 # Colors, spacing, safe areas, typography
│
├── lib/
│   ├── intelligence.ts               # Wrapper SDK + mock fallback + runtime probe
│   ├── device.ts                     # iPhone/Android tier detection (Any/Modern/Flagship)
│   ├── platform.ts                   # isDespia/isDev (legacy)
│   └── haptics.ts                    # Despia haptic via writevalue
│
├── store/
│   └── chat.ts                       # Zustand: conversations, messages, downloads, theme
│
├── hooks/
│   ├── useModels.ts                  # available/installed/download/remove
│   └── useChat.ts                    # send + stream state + cancel
│
├── pages/
│   ├── ChatPage.tsx                  # Header iOS + scroll + composer + suggested prompts
│   ├── ModelPickerPage.tsx           # Device card + Installed/Recommended/Heavy sections
│   └── OpenInDespiaPage.tsx          # (deprecated) écran bloquant — plus utilisé
│
├── components/
│   ├── chat/
│   │   ├── ChatBubble.tsx            # Markdown bubble + streaming cursor
│   │   ├── TypingIndicator.tsx       # 3 dots spring stagger
│   │   ├── MessageInput.tsx          # Composer pill + send/stop animé
│   │   ├── ConversationsSheet.tsx    # Sheet iOS + sections temporelles + swipe-to-delete
│   │   ├── DownloadProgress.tsx      # Bar + status
│   │   ├── DebugOverlay.tsx          # Floating badge + sheet (errors + intelligence logs)
│   │   └── RuntimeBanner.tsx         # Orange banner + diagnostics modal
│   └── ui/                           # Button, Card, Sheet, Toast, etc. (du boilerplate)
│
└── layouts/
    └── AppLayout.tsx                 # (depuis boilerplate, peu utilisé)
```

### Fichiers clés à comprendre en premier

1. **`src/lib/intelligence.ts`** — wrapper SDK + runtime detection + mock layer. Le cœur de l'app.
   - `isLive()` = `realIntel.runtime.ok && checkRegistrarsExposed()`
   - `runStream()` avec timeout 25s first token + 60s stale
   - `downloadModel()` avec watchdog 30s/60s
   - `pollAvailableModels()` poll direct sur `window.intelligence.availableModels` toutes les 50ms
   - `snapshotIntelligenceState()` pour debug (dump de window.intelligence)

2. **`src/App.tsx`** — au boot: hydrate store, probe runtime, push snapshot dans DebugOverlay, abonne aux events globaux download.

3. **`src/components/chat/RuntimeBanner.tsx`** — bandeau orange tappable + modal avec diagnostics complets.

4. **`src/components/chat/DebugOverlay.tsx`** — capture window.error + unhandledrejection + logs intelligence. Visible via badge bottom-right.

## Persistance

- **IndexedDB via `idb`** pour historique conversations (3 stores: `conversations`, `messages`, `settings`)
- `despia-native writevalue://` backup pour settings (1 seule clé `storedValues`)
- **Pas de SQL natif Despia** — vérifié, ça n'existe pas

## Splash screen

Splash HTML dans `index.html` (logo gradient 64x64, breathe animation) qui dure 4s pour matcher l'animation native Despia. Self-removes via `setTimeout`. Fond noir matching app dark theme.

## Setup local

```bash
git clone https://github.com/Alfred-pi/despia-intelligence-test.git
cd despia-intelligence-test
npm install
npm run dev    # http://localhost:4020
```

Port: `4020` (vite.config.ts).

## Deploy

- Workflow: `.github/workflows/deploy.yml`
- Trigger: push sur `master` (ou `main`)
- Steps: checkout → node 20 → `npm ci` → `npm run build` → upload-pages-artifact → deploy-pages
- URL: https://alfred-pi.github.io/despia-intelligence-test/
- Pages config: `gh api -X POST repos/Alfred-pi/despia-intelligence-test/pages -f build_type=workflow` (déjà fait)

`vite.config.ts` a `base: '/despia-intelligence-test/'` — ne pas toucher.

## Workflow Mac ↔ Pi

Une seule machine à la fois. Pull avant, push après.

```bash
git pull          # avant de bosser
# ... code ...
git add -A && git commit -m "..." && git push
```

GitHub Pages se redeploye automatiquement à chaque push.

## Skills design utilisés

- `appsprint-studio` (manifesto Jonny: Gift vs Receipt, anti-slop)
- `design-master` (tokens, patterns, foundations)
- `platform-apple` (HIG iOS — l'app vit en WKWebView iOS)
- `motion-animations` (Framer Motion patterns)
- `mobile-ux-web` (mobile-first, gestures)
- `despia` (specifics runtime)
- `despia-debug-overlay` (overlay flottant en prod native)

## Apple App Store — IA locale: AUTORISÉE

Apps de référence déjà sur le Store: Private LLM, On-Device AI, Haplo AI, Apollo AI, NoemaAI.

Pattern qu'on utilise (validé):
```
App Store binaire (<100MB)
  → Après install: écran "Download a model"
  → Téléchargement depuis Hugging Face
  → Stocké dans app container
  → Inference locale (despia-intelligence runtime)
```
Modèles NE sont PAS dans le binaire. Téléchargés après. **Apple OK.**

## Don'ts

- ❌ NO `window.alert` — breaks native bridge
- ❌ NO Tailwind utility classes — utilise les CSS classes de `index.css`
- ❌ NO generic spinners — utilise Skeleton
- ❌ NO hardcoded safe areas (44px / 34px) — utilise `var(--safe-top)` / `var(--safe-bottom)`
- ❌ NO `<a>` for internal nav — utilise `<NavLink>` ou `useNavigate()`
- ❌ NO custom `visibilitychange` / `pagehide` — SDK gère via `focusout/focusin`
- ❌ NO append dans `stream(chunk)` — c'est du texte ACCUMULÉ, replace toujours

## Pas encore résolu / à suivre

- [ ] Tester si le toggle "Local Intelligence" existe dans Despia Dashboard (`App > Integrations`)
- [ ] Re-message le CEO Despia avec diagnostics précis (registrars manquants)
- [ ] Quand le runtime devient `ready` côté natif, valider end-to-end:
  - [ ] Download d'un modèle (start avec `lfm2.5-350m`, 220MB)
  - [ ] Premier message → vrai stream
  - [ ] Background mid-stream → resume auto
  - [ ] Multi-conversation persiste
- [ ] Ajouter benchmark page (tokens/sec, time to first token, RAM) une fois live
- [ ] Ajouter compare page (même prompt sur 2 modèles côte à côte)

## Resources contextuelles

- Post YouTube CEO: https://www.youtube.com/post/UgkxQcVi_2HRBoqUNj3io_RXdHkih2K0GINx
  - "Just merged Despia AI - try it out now (at your own risk!)"
  - Pinned: "THIS IS STILL A BETA FEATURE 🚨"
  - "It's only text, but audio is WIP!"
- Support Despia: support@despia.com / npm@despia.com
- Plan original: `/home/jonny/.claude/plans/base-faut-faire-un-joyful-abelson.md` (sur Pi uniquement)
