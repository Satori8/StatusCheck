# Status Check — Project Overview

## What It Is
A **commitment and deadline tracking app** for teams. Managers create commitments with deadlines, assignees/checkers verify completion. Think "accountability tracker" — not a generic calendar.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Auth/Database:** Supabase (PostgreSQL + Auth)
- **UI:** Tailwind CSS v3, Framer Motion, Lucide icons
- **Calendar:** FullCalendar v6 (React wrapper)
- **Build:** Turbopack (dev), Webpack (prod)
- **Lint:** ESLint 8 + `eslint-config-next`

## Schema (PostgreSQL via Supabase)

### `public.profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK` | References `auth.users(id) ON DELETE CASCADE` |
| `email` | `TEXT NOT NULL UNIQUE` | |
| `name` | `TEXT` | Display name — populated from `raw_user_meta_data->>'name'` on sign-up; falls back to email prefix |
| `role` | `user_role` ENUM | `'manager'` or `'member'` — default `'member'` |
| `created_at` | `TIMESTAMPTZ` | Auto-generated |

Auto-created via `handle_new_user()` trigger on `auth.users` insert.

### `public.commitments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `UUID PK` | `gen_random_uuid()` |
| `title` | `TEXT NOT NULL` | |
| `description` | `TEXT` | |
| `author_id` | `UUID NOT NULL FK` | → `profiles(id)` — who created it |
| `project` | `TEXT NOT NULL` | Free-text string (not a FK to projects) |
| `assignee_id` | `UUID NOT NULL FK` | → `profiles(id)` — responsible for doing it |
| `checker_id` | `UUID NOT NULL FK` | → `profiles(id)` — verifies completion |
| `deadline` | `TIMESTAMPTZ` | Nullable (backlog items have no deadline) |
| `status` | `commitment_status` ENUM | `'to_check'`, `'done'`, `'expired'`, `'not_actual'`, `'ideas_backlog'` — default `'to_check'` |
| `created_at` | `TIMESTAMPTZ` | Auto-generated |

**self-healing:** `getProjects()` auto-inserts project names found in commitments that don't exist in the projects table yet.

### `public.projects`
| Column | Type |
|--------|------|
| `name` | `TEXT PK` |
| `description` | `TEXT` |
| `created_at` | `TIMESTAMPTZ` |

### Status Lifecycle
```
             ┌─────────────────────┐
             │     to_check        │ ← default on creation
             └────────┬────────────┘
                      │
          ┌───────────┼───────────────┐
          ▼           ▼               ▼
       done        expired        not_actual
                   (auto when       (manual — no longer relevant)
                    deadline
                    passes)
```
`ideas_backlog` screens commitments out of both calendar & list views into a separate backlog tab.

### RLS Policies
- **profiles:** SELECT — all authenticated; UPDATE — own profile only
- **commitments:** SELECT/INSERT/UPDATE/DELETE — all authenticated (open — no manager gate on individual operations)
- **projects:** SELECT — all authenticated; INSERT/UPDATE/DELETE — managers only

### Trigger functions
1. **`handle_new_user()`** — On `auth.users INSERT`: creates a profile row with id, email, name (from metadata or email prefix), and role (from metadata, default `'member'`)
2. **`check_commitment_expiry()`** — On `commitments INSERT/UPDATE`: if a commitment has `status = 'to_check'` and `deadline < NOW()`, auto-flips to `'expired'`

## Auth Flow
- **Supabase SSR** with cookie-based sessions
- **Middleware** (`/middleware.ts`): refreshes session on every request, redirects unauthenticated users away from `/dashboard`
- **Server client** (`lib/supabase/server.ts`): `createServerClient` using `@supabase/ssr` with cookie store
- **Browser client** (`lib/supabase/client.ts`): `createBrowserClient` for client-side operations
- **Registration:** captures `name`, `email`, `password`, `role` → `supabase.auth.signUp()` with `options.data` — email confirmation bypassed via Supabase settings
- **Login:** `signInWithPassword()` → redirects to `/dashboard`
- **Logout:** `signOut()` → redirects to `/`

## Project Structure

