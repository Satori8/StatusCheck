# Status Check (Executive Calendar)

> **Precision accountability and commitment tracking designed strictly for modern high-performance teams.**  
> A premium, zero-slop, role-based SaaS dashboard built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (Auth + PostgreSQL + RLS)**.

---

## Executive Overview

**Status Check** is an enterprise-ready commitment and deadline tracking platform designed specifically for managers who require absolute transparency and for team members who value clear, high-contrast, zero-noise task management. 

By replacing messy spreadsheet trackers and chaotic messaging channels with a unified, high-craft calendar interface, Status Check ensures that commitments made are commitments executed.

### Key Product Value Propositions (Marketing Manager Review)
*   **Absolute Accountability:** Every task represents a binding commitment between an **Author**, an **Assignee**, and a **Checker**.
*   **Real-Time Status & Automation:** Eliminate manual follow-ups. Automated database triggers immediately flag overdue commitments as `expired`.
*   **Role-Based Access Controls (RBAC):** Restrict core workflow management (creating, assigning, deleting tasks) to **Managers**, while empowering **Members** with intuitive, haptic-feedback status updates on their assigned responsibilities.
*   **Conversion-Optimized Landing Experience:** A gorgeous, dual-column homepage with fluid entrance animations and a glassmorphic authentication terminal.
*   **Zero-Slop Design Language:** No childish emojis, no cartoonish illustrations. Built using the **"Executive Slate"** design system with a premium, focused dark theme that commands respect.

### Architectural Excellence (Tech Lead Review)
*   **State-of-the-Art Next.js 14 Stack:** Fully utilizes Server Actions (`'use server'`) for fast server-side processing, secure mutations, and automatic cache revalidation (`revalidatePath`).
*   **Unified Middleware Route Protection:** Authenticates users and restricts `/dashboard` access entirely on the edge using a secure, cookie-based Supabase SSR middleware implementation (`@supabase/ssr`).
*   **Secure Multi-Tenant Row-Level Security (RLS):** Employs robust PostgreSQL RLS rules directly at the database layer, acting as a foolproof safety net behind server-side validation.
*   **High-Performance Interactivity:** Powered by `@fullcalendar/react` for custom-rendered, fluid, interactive calendars, and `framer-motion` (v11) for high-end spring haptics on cards, tabs, and action drawers.
*   **Fallback REST API Capabilities:** Implements fully-secured REST API routes (`POST /PUT /DELETE` at `/api/commitments`) parallel to Server Actions, supporting potential headless or mobile client integrations.

---

## Technical Stack & Systems Architecture

```
                      ┌─────────────────────────────────┐
                      │          Web Browser            │
                      └────────────────┬────────────────┘
                                       │
                     HTTPS Request     │  (REST API / Server Actions)
                                       ▼
                      ┌─────────────────────────────────┐
                      │    Next.js Routing Engine       │
                      │       (App Router V14)          │
                      └────────────────┬────────────────┘
                                       │
                    Uses Middleware    │  (Cookie Sync / Protection)
                                       ▼
                      ┌─────────────────────────────────┐
                      │    Supabase SSR Middleware      │
                      │  - Validates auth.getUser()     │
                      │  - Enforces route protection    │
                      └────────────────┬────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
           ┌─────────────────────┐           ┌─────────────────────┐
           │   Server Actions    │           │   REST API Route    │
           │ (auth, commitments) │           │ (/api/commitments)  │
           └──────────┬──────────┘           └──────────┬──────────┘
                      │                                 │
                      └────────────────┬────────────────┘
                                       │  Queries via Supabase Client
                                       ▼
                      ┌─────────────────────────────────┐
                      │     PostgreSQL (Supabase)       │
                      │  - Row-Level Security Enforced  │
                      │  - Auto-Sync User Profiles      │
                      │  - Auto-Compute Expiry Trigger  │
                      └─────────────────────────────────┘
```

### Key Dependencies
*   **Framework:** `next` (v14.2.3)
*   **Runtime:** Node.js (v20+)
*   **Styling & Motion:** `tailwindcss` (v3.4.19), `framer-motion` (v11.18.2)
*   **Database & Auth:** `@supabase/ssr` (v0.10.3), `@supabase/supabase-js` (v2.106.2)
*   **Calendar Core:** `@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`, `@fullcalendar/list` (all v6.1.20)
*   **Icons:** `@phosphor-icons/react` (v2.1.10), `lucide-react` (v0.312.0)

