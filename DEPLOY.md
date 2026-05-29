# Deployment Guide: Status Check SaaS

Follow these simple steps to deploy "Status Check" in under 5 minutes using Supabase and Vercel.

---

## 1. Supabase Database Setup

1.  **Create a New Project**:
    *   Sign in to your [Supabase Dashboard](https://supabase.com).
    *   Click **New Project** and select your organization.
    *   Choose a project name (e.g., `status-check`) and a database password.
    *   Select your region and click **Create New Project**.

2.  **Run Database Migrations**:
    *   Once your database is provisioned, navigate to the **SQL Editor** tab in the left-hand menu.
    *   Click **New Query**.
    *   Copy the entire contents of the migration file: `supabase/migrations/20260529000000_init.sql` from your workspace.
    *   Paste it into the editor and click **Run**.
    *   This sets up the `profiles` and `commitments` tables, enums, triggers, and Row-Level Security (RLS) policies.

3.  **Retrieve API Keys**:
    *   Go to **Project Settings** (gear icon) -> **API**.
    *   Copy the **Project URL** (under URL). This is your `NEXT_PUBLIC_SUPABASE_URL`.
    *   Copy the **anon public key** (under Project API keys). This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 2. Environment Configuration

1.  Create a `.env.local` file in your project root (or copy `.env.example` to `.env`):
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here
    ```

---

## 3. Vercel Deployment

1.  **Prepare Codebase**:
    *   Initialize git and push your codebase to a private GitHub, GitLab, or Bitbucket repository:
        ```bash
        git init
        git add .
        git commit -m "feat: status check mvp build"
        ```

2.  **Deploy on Vercel**:
    *   Go to your [Vercel Dashboard](https://vercel.com) and click **Add New** -> **Project**.
    *   Import your repository.
    *   Under **Environment Variables**, add:
        *   `NEXT_PUBLIC_SUPABASE_URL` -> (Your Supabase URL)
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> (Your Supabase Anon Key)
    *   Click **Deploy**.
    *   Vercel will build, optimize, and launch your SaaS application to production.

---

## 4. Testing Your Deployment (Role-Based SaaS Experience)

1.  **Register a Manager**:
    *   Go to your live app URL.
    *   Select the **Create Account** tab.
    *   Type in an email, a secure password, and select **Manager** in the dropdown.
    *   Submit the form. You are redirected to `/dashboard` and can create commitments, assign them, and manage everyone's tasks.

2.  **Register a Team Member**:
    *   Sign out of your manager account.
    *   Create a new account with a different email and select **Member** in the dropdown.
    *   Submit the form. You are redirected to `/dashboard`.
    *   As a Member, you can see all commitments on the calendar or table, but the creation forms are disabled, and you can only update the status of commitments assigned directly to you.
