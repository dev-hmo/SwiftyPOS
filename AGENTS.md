# SwiftyPOS — Agent Guide

## Tech Stack

- React 19 + TypeScript (strict, `verbatimModuleSyntax`, `noUnusedLocals`/`noUnusedParameters`)
- Vite 8, MUI v7 (Emotion), Tailwind CSS v4, Zustand v5, React Router v7
- Supabase (PostgreSQL + Auth + RLS) — all data access goes through `src/services/db.ts` or Supabase client in `src/lib/supabase.ts`
- PWA enabled via `vite-plugin-pwa`

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on `:5173` |
| `npm run build` | `tsc -b && vite build` — **TypeScript runs first**; fix TS errors before build |
| `npm run lint` | ESLint (flat config) |
| `npm run test` | Vitest (single run) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright (auto-starts dev server, chromium only) |

**Verification order**: `npm run lint` → `npm run test` → `npm run build`

## Project Layout

```
src/
├── components/     # admin/, pos/, common/, saas/
├── hooks/          # Custom hooks (e.g. useDebounce)
├── layouts/        # AdminLayout, POSLayout
├── lib/            # supabase.ts — client init + shared types
├── pages/          # admin/, auth/, pos/, public/
├── services/       # db.ts — ProductService, TransactionService
├── store/          # Zustand stores (auth, cart, settings, etc.)
├── test/           # vitest.setup.ts
├── types/          # TypeScript type definitions
└── utils/          # Formatters, calculations
```

- **App entry**: `src/main.tsx` → `src/App.tsx`
- **Auth store** (`useAuthStore`): uses Zustand `persist` middleware with localStorage key `auth-storage`. Must call `setHydrated()` before rendering protected routes.
- **Supabase env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — warn if missing, don't crash.
- **Database schema**: `supabase_schema.sql` at root + migrations in `supabase/migrations/`.

## Testing

- **Unit tests**: Colocated `__tests__/` dirs next to source (e.g. `src/store/__tests__/`)
- **Test files**: `src/**/*.{test,spec}.{ts,tsx}`
- **Setup file**: `src/test/vitest.setup.ts` — mocks localStorage for Zustand persist stores
- **E2E tests**: `e2e/*.spec.ts` — Playwright with chromium, auto-starts dev server
- **Test deps**: `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

## Key Conventions

- **Roles**: `admin` | `manager` | `cashier` — enforced via `ProtectedRoute` component and Supabase RLS
- **Zustand stores**: use `persist` middleware with localStorage. Always mock localStorage in tests.
- **Styling**: MUI components with `sx` prop + Tailwind utility classes. Theme defined in `src/theme.ts` (terracotta primary, mint green secondary).
- **No CI workflows** currently defined in `.github/`.
- **PWA**: service worker auto-updates; 4MB cache size limit.
