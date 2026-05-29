-- Add name column to profiles table for display names
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Update the trigger function to also populate the name column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
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
$$;
