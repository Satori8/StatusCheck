'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Define TypeScript interfaces for our data structures
interface Profile {
  id: string
  email: string
  role: 'manager' | 'member'
  name?: string | null
  created_at?: string
}

interface Commitment {
  id: string
  title: string
  description: string | null
  author_id: string
  project: string
  assignee_id: string
  checker_id: string
  deadline: string
  status: 'to_check' | 'done' | 'expired' | 'not_actual' | 'ideas_backlog'
  created_at: string
  author?: Profile
  assignee?: Profile
  checker?: Profile
}

export async function getCommitments(): Promise<{ data?: Commitment[], error?: string }> {
  const supabase = createClient();
  
  try {
    // First, auto-transition expired commitments
    await supabase
      .from('commitments')
      .update({ status: 'expired' })
      .eq('status', 'to_check')
      .lt('deadline', new Date().toISOString());
    
    // Query all commitments with joins to get profile information
    const { data: commitments, error } = await supabase
      .from('commitments')
      .select(`
        *,
        author:profiles!commitments_author_id_fkey (*),
        assignee:profiles!commitments_assignee_id_fkey (*),
        checker:profiles!commitments_checker_id_fkey (*)
      `)
      .order('deadline', { ascending: true });
    
    if (error) {
      return { error: error.message };
    }
    
    return { data: commitments };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}

export async function getProfiles(): Promise<{ data?: Profile[], error?: string }> {
  const supabase = createClient();
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .order('email', { ascending: true });
    
    if (error) {
      return { error: error.message };
    }
    
    return { data: profiles };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}

export async function createCommitment(data: {
  title: string
  description: string
  project: string
  assignee_id: string
  checker_id: string
  deadline: string
  status?: string
}): Promise<{ success?: boolean, error?: string }> {
  const supabase = createClient();
  
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'Unauthorized: User not authenticated' };
    }
    
    // Check user's role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return { error: 'Unauthorized: User profile not found' };
    }
    
    // Only managers can create commitments
    if (profile.role !== 'manager') {
      return { error: 'Unauthorized: Only managers can create commitments' };
    }
    
    // Insert new commitment
    const { error: insertError } = await supabase
      .from('commitments')
      .insert({
        title: data.title,
        description: data.description,
        author_id: user.id,
        project: data.project,
        assignee_id: data.assignee_id,
        checker_id: data.checker_id,
        deadline: data.deadline,
        status: data.status || 'to_check'
      });
    
    if (insertError) {
      return { error: insertError.message };
    }
    
    // Revalidate the dashboard page
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}

export async function updateCommitment(
  id: string,
  data: Partial<{
    title: string
    description: string
    project: string
    assignee_id: string
    checker_id: string
    deadline: string
    status: string
  }>
): Promise<{ success?: boolean, error?: string }> {
  const supabase = createClient();
  
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'Unauthorized: User not authenticated' };
    }
    
    // Check user's role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return { error: 'Unauthorized: User profile not found' };
    }
    
    // Get the current commitment to check assignee
    const { data: commitment, error: commitmentError } = await supabase
      .from('commitments')
      .select('assignee_id')
      .eq('id', id)
      .single();
    
    if (commitmentError || !commitment) {
      return { error: 'Commitment not found' };
    }
    
    // Check authorization based on user role
    if (profile.role === 'member') {
      // Members can only update their own commitments' status
      if (user.id !== commitment.assignee_id) {
        return { error: 'Unauthorized' };
      }
      
      // Check if trying to modify fields other than status
      const allowedFields = ['status'];
      const providedFields = Object.keys(data);
      const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        return { error: 'Unauthorized: Members can only update commitment status' };
      }
    }
    
    // Execute update
    const { error: updateError } = await supabase
      .from('commitments')
      .update(data)
      .eq('id', id);
    
    if (updateError) {
      return { error: updateError.message };
    }
    
    // Revalidate the dashboard page
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}

export async function deleteCommitment(id: string): Promise<{ success?: boolean, error?: string }> {
  const supabase = createClient();
  
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'Unauthorized: User not authenticated' };
    }
    
    // Check user's role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return { error: 'Unauthorized: User profile not found' };
    }
    
    // Only managers can delete commitments
    if (profile.role !== 'manager') {
      return { error: 'Unauthorized: Only managers can delete commitments' };
    }
    
    // Execute delete
    const { error: deleteError } = await supabase
      .from('commitments')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return { error: deleteError.message };
    }
    
    // Revalidate the dashboard page
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error occurred' };
  }
}