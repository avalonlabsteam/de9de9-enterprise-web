# ADMIN ARCHITECTURE REPLICATION GUIDE

Source of truth: `/Users/haithamattab/Documents/Frontend Projects/react/react-projects/de9de9-enterprise`

This is a Vite + React 19 + TypeScript SPA. Stack: TailwindCSS **v4** (via `@tailwindcss/vite`, **no `tailwind.config.js`**), shadcn/ui `radix-nova` style on the unified `radix-ui` package, TanStack Query for server state, Zustand for client state, Zod v4 for schemas, react-hook-form for forms, an in-memory **mock Axios adapter** as the backend, a feature-sliced folder layout, and a bilingual FR/AR (with RTL) i18n dictionary.

---

## 1. Dependencies (exact — copy into the new `package.json`)

`package.json` top matter:
```json
{
  "name": "de9de9-enterprise",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

**dependencies**
```
@fontsource-variable/geist   ^5.2.9
@hookform/resolvers          ^5.4.0
@tanstack/react-query        ^5.101.2
axios                        ^1.18.1
class-variance-authority     ^0.7.1
clsx                         ^2.1.1
lucide-react                 ^1.23.0
next-themes                  ^0.4.6
radix-ui                     ^1.6.1
react                        ^19.2.7
react-dom                    ^19.2.7
react-hook-form              ^7.81.0
react-router-dom             ^7.18.1
shadcn                       ^4.13.0
sonner                       ^2.0.7
tailwind-merge               ^3.6.0
tw-animate-css               ^1.4.0
zod                          ^4.4.3
zustand                      ^5.0.14
```

**devDependencies**
```
@eslint/js                   ^10.0.1
@tailwindcss/vite            ^4.3.2
@types/node                  ^24.13.2
@types/react                 ^19.2.17
@types/react-dom             ^19.2.3
@vitejs/plugin-react         ^6.0.3
eslint                       ^10.6.0
eslint-plugin-react-hooks    ^7.1.1
eslint-plugin-react-refresh  ^0.5.3
globals                      ^17.7.0
tailwindcss                  ^4.3.2
typescript                   ~6.0.2
typescript-eslint            ^8.62.0
vite                         ^8.1.1
```

Notes: `radix-ui` is the **single unified package** (components import `import { Dialog as DialogPrimitive } from "radix-ui"`, not `@radix-ui/react-*`). `shadcn` is a runtime dep here because `src/index.css` does `@import "shadcn/tailwind.css"`. `next-themes` is only consumed by `ui/sonner.tsx`. `@fontsource-variable/geist` is installed but the app actually loads Poppins + Noto Sans Arabic via a Google Fonts `<link>` in `index.html`.

---

## 2. Config files (reproduce verbatim)

### `vite.config.ts`
```ts
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### `tsconfig.json` (solution / references root)
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### `tsconfig.app.json`
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,
    "strict": true,
    "paths": { "@/*": ["./src/*"] },
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### `tsconfig.node.json`
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,
    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

### `components.json` (shadcn — note `"style": "radix-nova"`, `config: ""` because no tailwind config file, and `"rtl": true`)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": true,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

### `index.html` (lang=fr; loads Poppins + Noto Sans Arabic)
```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>De9De9 Admin</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### `eslint.config.js` (flat config; UI files opt out of `only-export-components`)
```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
```

### `src/main.tsx` (entry — Query + Router providers, imports `./index.css`)
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
```

