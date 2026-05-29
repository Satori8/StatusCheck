import { redirect } from 'next/navigation';
import { DashboardClientWrapper } from '@/components/dashboard/DashboardClientWrapper';
import { createClient } from '@/lib/supabase/server';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Fetch current authenticated user using Supabase
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/');
  }

  // Fetch user profile from Supabase
  // Note: In a real app, you would have a profiles table
  // For now, we'll use the user's email and role from auth data
  const { data: authData } = await supabase
    .from('profiles')
    .select('email, role, id')
    .eq('id', user.id)
    .single();

  const userProfile = authData || {
    email: user.email || 'unknown@statuscheck.com',
    role: 'member' as const, // default role
    id: user.id,
  };

  // Fetch projects directly from the database table
  const { data: projectsData } = await supabase
    .from('projects')
    .select('name, description')
    .order('name', { ascending: true });

  const uniqueProjects = projectsData || [];

  // Fetch checkers (all users with profiles)
  const { data: checkersData } = await supabase
    .from('profiles')
    .select('id, email, name');

  const checkers = checkersData || [];

  return (
    <DashboardClientWrapper
      currentUserProfile={userProfile}
      projects={uniqueProjects}
      checkers={checkers}
    >
      {children}
    </DashboardClientWrapper>
  );
}