```
app/
├── page.tsx              # Landing page (hero + AuthPortal)
├── layout.tsx            # Root layout (imports globals.css)
├── globals.css           # Shared styles
│
├── dashboard/
│   ├── layout.tsx        # Dashboard layout. Fetches user profile
│   │                       + projects + checkers → DashboardClientWrapper
│   ├── page.tsx          # Dashboard page. Server component. Fetches
│   │                       commitments, profiles, projects in parallel.
│   │                       Shows error view if any fetch fails.
│   └── globals.css       # Dashboard-specific (FullCalendar imports)
│
├── actions/
│   ├── auth.ts           # Server actions: login, register, logout
│   ├── commitments.ts    # Server actions: getCommitments, getProfiles,
│   │                       createCommitment, updateCommitment, deleteCommitment
│   └── projects.ts       # Server actions: getProjects (with self-healing sync),
│                           createProject, updateProject, deleteProject
│
└── api/commitments/
    └── route.ts          # REST API: POST (create), PUT (update),
                            DELETE. Used by CommitmentForm.

components/
├── auth/
│   ├── AuthPortal.tsx    # Client: signin/register tab switcher with animated pill
│   └── AuthForm.tsx      # Client: form with email + password + (register: name, role)
│
└── dashboard/
    ├── DashboardPageClient.tsx  # Client: orchestrator. Stats cards, view toggle
    │                              (calendar/list/backlog), filteredCommitments memo,
    │                              CommitmentForm modal.
    ├── DashboardClientWrapper.tsx # Client: wraps children with Sidebar + FilterProvider
    ├── Sidebar.tsx       # Client: user profile, project filter, checker filter,
    │                       project CRUD in bottom sheet modal
    ├── CommitmentCalendar.tsx # Client: FullCalendar wrapper with event detail popover
    ├── CommitmentList.tsx     # Client: animated list with expandable rows + status badges
    ├── CommitmentForm.tsx     # Client: create/edit modal with full validation
    ├── FilterContext.tsx      # Client: React Context for project/checker/search filters
    ├── SearchInput.tsx        # Client: search bar component
    ├── ErrorBoundary.tsx      # Client: React error boundary with refresh button
    └── LoadingSpinner.tsx     # Client: spinner UI

lib/supabase/
├── server.ts           # Server-side Supabase client (cookies via next/headers)
├── client.ts           # Browser-side Supabase client
└── middleware.ts       # Middleware client + route protection (redirect /dashboard if no user)
```

## Key Data Flow

```
User visits /dashboard
  │
  ├─ layout.tsx (server)
  │   ├─ auth check → redirect / if no user
  │   ├─ fetch profile (id, email, role)
  │   ├─ fetch projects (name, description)
  │   ├─ fetch checkers (id, email, name)
  │   └─ render DashboardClientWrapper
  │       └─ Sidebar (projects, checkers, user info)
  │
  └─ page.tsx (server)
      ├─ auth check → redirect / if no user
      ├─ fetch profile (id, email, role)
      ├─ parallel: getCommitments(), getProfiles(), getProjects()
      └─ render DashboardPageClient
          ├─ stats cards (total, pending, done, expired)
          ├─ FilterProvider (selectedProject, selectedCheckerId, searchQuery)
          ├─ view toggle: calendar | list | backlog
          ├─ CommitmentCalendar or CommitmentList (filteredCommitments)
          └─ CommitmentForm (create/edit modal)
```

## Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| `AuthPortal` | Tab switcher (sign in / register) with animated pill |
| `AuthForm` | Email + password form, handles submit loading/error states |
| `DashboardPageClient` | Server-data consumer, view routing, stats, filter logic, form modal |
| `DashboardClientWrapper` | Layout shell — wraps children in FilterProvider + Sidebar |
| `Sidebar` | Avatar, role badge, project multiselect, checker filter, project CRUD bottom sheet |
| `CommitmentCalendar` | FullCalendar dayGrid, event click → detail popover, drag-to-reschedule, delete from hover button |
| `CommitmentList` | Animated list with desktop grid / mobile card + expand, status badges, mark-done, delete |
| `CommitmentForm` | Modal form for create/edit — title, description, project (or new), assignee, checker, deadline, status |
| `FilterContext` | React Context: `selectedProject`, `selectedCheckerId`, `searchQuery` |
| `ErrorBoundary` | Catches client render errors, shows "Something went wrong" with refresh button |

## UI Conventions
- **Sidebar:** dark mode (`bg-slate-800/900`, text-white)
- **Dashboard body:** light mode (`bg-slate-50`, white cards)
- **Glass panels** on landing (`bg-zinc-950/40 border-white/10 backdrop-blur-xl`)
- **Form inputs:** all use `bg-white text-slate-800` (light, high-contrast regardless of parent)
- **Animations:** Framer Motion `AnimatePresence` for modals, list items, event popovers
- **Status badges** have color mapping with border + bg + text (amber/done:green/expired:red/not_actual:slate/backlog:indigo)
- **Timeline:** "Created at" shown below deadlines as supplementary info

## State Management
- **No global state library** — React Context (`FilterContext`) for cross-component filter state
- **Local state** for UI toggles (expanded rows, mobile menu, modal open, show new project input)
- **Server-driven** — all data fetched on the server, passed down as props. Mutations trigger `revalidatePath('/dashboard')` or `router.refresh()`

## Known Issues / Edge Cases
- **`name` column** — Was added to profiles via `20260529000001_add_name_to_profiles.sql` migration. Existing profiles need manual backfill: `UPDATE profiles SET name = split_part(email, '@', 1) WHERE name IS NULL;`
- **Projects self-healing** — `getProjects()` scans commitments for project names not yet in the projects table and inserts them silently. This fixes previous data-integrity gaps.
- **Deadline DST offset** — Fixed by using `currentTimezoneOffset()` instead of hardcoded `+0300`
- **RLS for projects** — Only managers can insert/update/delete projects. This previously had a bug where the `USING` clause was missing from `update_projects` policy.
- **Expired auto-restore** — If a deadline is moved to the future for an expired commitment, the status auto-transitions back to `to_check` (done client-side, in the edit flow)

## Common Dev Commands
```bash
npm run dev        # Next.js dev server (Turbopack)
npm run build      # Production build
npm run lint       # ESLint check
npm run typecheck  # tsc --noEmit
npx next build     # Full build (for deploy verification)
```

## Git Notes
- Branch: `main`
- AI commits include `Co-Authored-By: OpenCode AI <noreply@opencode.dev>`