### `src/lib/utils.ts` (the `cn` helper)
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### `src/lib/queryClient.ts`
```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

You also need a `public/favicon.svg` (referenced by `index.html`).

---

## 3. Design-token system (`src/index.css`)

There is **no `tailwind.config.js`**. Everything is CSS-first Tailwind v4: `@theme` blocks declare the token→utility mapping, `:root` / `.dark` hold the actual values. Dark mode is a **class** (`.dark` on `<html>`) driven by a custom variant, not media-query-only.

### How it is wired
- `@import "tailwindcss";` + `@import "tw-animate-css";` + `@import "shadcn/tailwind.css";`
- `@custom-variant dark (&:is(.dark *));` — makes `dark:` utilities respond to the `.dark` ancestor class (AppLayout toggles `document.documentElement.classList.toggle("dark", …)`).
- `@theme inline { --color-<name>: var(--<name>) }` registers each variable as a Tailwind color, so `--color-primary` → `bg-primary`/`text-primary`, and the De9 block registers `--color-de9-teal` → `bg-de9-teal text-de9-teal border-de9-teal`, etc.
- `:root`/`.dark` redefine the raw `--*` values, so the same utility flips per theme automatically.

### shadcn base tokens (light `:root` → dark `.dark`)
| token | light | dark |
|---|---|---|
| `--background` | `#E7EBEE` | `#151923` |
| `--foreground` | `#232838` | `#E8EBF2` |
| `--card` / `--card-foreground` | `#ffffff` / `#232838` | `#1E2330` / `#E8EBF2` |
| `--popover` / `--popover-foreground` | `#ffffff` / `#232838` | `#1E2330` / `#E8EBF2` |
| `--primary` / `--primary-foreground` | `#178A82` / `#ffffff` | `#2AB3A8` / `#08211E` |
| `--secondary` / `--secondary-foreground` | `#F1F4F6` / `#232838` | `#262C3B` / `#E8EBF2` |
| `--muted` / `--muted-foreground` | `#F1F4F6` / `#8A94A0` | `#262C3B` / `#98A1B0` |
| `--accent` / `--accent-foreground` | `#F7FBFB` / `#178A82` | `#22303A` / `#65CBC4` |
| `--destructive` | `#E7464E` | `#F2646B` |
| `--border` / `--input` | `#E4E9ED` | `#2C3345` |
| `--ring` | `#65CBC4` | `#2AB3A8` |
| `--chart-1..5` | `#65CBC4,#178A82,#232838,#E7464E,#8A94A0` | `#65CBC4,#2AB3A8,#E8EBF2,#F2646B,#98A1B0` |
| `--radius` | `0.8125rem` | (inherited) |
| `--sidebar*` (8 vars) | white / `#178A82` / `#EFFAF8` / `#E4E9ED` / `#65CBC4` … | `#1E2330` / `#2AB3A8` / `#14322E` / `#2C3345` … |

Radius scale from `@theme inline`: `--radius-sm|md|lg|xl|2xl|3xl|4xl` = `radius × 0.6 / 0.8 / 1 / 1.4 / 1.8 / 2.2 / 2.6`.

Fonts (`@theme inline`): `--font-sans: 'Poppins', ui-sans-serif, system-ui, sans-serif`; `--font-heading: var(--font-sans)`; `--font-arabic: 'Noto Sans Arabic', 'Poppins', sans-serif`. RTL swaps to Arabic via `[dir="rtl"] body { font-family: var(--font-arabic) }`.

### De9 brand tokens (the `de9-*` utility family)
Registered in a second `@theme inline` block, so each yields `bg-de9-*`, `text-de9-*`, `border-de9-*`:
| utility name | var | light | dark |
|---|---|---|---|
| `de9-red` | `--de9-red` | `#E7464E` | `#F2646B` |
| `de9-teal` | `--de9-teal` | `#65CBC4` | `#65CBC4` |
| `de9-teal-dark` | `--de9-teal-dark` | `#178A82` | `#2AB3A8` |
| `de9-ink` | `--de9-ink` | `#232838` | `#E8EBF2` |
| `de9-slate` | `--de9-slate` | `#5A6472` | `#A6AEBD` |
| `de9-gray` | `--de9-gray` | `#8A94A0` | `#7D8694` |
| `de9-line` | `--de9-line` | `#E4E9ED` | `#2C3345` |
| `de9-bg` | `--de9-bg` | `#E7EBEE` | `#151923` |
| `de9-row` | `--de9-row` | `#F7FBFB` | `#222836` |
| `--de9-scrollbar` (not a utility, used raw) | — | `#C7CFD7` | `#3A4356` |

