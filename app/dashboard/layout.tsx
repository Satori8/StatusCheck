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
    .eq('user_id', user.id)
    .single();

  const userProfile = authData || {
    email: user.email || 'unknown@statuscheck.com',
    role: 'member' as const, // default role
    id: user.id,
  };

  // Fetch unique projects for filter
  // Note: In a real app, you would query your commitments table
  const { data: projectsData } = await supabase
    .from('commitments')
    .select('project')
    .is('project', 'not.null');

  const uniqueProjects = projectsData
    ? Array.from(new Set(projectsData.map(p => p.project).filter((p): p is string => p !== null)))
    : [];

  // Fetch checkers (all users with profiles)
  const { data: checkersData } = await supabase
    .from('profiles')
    .select('id, email');

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