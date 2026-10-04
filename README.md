# Lingua Reader

An AI-assisted article reader for language learners. You upload a document (PDF, DOCX, TXT, HTML, Markdown) and read it in its original form or simplified to a CEFR level (A1–C1). Tapping a word shows its translation (EN/UZ/RU), definition, synonyms, antonyms, examples and phrasal verbs. You can save words to a personal vocabulary list.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest + React Testing Library
npm run lint       # ESLint, including FSD layer boundaries
npm run typecheck  # strict TypeScript
npm run build
```

## How it runs (no backend)

By default the app is fully serverless:

- **Storage**: documents, the original uploaded files, vocabulary and cached AI results are stored in the browser's **IndexedDB** (`shared/lib/storage/idb.ts`). IndexedDB is used instead of localStorage because it holds hundreds of MB and stores binary files. The app asks the browser to make this storage persistent.
- **Text extraction** runs in the browser. PDF uses pdf.js and DOCX uses mammoth; both are lazy-loaded. File types are detected from their content (magic bytes), not just the extension.
- **AI**: the browser calls the AI provider directly, and responses are constrained to a JSON schema and validated with Zod (`shared/api/ai`).
  - **Google Gemini** is the default (official `@google/genai` SDK). **Anthropic Claude** (`@anthropic-ai/sdk`) can be selected instead.
  - Each provider is a small module in `shared/api/ai/providers` and is lazy-loaded, so only the SDK in use is downloaded.
  - On upload, the AI detects the title, language, CEFR level and phrasal verbs, and generates a B1 version. Other levels are generated on demand.
  - Word analysis and translations are cached in IndexedDB, so the same word is never paid for twice.
- **API key (bring your own key)**: each user chooses a provider in **Settings → AI** and pastes their own key: Gemini from aistudio.google.com, Claude from console.anthropic.com. The key is verified, stored only in that browser, and sent only to that provider's API.
  - Without a key, uploading and reading still work. AI features show a prompt to add one.
  - Models: Gemini Flash, Pro or Flash-Lite. These are Google's `-latest` aliases, which always point to the current model. Claude: Opus 5.5, Sonnet 5.5 or Haiku 4.5.

**Security note:** a key in browser storage can be read by any script running on the page. That's acceptable when people use their own key on a personal deployment; they should use a key with a spending limit. To offer AI to users _with your own key_, add a small backend proxy, set `VITE_API_URL`, and the HTTP adapter (`shared/api/http`) is used instead. The UI doesn't change.

### Deploying (Vercel)

No environment variables are required. Build: `npm run build`, output: `dist`. `vercel.json` sends every route to the app. Optional: `VITE_API_URL` to switch to your own backend later. Never add AI provider keys as `VITE_*` variables: they are shipped to the browser.

## Architecture (Feature-Sliced Design)

```
src/
├── app/        providers (Query, i18n, theme sync, toasts, error boundary), lazy router, layout, global CSS tokens
├── pages/      home · documents · reader · vocabulary · settings · not-found   (each lazy-loaded)
├── widgets/    navigation · article-reader · article-header · article-navigation ·
│               article-version-selector · learning-panel · document-upload · document-library · vocabulary-list
├── features/   upload-document · select-text · analyze-word · translate-text · generate-simplification ·
│               save-vocabulary · manage-document · customize-reader · change-theme · change-language
├── entities/   article · document · vocabulary · translation · user
└── shared/     api · config (env, routes, i18n, breakpoints) · lib (text, hooks, storage, speech) · ui
```

- **Dependency rule**: `shared → entities → features → widgets → pages → app`. ESLint enforces it (`eslint.config.js`): a lower layer can't import a higher one, and a slice can only be imported through its `index.ts`.
- **Types**: domain types are inferred from the Zod contracts in `shared/api/contracts` and re-exported by the entities. They are never redeclared.

## State management

| State                                                                 | Where                                                                                              |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Server data (articles, jobs, vocabulary, translations, AI results)    | TanStack Query; query-key factories live in each entity                                            |
| Theme, reader preferences, tablet panel open/closed                   | Zustand + `persist`                                                                                |
| Current text selection (shared by the article and the learning panel) | Zustand, in-memory                                                                                 |
| Active version, compare mode                                          | URL search params (`?v=simplified-b1&compare=1`), so they can be shared and work with back/forward |
| UI language                                                           | i18next (persisted by the language detector)                                                       |
| Form, filter and upload phase state                                   | Local React state                                                                                  |

Saving words, favorites and renames update the UI optimistically and roll back (with a toast) on error. Retries happen only for transient errors (network, 5xx, 429).

## Key design decisions

- **Adaptive reader, not a shrunken desktop** (`widgets/learning-panel`):
  - desktop: outline | article | sticky learning sidebar
  - tablet: article plus a collapsible learning column
  - mobile: single column, with a bottom sheet that opens when you tap a word; the version selector becomes a native select; comparison becomes an Original / Simplified toggle
- **Selection model** (`features/select-text`):
  - Event delegation means one listener handles the whole article.
  - Words use `click`, so mouse, tap and keyboard all work. Multi-word selections are detected through a debounced `selectionchange` listener, which also handles mobile long-press handles.
  - There is a single roving tab stop, and the arrow keys move between words.
  - Paragraphs are memoized, so a selection change re-renders only the affected paragraph.
- **Extensible versions**:
  - `buildVersionSlots` lists the original, every CEFR level (generated or not) and any extra mode the backend returns.
  - Each version type renders through a registry in `widgets/article-reader/ui/version-renderers.tsx`. Adding "Grammar focus" means adding a contract literal and one renderer.
- **Theme**:
  - Semantic OKLCH tokens are defined in `app/styles/index.css`; components use only token classes.
  - An inline script in `index.html` applies the theme before first paint, so there is no flash of the wrong theme.
  - Light, dark and system modes are supported.
- **i18n**:
  - Typed keys (`i18next.d.ts`), with plural forms, including Russian `_few/_many`.
  - A test checks that all locales have the same set of keys.
- **Performance**:
  - Routes and heavy parsers are lazy-loaded.
  - Off-screen paragraphs skip layout through `content-visibility: auto`.
  - The vocabulary list switches to window virtualization above 80 items.
  - Search is debounced.
- **Accessibility**:
  - Radix primitives give dialogs, menus and sheets focus trapping and Esc handling.
  - The app has a skip link, visible focus rings, `aria-live` on processing and translation updates, and `prefers-reduced-motion` support.
  - Saved and selected words are shown by shape (underline or highlight) as well as color.

## Extension points

- Auth: `entities/user` (currently a guest user) and `credentials: 'include'` in the HTTP client.
- Text-to-speech: `shared/lib/speech`.
- New routes: `app/router/routes.tsx` plus `widgets/navigation/model/nav-items.ts`.
- New file formats such as EPUB: `entities/document/model/file-rules.ts` plus a backend extractor.
- New reading modes: the version renderer registry.

Spaced repetition, flashcards and sync can build on the existing vocabulary entity and query keys.