`:root` also sets `color-scheme: light`, `.dark` sets `color-scheme: dark`.

### Animations (`@theme { … @keyframes }`)
`--animate-fade-in` (fadeIn .3s), `--animate-slide-up` (slideUp .3s), `--animate-sheet-up` (sheetUp .25s), `--animate-pulse-ring` (pulseRing 1.8s infinite) → utilities `animate-fade-in`, `animate-slide-up`, `animate-sheet-up`, `animate-pulse-ring`. Keyframes: `fadeIn` (opacity), `slideUp` (translateY 14px→0), `sheetUp` (translateY 20px + scale .97→1), `pulseRing` (expanding red box-shadow ring).

### Base layer
```css
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  html { @apply font-sans; }
  [dir="rtl"] body, [dir="rtl"] { font-family: var(--font-arabic); }
  ::-webkit-scrollbar { width: 9px; height: 9px; }
  ::-webkit-scrollbar-thumb { background: var(--de9-scrollbar); border-radius: 9px; }
}
```

**Full `src/index.css` (209 lines) — reproduce exactly:** the file begins with the three `@import`s, then `@custom-variant dark (&:is(.dark *));`, then the `@theme inline` mapping block (fonts + all `--color-*: var(--*)` + `--radius-*`), then `:root` and `.dark` value blocks, then the De9 `@theme inline` + `:root`/`.dark` De9 value blocks, then the `@theme` animations block, then `@layer base`. Header/values/animations/base as tabulated above — all colors and the ordering above are the literal contents.

---

## 4. API layer contract

### `src/api/apiClient.ts`
A single Axios instance. When `VITE_API_MOCK !== 'false'` (default → mocked), it installs the custom mock adapter; otherwise it hits the real network at `VITE_API_URL ?? '/api'`. A request interceptor pulls the token from the Zustand auth store **at request time**; a response interceptor logs out on 401.
```ts
import axios from 'axios';
import { authActions, useAuthStore } from '@/stores/authStore';
import { mockAdapter } from '@/api/mock';

const useMock = import.meta.env.VITE_API_MOCK !== 'false';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
  ...(useMock ? { adapter: mockAdapter } : {}),
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) authActions.logout();
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);
```

### `src/api/mock/router.ts` — the mock adapter + route registry
Exports `register(method, pattern, handler)` and `mockAdapter` (an `AxiosAdapter`). Contract types:
```ts
export type MockMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface MockRequest {
  method: MockMethod;
  path: string;                              // '/api' prefix stripped
  query: Record<string, string>;             // querystring + axios params merged
  pathParams: Record<string, string>;        // ':id' segments, decodeURIComponent'd
  body: unknown;                             // JSON.parsed if it was a string
}
export interface MockResponse { status?: number; data: unknown; }  // status defaults 200
export type MockHandler = (req: MockRequest) => MockResponse | Promise<MockResponse>;
```
Mechanics:
- Module-level `routes: MockRoute[]`. `register` splits the pattern on `/`, dropping empties, storing `segments`.
- `matchRoute(method, path)` matches by same method + same segment count; `:x` segments capture into `pathParams`, literal segments must equal. First match wins.
- `mockAdapter`: `await sleep(LATENCY_MS=120)`; derive method/path (strips a leading `/api`), build `query` from `URL.searchParams` + `config.params`, JSON-parse a string body. No match → throws `AxiosError` with a 404 response. On match it calls the handler; a returned `status >= 400` is thrown as an `AxiosError` carrying `result.data`; thrown non-Axios errors become a synthetic 500. `buildResponse(config, status, data)` assembles the `AxiosResponse`.

### `src/api/mock/index.ts` — the barrel that boots the backend
```ts
import './handlers';                         // side-effect: registers every route
export { mockAdapter } from './router';
export type { MockRequest, MockResponse, MockHandler, MockMethod } from './router';
```
Importing this (done transitively by `apiClient`) runs `handlers.ts`, whose top-level `register(...)` calls populate the route table before the first request.

