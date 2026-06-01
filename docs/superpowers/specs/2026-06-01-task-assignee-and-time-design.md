# Design Specification: Task Assignee Names, User List Icons, and Card Time Display

**Date:** 2026-06-01  
**Status:** Approved  

---

## 1. Executive Summary
This document specifies the design for improving user/role visibility and task metadata in the Executive Calendar application.
The three main enhancements are:
1. **Name Display in Task Edit Form:** Show assignee and checker user names instead of raw emails during task editing.
2. **User List Icons:** Display dynamic icons (`Crown` for managers, `User` for members) beside usernames in the sidebar checkers filter.
3. **Card Metadata Improvements:** Show assignee name on list cards and display an absolute-positioned deadline time badge in the top-right corner if a specific time is set.

---

## 2. Technical Design

### 2.1 Database & Server Fetching Updates
To supply names and roles to the frontend:
* **`app/actions/commitments.ts` (`getProfiles`):** Include `name` in the SELECT list.
  ```typescript
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, role, name')
  ```
* **`app/dashboard/layout.tsx`:** Fetch `name` for `currentUserProfile` and `name, role` for `checkers`.
  ```typescript
  const { data: authData } = await supabase
    .from('profiles')
    .select('email, role, id, name')
    ...
  const { data: checkersData } = await supabase
    .from('profiles')
    .select('id, email, name, role')
  ```
* **`app/dashboard/page.tsx`:** Fetch `name` for `currentUserProfile`.
  ```typescript
  const { data: authData } = await supabase
    .from('profiles')
    .select('email, role, id, name')
  ```

### 2.2 Sidebar User List Roles and Icons
We will update `components/dashboard/Sidebar.tsx` to visually distinguish checkers by role:
* Import `Crown` and `User` from `@phosphor-icons/react`.
* Inside the mapping over `checkers` (around line 281), display:
  * `<Crown size={12} weight="fill" className="text-amber-500 mr-2 flex-shrink-0" />` if `checker.role === 'manager'`.
  * `<User size={12} className="text-slate-400 mr-2 flex-shrink-0" />` if `checker.role === 'member'`.

### 2.3 Task Card Layout (Assignee Name & Deadline Time)
We will modify `components/dashboard/CommitmentList.tsx` to add assignee text and the deadline time:
* **Assignee Text:** Under the commitment title, render small text showing `Assigned to: [Assignee Name]` (falling back to split email).
* **Deadline Time Badge:** Check if `commitment.deadline` contains a time component (not `00:00:00` or `T00:00`). If true, format the time as `h:mm A` (e.g. `10:30 AM`) and display it in a badge styled with absolute positioning `absolute top-3.5 right-4 md:right-16`.

---

## 3. Verification Plan
* Ensure `getProfiles` returns profile name properties.
* Check that dropdown lists in task creation/editing show names instead of email.
* Verify that the sidebar lists checkers with appropriate crown/user icons.
* Validate that cards on both mobile and desktop screens display "Assigned to: [Name]" below the title.
* Confirm that tasks with explicitly set deadline times show the formatted time badge in the top-right corner.