---

## Database Schema & Security Matrix

The backend database runs on **PostgreSQL** (hosted via Supabase), implementing customized Postgres enums, trigger-based profile synchronization, and automatic expiry handlers.

### 1. Custom Postgres Enums
```sql
CREATE TYPE user_role AS ENUM ('manager', 'member');
CREATE TYPE commitment_status AS ENUM ('to_check', 'done', 'expired', 'not_actual', 'ideas_backlog');
```

### 2. Database Tables
#### Table: `public.profiles`
Stores profile information synchronized directly with authenticated users.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Link to auth metadata |
| `email` | `TEXT` | `NOT NULL`, `UNIQUE` | User email address |
| `name` | `TEXT` | `NULL` | Optional user display name |
| `role` | `user_role` | `NOT NULL`, `DEFAULT 'member'` | User permission role |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Record creation timestamp |

#### Table: `public.commitments`
Holds the core task/commitment details, including assignments and deadlines.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique commitment identifier |
| `title` | `TEXT` | `NOT NULL` | Short title of the commitment |
| `description`| `TEXT` | `NULL` | Elaborated task description |
| `author_id` | `UUID` | `NOT NULL`, `REFERENCES public.profiles(id) ON DELETE RESTRICT` | The manager who created it |
| `project` | `TEXT` | `NOT NULL`, `REFERENCES public.projects(name) ON DELETE RESTRICT` | Associated project category |
| `assignee_id`| `UUID` | `NOT NULL`, `REFERENCES public.profiles(id) ON DELETE RESTRICT` | Team member executing the task |
| `checker_id` | `UUID` | `NOT NULL`, `REFERENCES public.profiles(id) ON DELETE RESTRICT` | Person verifying task execution |
| `deadline` | `TIMESTAMPTZ`| `NULL` | Target deadline (null supports backlog) |
| `status` | `commitment_status` | `NOT NULL`, `DEFAULT 'to_check'` | Current lifecycle stage of task |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Record creation timestamp |

#### Table: `public.projects`
Lists valid projects that commitments can belong to.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | `TEXT` | `PRIMARY KEY` | Unique project name identifier |
| `description`| `TEXT` | `NULL` | Optional description of the project |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Project category timestamp |

---

### 3. Row-Level Security (RLS) Policy Matrix

| Table | Operation | Allowed For | RLS SQL Policy Expression / Condition |
| :--- | :--- | :--- | :--- |
| `profiles` | `SELECT` | Authenticated | `true` (all authenticated users can read profiles) |
| `profiles` | `UPDATE` | Self | `auth.uid() = id` (users can only update their own profile) |
| `commitments` | `SELECT` | Authenticated | `true` (shared visibility across the workspace) |
| `commitments` | `INSERT` | Authenticated | `true` * (Note: Restricted server-side to Managers) * |
| `commitments` | `UPDATE` | Authenticated | `true` * (Note: Restricted server-side: Members can only edit status of their assigned tasks) * |
| `commitments` | `DELETE` | Authenticated | `true` * (Note: Restricted server-side to Managers who are authors) * |
| `projects` | `SELECT` | Authenticated | `true` (shared categories visibility) |
| `projects` | `INSERT` | Managers | `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')` |
| `projects` | `UPDATE` | Managers | `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')` |
| `projects` | `DELETE` | Managers | `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')` |

---

### 4. Database Trigger Automations
#### Automatic User Sync (`handle_new_user`)
Triggered **AFTER INSERT** on `auth.users`. It parses metadata parameters passed during account creation and creates a matching record in `public.profiles`.
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'manager' THEN 'manager'::public.user_role
      ELSE 'member'::public.user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

