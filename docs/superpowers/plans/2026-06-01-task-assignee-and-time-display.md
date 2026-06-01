# Task Assignee and Time Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show user names instead of emails during task editing, add crown/user role icons to the sidebar checkers list, display assignee name under titles, and place a small absolute deadline time badge in the top-right corner of task cards.

**Architecture:** We will extend our database queries to fetch the `name` and `role` fields of user profiles. Then we will propagate these fields down the component tree through TypeScript interface alignment. Finally, we will update the sidebar user list and the task list card components to render these new properties with elegant Tailwind CSS styling.

**Tech Stack:** Next.js (App Router), Supabase SSR, TypeScript, Tailwind CSS, `@phosphor-icons/react`.

---

### Task 1: Update Database Queries

**Files:**
- Modify: `app/actions/commitments.ts`
- Modify: `app/dashboard/layout.tsx`
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Fetch `name` in `getProfiles()` action**
  Read `app/actions/commitments.ts` around line 69 and change `.select('id, email, role')` to `.select('id, email, role, name')`.

- [ ] **Step 2: Fetch `name` and `role` in `layout.tsx`**
  Read `app/dashboard/layout.tsx` around lines 23-26 and line 45, and ensure:
  1. Current profile query selects `email, role, id, name`.
  2. Checkers query selects `id, email, name, role`.

- [ ] **Step 3: Fetch `name` in `page.tsx`**
  Read `app/dashboard/page.tsx` around lines 20-25 and ensure the current profile query selects `email, role, id, name`.

- [ ] **Step 4: Typecheck changes**
  Run: `npx tsc --noEmit app/actions/commitments.ts app/dashboard/layout.tsx app/dashboard/page.tsx`
  Expected: PASS

---