### `src/api/mock/handlers.ts` — route table
One flat file of top-level `register('METHOD', '/path', (req) => …)` calls, grouped by feature with `// ===== feature =====` banners. Response helpers: `ok(data)` → `{ data }`; `notFound(msg)` → `{ status: 404, data:{message} }`; `badRequest(zodError)` → `{ status: 400, data:{message: issues joined by ' · '} }`. Each mutation handler `safeParse`s the body with that feature's Zod input schema and returns `badRequest(parsed.error)` on failure, then mutates `db` and returns `ok(...)`. Representative routes: `GET /commandes`, `GET /commandes/:id`, `POST /commandes/:id/actions`, `POST /commandes/:id/devis`, `POST /commandes/:id/notes`, `POST /commandes/:id/notes/:index/handled`, `GET/POST /prestataires`, `GET/POST /reviews`, `GET /credits`, `POST /recharges`, `GET /factures`, `GET /sub/demandes|pros`, `POST /sub/salaries`, `GET /handicap`, `GET /analytics`, `GET/POST /kyc/:key(/docs)`, `DELETE /kyc/:key/docs/:docId`, `GET /health`.

### `src/api/mock/db.ts` — in-memory singleton + helpers
Seed functions (`seedCommandes`, `seedPrestataires`, `seedReviews`, `seedCredits`, …) build arrays; `export const db = { commandes, prestataires, reviews, credits, factures, subDemandes, subPros, handicap, kyc, workers }` is the mutable store handlers write to. Also exports pure/stateful helpers: `toISO`, `fromISO`, `nowStamp`, `facturesFromCommandes(cmds)`, `subAudit`, `cmdById(id)`, `addAudit(cmd,txt,role)` (prepends), `currentOcc(cmd)` (priority-ordered next occurrence), `kycOf(key)`, `logKyc(key,action)`, `analyticsSeed`. Types are **imported from the feature schemas** (`@/features/*/schemas/*`) — the DB depends on features, not vice-versa.

### How a feature registers routes
A feature never touches `router.ts`. It (a) defines Zod schemas under `features/<x>/schemas`, (b) `handlers.ts` imports those schemas and calls `register(...)`, (c) the feature's api hooks call `apiClient.get/post('/x')`. Adding a feature = add schema + add `register` block in `handlers.ts` (+ optional `db` seed).

---

## 5. Store patterns (Zustand)

Uniform recipe: `create<State>()(persist(() => initialState, { name: 'de9de9-<x>' }))` with state and **actions decoupled** — actions live in a separate exported `xActions` object that calls `useStore.setState(...)`, so non-React code (interceptors, mock handlers) can mutate state. Persisted stores use localStorage key `de9de9-*`.

### `authStore.ts` — persist key `de9de9-auth`
```ts
export interface AuthUser { id: string; name: string; role: 'admin'; }
interface AuthState { token: string | null; user: AuthUser | null; }
const initialState: AuthState = { token: 'mock-admin-token', user: { id: 'admin-1', name: 'De9De9 Admin', role: 'admin' } };
export const useAuthStore = create<AuthState>()(persist(() => initialState, { name: 'de9de9-auth' }));
export const authActions = {
  login: (token: string, user: AuthUser) => { useAuthStore.setState({ token, user }); },
  logout: () => { useAuthStore.setState({ token: null, user: null }); },
};
```

### `langStore.ts` — persist key `de9de9-lang`
```ts
export type Lang = 'fr' | 'ar';  export type Dir = 'ltr' | 'rtl';
interface LangState { lang: Lang; }
export const useLangStore = create<LangState>()(persist(() => ({ lang: 'fr' as Lang }), { name: 'de9de9-lang' }));
export const langActions = {
  set: (lang: Lang) => useLangStore.setState({ lang }),
  toggle: () => useLangStore.setState((s) => ({ lang: s.lang === 'fr' ? 'ar' : 'fr' })),
};
export const dirOf = (lang: Lang): Dir => (lang === 'ar' ? 'rtl' : 'ltr');
```

