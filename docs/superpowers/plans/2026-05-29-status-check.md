# Status Check MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Status Check", a premium dark-mode, role-based commitment and deadline tracking web application with Next.js 14, Supabase Auth + RLS, and FullCalendar React.

**Architecture:** Use Approach 1 (Server-Side First) where Next.js Server Components securely render pages, Server Actions perform mutations/auth, and PostgreSQL triggers dynamically calculate commitment expiration.

**Tech Stack:** Next.js 14 App Router, Supabase Auth + Postgres RLS, FullCalendar React, Tailwind CSS, Framer Motion.

---

## File Structure

We will create and structure the project files as follows:
- `package.json`: Core workspace dependencies and scripts.
- `tsconfig.json`: TypeScript configuration for Next.js.
- `tailwind.config.ts` & `postcss.config.js`: Custom Executive Slate theme configuration.
- `supabase/migrations/20260529000000_init.sql`: All DB tables, custom enums, triggers, and RLS policies.
- `lib/supabase/server.ts` & `lib/supabase/client.ts` & `lib/supabase/middleware.ts`: SSR cookie-based Supabase clients.
- `middleware.ts`: Route protection intercepting unauthorized users.
- `app/layout.tsx` & `app/globals.css`: Premium root styles, Geist font settings, and glassmorphism definitions.
- `app/page.tsx`: Landing page with toggleable auth portal card.
- `app/actions/auth.ts`: Authentication Server Actions (login, register, signout).
- `app/actions/commitments.ts`: Commitment CRUD & status modification Server Actions.
- `app/dashboard/layout.tsx`: Layout providing responsive sidebar filters & user profile details.
- `app/dashboard/page.tsx`: Main dashboard UI displaying stats, view toggles, FullCalendar, and the commitments board.
- `components/dashboard/Sidebar.tsx`: Professional dark dashboard sidebar.
- `components/dashboard/CommitmentCalendar.tsx`: FullCalendar React integration with custom glass cards.
- `components/dashboard/CommitmentList.tsx`: Tabular grid list with interactive text filtering.
- `components/dashboard/CommitmentForm.tsx`: Premium slide-over modal for managers to create/edit commitments.
- `components/dashboard/FilterContext.tsx`: Client-side project/checker filter state.
- `components/ui/`: Tailored shadcn/ui primitives.

---

## Tasks

### Task 1: Initialize Workspace, Dependencies & Configurations

- [ ] **Step 1: Write `package.json`**
    Create `package.json` at the root with Next.js, Supabase, Tailwind, Framer Motion, and FullCalendar packages.
- [ ] **Step 2: Write `tsconfig.json`**
    Configure standard Next.js TypeScript options.
- [ ] **Step 3: Write `tailwind.config.ts` and `postcss.config.js`**
    Inject the Custom Executive Slate theme (Obsidian background, Slate-gray panels, Emerald and Amber functional colors).
- [ ] **Step 4: Run initial setup install**
    Run `npm install` to load all required modules.

### Task 2: Supabase Database Migration (Tables, Enums, Triggers, RLS)

- [ ] **Step 1: Write `supabase/migrations/20260529000000_init.sql`**
    Implement profiles table, commitments table, new user sync triggers, RLS policies, and expiry check trigger function.
- [ ] **Step 2: Generate local `.env.example` file**
    Include empty placeholders for Next.js public/private Supabase keys.

### Task 3: Setup Supabase SSR Clients & Route Middleware

- [ ] **Step 1: Write `lib/supabase/client.ts`**
    Setup standard browser client using `@supabase/ssr`.
- [ ] **Step 2: Write `lib/supabase/server.ts`**
    Setup standard server client (supporting Server Actions and RSC).
- [ ] **Step 3: Write `lib/supabase/middleware.ts`**
    Setup middleware client to intercept and update auth tokens.
- [ ] **Step 4: Write `middleware.ts`**
    Add path-matching route protection (redirecting unauthorized users to `/`).

### Task 4: Root Styles & Global Premium Elements

- [ ] **Step 1: Write `app/globals.css`**
    Configure custom canvas grids, glass refraction utilities (`.glass-panel`), and FullCalendar custom overrides.
- [ ] **Step 2: Write `app/layout.tsx`**
    Configure root HTML structure with Geist Sans and Geist Mono fonts.

### Task 5: Authentication Portal & Server Actions

- [ ] **Step 1: Write `app/actions/auth.ts`**
    Implement Server Actions for user login, registration, and logout.
- [ ] **Step 2: Write `app/page.tsx`**
    Implement split-screen Landing Page with interactive card switching between login/signup states.

### Task 6: Commitments Server Actions (CRUD, Expiry, Status Actions)

- [ ] **Step 1: Write `app/actions/commitments.ts`**
    Implement robust backend actions for creating, editing, and deleting commitments, and marking a commitment complete.

### Task 7: Dashboard Filter Context, Sidebar & Navigation

- [ ] **Step 1: Write `components/dashboard/FilterContext.tsx`**
    State provider for filtering active commitments.
- [ ] **Step 2: Write `components/dashboard/Sidebar.tsx`**
    Write the high-end dashboard sidebar component with interactive filter selects.
- [ ] **Step 3: Write `app/dashboard/layout.tsx`**
    Wrap dashboard page routes in sidebar layups and context states.

### Task 8: Commitment Management Components (Form & UI Skeletons)

- [ ] **Step 1: Write `components/dashboard/CommitmentForm.tsx`**
    Write a stunning, slide-over manager form utilizing spring animations for creating and modifying commitment fields.

### Task 9: Core Visual Views: Calendar & List

- [ ] **Step 1: Write `components/dashboard/CommitmentCalendar.tsx`**
    Client leaf component integrating FullCalendar dayGridMonth with customized, status-colored glass event badges and details popover sheets.
- [ ] **Step 2: Write `components/dashboard/CommitmentList.tsx`**
    An alternative high-density grid board listing all filtered commitments with inline status update triggers.

### Task 10: Unified Dashboard Page & Real-Time Expiry Verification

- [ ] **Step 1: Write `app/dashboard/page.tsx`**
    Compose statistics summary boxes, view switcher panels, empty states, and dynamic data binding.
- [ ] **Step 2: Write `DEPLOY.md`**
    Provide a step-by-step setup guide for Vercel and Supabase cloud deployments.
