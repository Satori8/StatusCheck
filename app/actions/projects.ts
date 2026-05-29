'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProjects() {
  const supabase = createClient();
  
  try {
    // Self-healing database sync: Auto-insert any project names used in commitments but missing in projects
    const { data: commitmentsData } = await supabase
      .from('commitments')
      .select('project');
      
    if (commitmentsData && commitmentsData.length > 0) {
      const uniqueCommitmentProjects = Array.from(new Set(commitmentsData.map(c => c.project).filter(Boolean)));
      if (uniqueCommitmentProjects.length > 0) {
        const { data: existingProjects } = await supabase
          .from('projects')
          .select('name');
          
        const existingNames = new Set((existingProjects || []).map(p => p.name));
        const missingProjects = uniqueCommitmentProjects.filter(name => !existingNames.has(name));
        
        if (missingProjects.length > 0) {
          const insertData = missingProjects.map(name => ({ name }));
          await supabase.from('projects').insert(insertData);
        }
      }
    }
  } catch (err) {
    console.error('Projects self-healing database sync failed:', err);
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) return { error: error.message };
  return { data };
}

export async function createProject(name: string, description?: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('projects')
    .insert({ name, description });
    
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateProject(oldName: string, newName: string, description?: string) {
  const supabase = createClient();
  
  // 1. Update the project record name and description
  const { error: projectError } = await supabase
    .from('projects')
    .update({ name: newName, description })
    .eq('name', oldName);
    
  if (projectError) return { error: projectError.message };
  
  // 2. Cascade update all commitments project references
  const { error: commitmentError } = await supabase
    .from('commitments')
    .update({ project: newName })
    .eq('project', oldName);
    
  if (commitmentError) return { error: commitmentError.message };
  
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteProject(name: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('name', name);
    
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}