### `themeStore.ts` — persist key `de9de9-theme`
```ts
export type ThemeMode = 'light' | 'dark' | 'system';
interface ThemeState { mode: ThemeMode; }
export const useThemeStore = create<ThemeState>()(persist(() => ({ mode: 'system' as ThemeMode }), { name: 'de9de9-theme' }));
export const themeActions = {
  set: (mode: ThemeMode) => useThemeStore.setState({ mode }),
  cycle: () => useThemeStore.setState((s) => ({ mode: s.mode === 'light' ? 'dark' : s.mode === 'dark' ? 'system' : 'light' })), // light→dark→system→light
};
export function resolveTheme(mode: ThemeMode, systemDark: boolean): 'light' | 'dark' {
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
}
```

### `uiStore.ts` — **not persisted** (ephemeral)
```ts
export type RoleView = 'de9' | 'client' | 'prestataire';
interface UiState { roleView: RoleView; }
export const useUiStore = create<UiState>()(() => ({ roleView: 'de9' as RoleView }));
export const uiActions = { setRoleView: (roleView: RoleView) => useUiStore.setState({ roleView }) };
```

Feature-local stores follow the same shape (e.g. `features/prestataires/stores/selectionStore.ts`, `features/prestataires/components/profile/contractsStore.ts`). Theme/dir application is done in `AppLayout` via `useEffect` (`document.documentElement.dir/lang` and `classList.toggle('dark', …)` with a `matchMedia` listener for system mode).

---

## 6. i18n dictionary pattern

Three files under `src/lib/i18n/`.

### `dict.ts` — the bilingual dictionary
- `export const fr = { key: 'French text', … } as-object` — **`fr` is the source of truth for the key set.**
- `export type TKey = keyof typeof fr;` — every translation key is derived from `fr`.
- `export const ar: Record<TKey, string> = { … };` — typed so `ar` must supply **exactly** the same keys (missing/extra keys are compile errors).
- `export const dict = { fr, ar } as const;`
- Interpolation convention: values containing `{n}` / `{m}` are templates; callers do `t('someKey').replace('{n}', value)`. (~312 keys per language; layout keys at the top marked "core — do not change".)

### `index.ts` — the runtime translators
```ts
import { useLangStore } from '@/stores/langStore';
import { dict, type TKey } from './dict';
export type { TKey };

export function useT(): (key: TKey) => string {         // reactive — re-renders on lang change
  const lang = useLangStore((s) => s.lang);
  return (key) => dict[lang][key];
}
export function t(key: TKey): string {                  // non-reactive — for handlers/toasts
  return dict[useLangStore.getState().lang][key];
}
export function useL(): (frText: string, arText: string) => string {  // inline one-offs, no dict key
  const lang = useLangStore((s) => s.lang);
  return (frText, arText) => (lang === 'ar' ? arText : frText);
}
```

Usage: `const t = useT();  <div>{t('navCredits')}</div>`. **Adding a key:** add `myKey: 'Texte FR'` to `fr`, then add `myKey: 'نص'` to `ar` (TypeScript forces this). `TKey` updates automatically, so `t('myKey')` type-checks everywhere. For a genuinely one-off string not worth a key, use `const l = useL(); l('Français','عربي')`.

---

## 7. Per-feature slice recipe — worked example: `features/credits`

Folder shape (mirror for every feature):
```
features/<name>/
  schemas/<name>.ts        # Zod schemas + inferred types (single source of truth)
  api/<name>.ts            # react-query hooks that zod-parse responses
  routes.tsx               # RouteObject[] with lazy() code-split page
  components/<Page>.tsx     # default-less named export page component
  components/<Modal>.tsx    # dialogs, etc.
```

