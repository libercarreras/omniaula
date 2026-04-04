# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR, port 8080)
npm run build      # Production build
npm run lint       # ESLint across entire project
npm run test       # Run unit tests once (Vitest)
npm run test:watch # Vitest in watch mode
```

TypeScript is intentionally loose — `strictNullChecks` is disabled. Do not enable it.

## Architecture

**OmniAula** is a Spanish-language PWA for teachers to manage attendance, grades, behavior, and curriculum. It targets Argentina.

### Stack
- **Frontend**: React 18 + TypeScript + Vite, React Router v6, TanStack React Query
- **UI**: shadcn/ui (Radix UI) + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Edge Functions**: Deno-based Supabase functions for AI features
- **AI**: Lovable AI Gateway → `google/gemini-3-flash-preview` model

### Context Providers (App.tsx)
The root wraps everything in this order: `ErrorBoundary → ThemeProvider → QueryClientProvider → BrowserRouter → AuthProvider → InstitucionProvider`. Components access auth via `useAuth()` and active institution via `useInstitucion()`.

### Data Access
There is no REST API layer. Components query Supabase directly via `@supabase/supabase-js`. All tables use RLS policies filtering by `auth.uid() = user_id`. The `src/integrations/supabase/types.ts` file is auto-generated from the schema — do not edit it manually.

### Multi-tenancy
Users can belong to multiple institutions via `profesor_institucion`. The active institution is tracked in `InstitucionProvider`. Queries that need institution-scoping should join through this relationship.

### Edge Functions (`supabase/functions/`)
Deno-based serverless functions for AI operations: generating student reports, bulletin comments, diary summaries, evaluations, and group analysis. All call the Lovable AI Gateway. JWT verification is disabled per `supabase/config.toml`.

### Key Domain Tables
- `grupos` → class groups; `estudiantes` → students per group
- `clases` → individual class sessions (links grupo + materia + teacher)
- `asistencia` → attendance per student per class (enum: Presente/Ausente/Tardanza/Justificado)
- `notas` → grades; `evaluaciones` → assessments; `tareas` + `entregas` → homework
- `desempeno_diario` → daily performance (conduct, participation, oral, homework)
- `diario_clase` → class journal entries
- `app_settings` → dynamic key/value config (PWA icons, etc.)

### Page Structure
`src/pages/` maps directly to routes. `ModoClase.tsx` is the main complex page (detailed class view with tabs for attendance, grades, diary, etc.). Each tab lives in `src/components/clase/tabs/`.

### PWA
The manifest is dynamically injected from `app_settings` at startup (`src/main.tsx`). The `dynamic-manifest` Edge Function serves it. Service worker is managed by `vite-plugin-pwa`.
