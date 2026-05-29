'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCommitments, getProfiles } from '@/app/actions/commitments';
import { getProjects } from '@/app/actions/projects';
import { DashboardPageClient } from '@/components/dashboard/DashboardPageClient';

export default async function DashboardPage() {
  // Fetch current authenticated user using Supabase
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/');
  }

  // Fetch user profile from Supabase
  const { data: authData } = await supabase
    .from('profiles')
    .select('email, role, id, name')
    .eq('id', user.id)
    .single();

  const currentUserProfile = authData || {
    email: user.email || 'unknown@statuscheck.com',
    role: 'member' as const, // default role
    id: user.id,
    name: user.user_metadata?.name || null,
  };

  // Fetch data in parallel
  const [commitmentsResult, profilesResult, projectsResult] = await Promise.all([
    getCommitments(),
    getProfiles(),
    getProjects()
  ]);

  // Handle errors
  if (commitmentsResult.error || profilesResult.error || projectsResult.error) {
    console.error('Failed to fetch data:', commitmentsResult.error || profilesResult.error || projectsResult.error);
    // In a real app, you might want to show an error page
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">Error loading dashboard</h1>
          <p className="text-slate-600">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardPageClient
      commitments={commitmentsResult.data || []}
      profiles={profilesResult.data || []}
      projects={projectsResult.data || []}
      currentUserProfile={currentUserProfile}
    />
  );
}