### 7a. `schemas/credit.ts` — Zod is the source of truth; types are `z.infer`
```ts
import { z } from 'zod';

export const creditTypeSchema = z.enum(['rech', 'deb', 'vers']);
export type CreditType = z.infer<typeof creditTypeSchema>;

export const pieceFileSchema = z.object({ name: z.string() });
export type PieceFile = z.infer<typeof pieceFileSchema>;

export const creditEntrySchema = z.object({
  date: z.string(), type: creditTypeSchema, client: z.string(), benef: z.string(),
  ref: z.string(), credits: z.number(), solde: z.string(), email: z.string(),
  phone: z.string(), cmdRef: z.string(),
  justif: pieceFileSchema.nullable().optional(),
  facture: pieceFileSchema.nullable().optional(),
});
export type CreditEntry = z.infer<typeof creditEntrySchema>;

export const rechargeMethodeSchema = z.enum(['Virement', 'Versement', 'Chèque', 'Carte']);
export type RechargeMethode = z.infer<typeof rechargeMethodeSchema>;

export const rechargeInputSchema = z.object({     // body of POST /recharges
  client: z.string(), montant: z.number(), methode: rechargeMethodeSchema,
  reference: z.string().optional(),
  justif: pieceFileSchema.nullable().optional(),
  facture: pieceFileSchema.nullable().optional(),
  visibleClient: z.boolean().optional(),
});
export type RechargeInput = z.infer<typeof rechargeInputSchema>;
```

### 7b. `api/credits.ts` — hooks own the query key, call `apiClient`, and **zod-parse the response**
```ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/apiClient';
import { queryClient } from '@/lib/queryClient';
import { creditEntrySchema, type CreditEntry, type RechargeInput } from '../schemas/credit';

export const creditsQueryKey = ['credits'] as const;

export function useCredits() {
  return useQuery({
    queryKey: creditsQueryKey,
    queryFn: async (): Promise<CreditEntry[]> => {
      const res = await apiClient.get('/credits');
      return creditEntrySchema.array().parse(res.data);       // runtime validation at the boundary
    },
  });
}

const createRechargeResponseSchema = z.object({ credit: creditEntrySchema });

export function useCreateRecharge() {
  return useMutation({
    mutationFn: async (input: RechargeInput): Promise<CreditEntry> => {
      const res = await apiClient.post('/recharges', input);
      return createRechargeResponseSchema.parse(res.data).credit;
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: creditsQueryKey }); },
  });
}
```

### 7c. Mock handler (in `api/mock/handlers.ts`)
```ts
register('GET', '/credits', () => ok(db.credits));

register('POST', '/recharges', (req) => {
  const parsed = rechargeInputSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(parsed.error);
  const input = parsed.data;
  const credit: CreditEntry = { date: new Date().toLocaleDateString('fr-FR'), type: 'rech',
    client: input.client || 'Client', benef: '—', ref: 'REC-' + Math.floor(8850 + Math.random()*140),
    credits: input.montant || 0, solde: '—', email: '', phone: '', cmdRef: '',
    justif: input.justif ?? null, facture: input.facture ?? null };
  db.credits = [credit, ...db.credits];       // prepend
  return ok({ credit });
});
```

### 7d. `routes.tsx` — lazy, code-split page (named export, not default)
```tsx
import type { RouteObject } from 'react-router-dom';

export const creditsRoutes: RouteObject[] = [
  {
    path: 'credits',
    lazy: async () => ({ Component: (await import('./components/CreditsPage')).CreditsPage }),
  },
];
```
Wire it into the root router (`src/routes/index.tsx`):
```tsx
export const router = createBrowserRouter([
  { path: '/', element: <AppLayout />, children: [
      { index: true, element: <Navigate to="/commandes" replace /> },
      ...commandesRoutes, ...prestatairesRoutes, ...soustraitanceRoutes,
      ...handicapRoutes, ...facturesRoutes, ...creditsRoutes, ...analyticsRoutes,
      { path: '*', element: <Navigate to="/commandes" replace /> },
  ]},
]);
```