#### Automatic Expiry Handler (`check_commitment_expiry`)
Triggered **BEFORE INSERT OR UPDATE** on `public.commitments`. If a task's status is `'to_check'` and the current timestamp exceeds its `'deadline'`, the status is dynamically mutated to `'expired'`.
```sql
CREATE OR REPLACE FUNCTION public.check_commitment_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'to_check' AND NEW.deadline < NOW() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## "Executive Slate" Design System

Status Check adheres to a strict dark-mode visual system designed to maximize readability and premium feel:

### Structural Metrics
*   **DESIGN_VARIANCE:** `8` (Highly asymmetrical, dynamic, and high-contrast block alignments).
*   **MOTION_INTENSITY:** `6` (Spring-based fluid movements; overshoot spring physics on action drawers and tab sliders).
*   **VISUAL_DENSITY:** `4` (Substantial premium whitespace, clean lines, and strict 1px padding layouts).

### Color Palette
*   **Primary Background:** Deep charcoal slate (`#0d0e15`, `#11121d`). *Pure black is banned.*
*   **Surfaces & Containers:** High-end slate panels (`#161726`) bounded by a subtle 1px border (`#24263b`) and a faint inner highlight (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]`).
*   **Primary Accents:** Muted electric blue (`#3b82f6` or `#4f46e5`).
*   **Status Color Coding (Functional):**
    *   `to_check` (Active & Pending Check): Warm Gold (`#f59e0b`)
    *   `done` (Verified Complete): Forest Emerald (`#10b981`)
    *   `expired` (Deadline Missed): Crimson Red (`#ef4444`)
    *   `not_actual` (Dismissed/Archived): Slate Gray (`#64748b`)
    *   `ideas_backlog` (Project Backlog): Muted Indigo (`#6366f1`)

### Typography
*   **Pairings:** Inter is banned. The layout exclusively uses **Geist Sans** (for interface, controls, and headings) and **Geist Mono** (for high-density statistics, numerical metrics, and dates).

### Anti-Emoji Protocol
*   No decorative emojis allowed anywhere.
*   Pure SVG iconography exclusively using **Phosphor Icons** (`@phosphor-icons/react`) and **Lucide React** (`lucide-react`).

---

## Client & Server Operations Flow

The application splits its logic cleanly between **Server Actions** (for forms and pages), **REST APIs** (for external endpoints), and **Client Components** (for high-end UX).

### User-Role Separation Mechanics
1.  **Manager Experience:**
    *   Access to the **Sliding Action Drawer** to create commitments.
    *   Full controls to edit and modify any fields (assignee, deadline, title, project, status).
    *   Permission to delete commitments they authored.
    *   Ability to configure, create, edit, and delete Projects categories.
2.  **Member Experience:**
    *   All creation forms and floating action buttons are completely disabled.
    *   Can view all team commitments in the interactive Calendar and Tabular/Board views.
    *   Allowed to update **ONLY** the `status` field of commitments assigned directly to them (verified via backend middleware and server-side functions).

### REST API Reference
All endpoints enforce authorization, verifying user session state and profile roles.

#### `POST /api/commitments`
Allows managers to create commitments.
*   **Authorization:** Session Cookie required. Role must be `manager`.
*   **Payload Example:**
    ```json
    {
      "title": "Complete Security Review",
      "description": "Run dependency audits and secure RLS tables",
      "project": "Security Auditing",
      "assignee_id": "8fa8572b-8a88-466d-8e8e-d91f24263b01",
      "checker_id": "4da2963c-9b11-477d-9a9a-e11f11121d99",
      "deadline": "2026-06-15T18:00:00Z"
    }
    ```
*   **Response (200 OK):** `{"success": true}`

#### `PUT /api/commitments`
Updates an existing commitment.
*   **Authorization:** Session Cookie required.
    *   Managers can update any fields on commitments they authored.
    *   Members can update **only** the `status` field, and **only** if they are the `assignee_id`.
*   **Payload Example (Manager):**
    ```json
    {
      "id": "c19b8822-0a11-447c-8787-d5d4d3c2c101",
      "title": "Complete Audits (Updated)"
    }
    ```
*   **Payload Example (Member - Status Only):**
    ```json
    {
      "id": "c19b8822-0a11-447c-8787-d5d4d3c2c101",
      "status": "done"
    }
    ```
*   **Response (200 OK):** `{"success": true}`

#### `DELETE /api/commitments`
Deletes an authored commitment.
*   **Authorization:** Session Cookie required. Role must be `manager` AND must be the commitment author.
*   **Payload:**
    ```json
    {
      "id": "c19b8822-0a11-447c-8787-d5d4d3c2c101"
    }
    ```
*   **Response (200 OK):** `{"success": true}`

---

## Code Quality & Verification Gates

To preserve the extreme code quality of this project, enforce these checks before staging any commits:

| Check | Tool Command | Expected Output |
| :--- | :--- | :--- |
| **Type Check** | `npm run typecheck` | `0 errors` (Strict compilation) |
| **Linter Check**| `npm run lint` | `0 warnings` (ESLint Next.js layout rules) |
| **Build Check** | `npm run build` | `Successful production build` |