### Task 2: Align Checkers & Profiles TypeScript Types

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`
- Modify: `components/dashboard/CommitmentForm.tsx`
- Modify: `components/dashboard/DashboardClientWrapper.tsx`
- Modify: `components/dashboard/DashboardPageClient.tsx`

- [ ] **Step 1: Align Types in `Sidebar.tsx`**
  Modify `SidebarProps` to include `role` for checkers:
  ```typescript
  checkers: { id: string; email: string; name?: string | null; role?: 'manager' | 'member' }[];
  ```

- [ ] **Step 2: Align Types in `CommitmentForm.tsx`**
  Modify `CommitmentFormProps` to include `role` for checkers and `name` for `currentUserProfile`:
  ```typescript
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
    id: string;
    name?: string | null;
  };
  checkers: { id: string; email: string; name?: string | null; role?: 'manager' | 'member' }[];
  ```

- [ ] **Step 3: Align Types in `DashboardClientWrapper.tsx`**
  Modify `DashboardClientWrapper` props and usages:
  ```typescript
  currentUserProfile: {
    email: string;
    role: 'manager' | 'member';
    id: string;
    name?: string | null;
  };
  checkers: { id: string; email: string; name?: string | null; role?: 'manager' | 'member' }[];
  ```

- [ ] **Step 4: Align Types and Propagate `role` in `DashboardPageClient.tsx`**
  Modify `DashboardPageClientProps` and the checkers `useMemo` map:
  ```typescript
  // Around lines 40-50:
  profiles: { id: string; email: string; role: 'manager' | 'member'; name?: string | null }[];

  // Around lines 143-149:
  const checkers = useMemo(() => {
    return profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role
    }));
  }, [profiles]);
  ```

- [ ] **Step 5: Typecheck changes**
  Run: `npx tsc --noEmit`
  Expected: PASS

---

### Task 3: Display Dynamic Role Icons in Sidebar Checkers Filter

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

- [ ] **Step 1: Import `Crown` and `User` in `Sidebar.tsx`**
  Add `Crown` and `User` to the imports list from `@phosphor-icons/react` at the top of the file:
  ```typescript
  import { Plus, Trash, X, PencilSimple, Info, SignOut, List, Crown, User } from '@phosphor-icons/react';
  ```

- [ ] **Step 2: Add dynamic role icon rendering in checkers map**
  Modify the checkers map rendering (around lines 281-293) to include the icon inside the button:
  ```tsx
  {checkers.map((checker) => (
    <button
      key={checker.id}
      onClick={() => setSelectedCheckerId(checker.id)}
      className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all border-0 ${
        selectedCheckerId === checker.id
          ? 'bg-[#143c90]/10 border border-[#143c90]/20 text-[#60a5fa] font-semibold'
          : 'bg-transparent text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#161726]/50'
      }`}
    >
      <span className="flex items-center min-w-0 flex-1">
        {checker.role === 'manager' ? (
          <Crown size={14} weight="fill" className="text-amber-500 mr-2 flex-shrink-0" />
        ) : (
          <User size={14} className="text-slate-400 mr-2 flex-shrink-0" />
        )}
        <span className="truncate">{checker.name || checker.email}</span>
      </span>
    </button>
  ))}
  ```

- [ ] **Step 3: Typecheck changes**
  Run: `npx tsc --noEmit components/dashboard/Sidebar.tsx`
  Expected: PASS

---

### Task 4: Add Assignee Text and top-right deadline Time Badge to Cards

**Files:**
- Modify: `components/dashboard/CommitmentList.tsx`

- [ ] **Step 1: Update card rendering to support assignee name text**
  In `components/dashboard/CommitmentList.tsx`, find where the title and description are rendered in the desktop/expanded content block (around lines 136-145).
  We want to show the assignee's name in a clean, small row below the title.
  Add the assignee text block:
  ```tsx
  <div className="mb-4 md:mb-0 pr-4 min-w-0 flex-1">
    <h3 className="font-bold text-[#f1f5f9] text-sm leading-snug hover:text-blue-400 transition-colors truncate">
      {commitment.title}
    </h3>
    {/* Assignee Name Text */}
    <span className="text-[10px] text-[#64748b] mt-1 block">
      Assigned to: <span className="text-[#94a3b8] font-semibold">{commitment.assignee?.name || commitment.assignee?.email?.split('@')[0] || 'Unassigned'}</span>
    </span>
    {commitment.description && (
      <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed break-words whitespace-pre-wrap line-clamp-1 max-w-[55ch]">
        {commitment.description}
      </p>
    )}
  </div>
  ```

- [ ] **Step 2: Add Top-Right Corner Deadline Time Badge**
  We want to display the deadline time in the right-top corner if it's explicitly set.
  First, verify if there is an explicit time component in `commitment.deadline`.
  ```typescript
  // Add this inside the map loop of commitments (before the return)
  const getDeadlineTime = () => {
    if (!commitment.deadline) return null;
    const date = new Date(commitment.deadline);
    // If minutes and hours are 0, we treat it as no explicit time set (since midnight is the default)
    if (date.getHours() === 0 && date.getMinutes() === 0) return null;
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  const deadlineTime = getDeadlineTime();
  ```
  Then, add the time badge inside the main card container:
  Ensure the parent element (the motion.div at line 108) is styled as `relative`. (It already has `relative` through group classes or we can add `relative` explicitly if needed. Let's make sure `relative` is in the `className` string).
  Add the absolute badge:
  ```tsx
  {/* Absolute Deadline Time Badge (Right Top Corner) */}
  {deadlineTime && (
    <div className="absolute top-3 right-4 bg-[#1e293b]/60 border border-[#334155]/60 text-[#94a3b8] font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">
      {deadlineTime}
    </div>
  )}
  ```

- [ ] **Step 3: Typecheck changes**
  Run: `npx tsc --noEmit components/dashboard/CommitmentList.tsx`
  Expected: PASS

- [ ] **Step 4: Build test**
  Run: `npm run build`
  Expected: PASS
