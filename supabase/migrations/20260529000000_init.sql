-- Create custom types
CREATE TYPE user_role AS ENUM ('manager', 'member');

CREATE TYPE commitment_status AS ENUM ('to_check', 'done', 'expired', 'not_actual', 'ideas_backlog');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create commitments table
CREATE TABLE public.commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  project TEXT NOT NULL,
  assignee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  checker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  deadline TIMESTAMPTZ NOT NULL,
  status commitment_status NOT NULL DEFAULT 'to_check',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger function for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'manager' THEN 'manager'::public.user_role
      ELSE 'member'::public.user_role
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger function for commitment expiry check
CREATE OR REPLACE FUNCTION public.check_commitment_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'to_check' AND NEW.deadline < NOW() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for commitment expiry
CREATE TRIGGER on_commitment_expiry
  BEFORE INSERT OR UPDATE ON public.commitments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_commitment_expiry();

-- Enable Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY select_profiles ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY update_profiles ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- RLS Policies for commitments
CREATE POLICY select_commitments ON public.commitments FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_commitments ON public.commitments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY update_commitments ON public.commitments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY delete_commitments ON public.commitments FOR DELETE TO authenticated USING (true);

-- Make deadline column nullable to support backlog items without deadlines
ALTER TABLE public.commitments ALTER COLUMN deadline DROP NOT NULL;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  name TEXT PRIMARY KEY,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-populate projects table with unique projects currently in commitments
INSERT INTO public.projects (name)
SELECT DISTINCT project FROM public.commitments
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_projects ON public.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_projects ON public.projects FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
);

CREATE POLICY update_projects ON public.projects FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
);

CREATE POLICY delete_projects ON public.projects FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
);