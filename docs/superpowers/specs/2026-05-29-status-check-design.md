# Design Specification: Status Check MVP

## 1. Overview
"Status Check" is a premium, high-craft, commitment and deadline tracking SaaS built specifically for modern managers to monitor and enforce accountability. This application addresses a critical organizational need: ensuring that commitments made by team members are executed under tight, transparent observation.

## 2. Technical Stack
-   **Frontend & Routing**: Next.js 14 (App Router) + TypeScript
-   **Styling & UI**: Tailwind CSS (v3) + shadcn/ui custom theme
-   **Motion & Interaction**: Framer Motion (v11)
-   **Database & Auth**: Supabase (Auth + PostgreSQL + Row-Level Security)
-   **Calendar Component**: FullCalendar React (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`)

## 3. Database Schema & RLS Rules
We establish a two-table relational structure in the `public` schema:

### Tables
1.  **`public.profiles`**:
    -   `id` UUID PRIMARY KEY REFERENCES `auth.users(id)` ON DELETE CASCADE
    -   `email` TEXT NOT NULL UNIQUE
    -   `role` `user_role` (enum: `'manager'`, `'member'`) NOT NULL DEFAULT `'member'`
    -   `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

2.  **`public.commitments`**:
    -   `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
    -   `title` TEXT NOT NULL
    -   `description` TEXT
    -   `author_id` UUID NOT NULL REFERENCES `public.profiles(id)` ON DELETE RESTRICT
    -   `project` TEXT NOT NULL
    -   `assignee_id` UUID NOT NULL REFERENCES `public.profiles(id)` ON DELETE RESTRICT
    -   `checker_id` UUID NOT NULL REFERENCES `public.profiles(id)` ON DELETE RESTRICT
    -   `deadline` TIMESTAMPTZ NOT NULL
    -   `status` `commitment_status` (enum: `'to_check'`, `'done'`, `'expired'`, `'not_actual'`, `'ideas_backlog'`) NOT NULL DEFAULT `'to_check'`
    -   `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

### SQL Types
```sql
CREATE TYPE user_role AS ENUM ('manager', 'member');
CREATE TYPE commitment_status AS ENUM ('to_check', 'done', 'expired', 'not_actual', 'ideas_backlog');
```

### RLS Policies
-   **Profiles**:
    -   `SELECT`: Any authenticated user.
    -   `INSERT / UPDATE`: Automatically synced via DB trigger from `auth.users`, otherwise restricted to self.
-   **Commitments**:
    -   `SELECT`: Allowed for all authenticated users (shared database).
    -   `INSERT`: Allowed only for users with the `'manager'` role in `profiles`.
    -   `UPDATE`:
        -   Users with `'manager'` role: Full update permissions on any commitment.
        -   Users with `'member'` role: Allowed ONLY if the user's ID matches the `assignee_id`, and they are updating ONLY the `status` field.
    -   `DELETE`: Allowed only for the commitment's creator (`author_id`) who has a `'manager'` role.

## 4. Visual & Interface Design Guidelines (Executive Slate Theme)
This design is built with strict visual standards, overriding common AI slop:
-   **Baseline Metrics**: DESIGN_VARIANCE: 8 (highly asymmetric), MOTION_INTENSITY: 6 (spring-based fluid interactions), VISUAL_DENSITY: 4 (premium whitespace).
-   **Typography**: Exclusively Sans-Serif pairings (`Geist` & `Geist Mono` or `Satoshi` & `JetBrains Mono`). Inter is banned.
-   **Color Palette**:
    -   Primary Background: Deep Charcoal Dark-Mode-First (`#0d0e15`, `#11121d`). No pure black (`#000000`).
    -   Cards & Surfaces: Premium dark slate surfaces (`#161726`) with a 1px border of `#24263b` and a subtle inner highlight (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]`).
    -   Accents: Muted Electric Blue (`#3b82f6` / `#4f46e5`).
    -   Statuses (Functional Colors):
        *   `to_check` (Active Monitoring): Warm Gold (`#f59e0b`).
        *   `done` (Verified Complete): Forest Emerald (`#10b981`).
        *   `expired` (Missed Deadline): Crimson Red (`#ef4444`).
        *   `not_actual` (Dismissed): Slate Gray (`#64748b`).
        *   `ideas_backlog` (Backlog): Indigo (`#6366f1`).
-   **Liquid Glass Refraction**: Glass panels employ `backdrop-blur-xl`, `border-white/10`, and `shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]`.
-   **Anti-Emoji Policy**: Emojis are banned. Pure SVG icons from Radix icons or Phosphor icons exclusively.

## 5. Key Architecture & Flows

### Authentication
-   **Root Portal (`/`)**: A split-screen left-aligned layout with an interactive landing presentation on the left and a glassmorphic login/register card with slide animations on the right.
-   **Role Management**: Role selection (`manager` or `member`) is collected during sign-up and stored in `raw_user_meta_data`, which triggers the DB profile sync.

### Expiry Auto-Computation
A PostgreSQL trigger on database operations dynamically marks records as `expired` if `deadline < NOW()` and `status = 'to_check'`.
To capture idle time, a lightweight cleanup script runs on every page load/Server Action invocation.

### Dashboard Layout
-   **Left Sidebar**: Interactive Collapsible Panel with custom user details, role indicators, and interactive multi-select filters for projects and checkers.
-   **Main Work Area**:
    -   **Stats Header**: 3-column asymmetric layout (Total Tracked, Active Commitments, Expired count with Monospace font).
    -   **View Switcher**: High-end tab system switching between:
        1.  **FullCalendar Grid View**: Custom event rendering with status-colored tags and micro-hovers.
        2.  **Slick Tabular / Board View**: For high-density review.
    -   **Action Slidover Sheet**: To create or update commitments, popping out smoothly with overshoot spring physics.

## 6. Implementation Stages
1.  **Stage 1**: Supabase Migration (Tables, Enums, Triggers, RLS).
2.  **Stage 2**: Next.js Setup & Auth Pages (`@supabase/ssr` Middleware, Server Actions).
3.  **Stage 3**: Core Layout & Sidebar Filters (Desktop and Mobile-first layouts).
4.  **Stage 4**: FullCalendar Integration & Custom Views.
5.  **Stage 5**: Create / Update Modals, Expiry Logic, Status Transitions.
6.  **Stage 6**: Polish, Shimmers, and Verification.