### 7e. Component (`components/CreditsPage.tsx`)
Named `export function CreditsPage()`. Consumes `useCredits()` and handles `isPending` (skeleton with `animate-pulse`) / `isError` (`useL()` inline error) / success. Uses `useT`, `useL`, `useLangStore`, `useNavigate`, `useSearchParams`. Local UI state via `useState` (`filter`, `search`, `modal`, `piece`, `docsOverride`). Cross-page overlays are driven by **URL search params** (`?client=` / `?pres=` set via `setSearchParams`) that host components in `AppLayout` render. All styling via `cn(...)` + `de9-*`/token utilities. Static config declared as module consts (`TYPE_BADGE`, `TOTALS`, `FILTERS`, `GRID_COLS`) with `labelKey: TKey`.

### 7f. Modal (`components/RechargeModal.tsx`) — the form pattern
react-hook-form + `zodResolver(rechargeInputSchema)`, `Controller` for non-native fields (methode chips, file `PieceSlot`s, checkbox), `useCreateRecharge()` mutation, `toast.success(t(...))` on success, wrapped in `Dialog/DialogContent/DialogTitle/DialogDescription` from `@/components/ui/dialog`. Discriminated-union prop `state: { mode:'create' } | { mode:'docs'; … }` selects the sub-form.

**The canonical data flow to copy:** `zod schema` → `react-query hook that parses with that schema` → `mock register() handler that safeParses the same input schema` → `component consuming the hook` → `lazy routes.tsx` → spread into root router. Types always flow from `z.infer`; `apiClient` is the only thing that talks HTTP.

---

## 8. UI component inventory (`src/components/ui/*`)

Stock shadcn/ui **`radix-nova`** style. Common conventions: import primitives from the unified `radix-ui` package (`import { Dialog as DialogPrimitive } from "radix-ui"`), each part is a `function` using `React.ComponentProps<typeof Primitive.Part>` (or `<"div">` for plain elements), spreads `{...props}`, merges classes with `cn(className, …)`, and tags the root with `data-slot="…"`. Icons come from `lucide-react`. Import everything from `@/components/ui/<file>`.

| File / import path | Exported names | Prop surface |
|---|---|---|
| `@/components/ui/badge` | `Badge`, `badgeVariants` | `React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }`. Variants: `variant` = default \| secondary \| destructive \| outline \| ghost \| link (default `default`). |
| `@/components/ui/button` | `Button`, `buttonVariants` | `React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }`. `variant` = default \| outline \| secondary \| ghost \| destructive \| link; `size` = default \| xs \| sm \| lg \| icon \| icon-xs \| icon-sm \| icon-lg (defaults `default`/`default`). |
| `@/components/ui/card` | `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardAction`, `CardDescription`, `CardContent` | each `React.ComponentProps<"div">`. |
| `@/components/ui/checkbox` | `Checkbox` | `React.ComponentProps<typeof CheckboxPrimitive.Root>` (Radix Checkbox; `CheckIcon` indicator). |
| `@/components/ui/dialog` | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger` | Radix Dialog parts; `DialogContent` adds `showCloseButton?: boolean` (uses `XIcon` + `Button`). |
| `@/components/ui/dropdown-menu` | `DropdownMenu`, `DropdownMenuPortal`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent` | Radix DropdownMenu parts; `Item`/`SubTrigger` take `inset?: boolean` + `variant`, `CheckIcon`/`ChevronRightIcon`. |
| `@/components/ui/field` | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent`, `FieldTitle` | `Field` = `React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>`; `orientation` = vertical \| horizontal \| responsive (default vertical). |
| `@/components/ui/input` | `Input` | `React.ComponentProps<"input">` (h-8, token-styled). |
| `@/components/ui/label` | `Label` | `React.ComponentProps<typeof LabelPrimitive.Root>` (Radix Label). |
| `@/components/ui/select` | `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator`, `SelectTrigger`, `SelectValue` | Radix Select parts; `SelectTrigger` takes `size?: "sm" \| "default"`; `Chevron*Icon`/`CheckIcon`. |
| `@/components/ui/separator` | `Separator` | `React.ComponentProps<typeof SeparatorPrimitive.Root>` (`orientation`, `decorative`). |
| `@/components/ui/sheet` | `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription` | Radix Dialog-based; `SheetContent` adds `side?: "top" \| "right" \| "bottom" \| "left"` (default right). |
| `@/components/ui/sonner` | `Toaster` | `ToasterProps` from `sonner`; reads theme via `next-themes` `useTheme()`, maps success/info/warning/error/loading to lucide icons, wires `--normal-bg/text/border` + `--border-radius` to tokens. |
| `@/components/ui/switch` | `Switch` | `React.ComponentProps<typeof SwitchPrimitive.Root>` (Radix Switch). |
| `@/components/ui/table` | `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption` | plain-element `React.ComponentProps<...>` wrappers with `data-slot`. |
| `@/components/ui/tabs` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `tabsListVariants` | Radix Tabs; `TabsList` = `React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>`, `variant` = default \| line (default default). |
| `@/components/ui/textarea` | `Textarea` | `React.ComponentProps<"textarea">`. |
| `@/components/ui/tooltip` | `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` | Radix Tooltip parts. |

`sonner` requires `next-themes` (only consumer). `Dialog`/`Sheet` reuse `ui/button`'s `Button`. Feature dialogs typically pass `showCloseButton={false}` on `DialogContent` and style it fully via `className`.

---

## Layout shell (`src/components/layout/AppLayout.tsx`)

The single layout `element` for `/`. Responsibilities: (1) `useEffect` sets `document.documentElement.dir`/`lang` from `langStore`; (2) `useEffect` applies `.dark` class from `themeStore` + `matchMedia('(prefers-color-scheme: dark)')` listener via `resolveTheme`; (3) sticky desktop sidebar (`NAV_ITEMS` of `{ to, labelKey: TKey }` → `NavLink` with active styling) + mobile `Sheet` nav (side flips with RTL: `dir==="rtl" ? "right" : "left"`); (4) top bar with theme-cycle button (`themeActions.cycle`, icon per mode from `{light:Sun, dark:Moon, system:SunMoon}`) and language toggle (`langActions.toggle`, shows `ع`/`FR`); (5) `RoleViewBanner` reading `uiStore.roleView`; (6) `<Outlet />` inside `<main class="mx-auto max-w-[1320px] …">`; (7) global search-param-driven overlay hosts `<PresProfileHost/> <ClientFicheHost/> <WorkerViewHost/>` and `<Toaster position="bottom-center" />`. Brand `Logo` uses `text-de9-red`/`text-de9-teal` + an ink badge.

## Feature roster (each an identical slice to replicate)
`commandes` (worklist + console: ActionModals, DocViewer, WorkerViewHost, NotesModal), `prestataires` (search, profile host with Avis/Contrat/Kyc panels, selection store, reviews/kyc apis), `clients` (fiche host, KYC tab), `soustraitance`, `handicap`, `factures`, `credits` (canonical), `analytics`. Root router order: index → `/commandes` default; `*` → `/commandes`.

---

### Key files (absolute paths)
- Configs: `/Users/haithamattab/Documents/Frontend Projects/react/react-projects/de9de9-enterprise/{package.json, vite.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, components.json, index.html, eslint.config.js}`
- Tokens/CSS: `.../src/index.css`
- Entry/routing/lib: `.../src/main.tsx`, `.../src/routes/index.tsx`, `.../src/lib/{utils.ts,queryClient.ts,i18n/{dict.ts,index.ts}}`
- Stores: `.../src/stores/{authStore,langStore,themeStore,uiStore}.ts`
- API: `.../src/api/apiClient.ts`, `.../src/api/mock/{router.ts,handlers.ts,db.ts,index.ts}`
- Layout: `.../src/components/layout/AppLayout.tsx`
- UI: `.../src/components/ui/*.tsx` (18 files listed above)
- Canonical feature: `.../src/features/credits/{schemas/credit.ts,api/credits.ts,routes.tsx,components/{CreditsPage,RechargeModal,PieceViewer}.tsx}`