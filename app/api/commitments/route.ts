import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
    }

    // Check user's role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized: User profile not found' }, { status: 401 });
    }

    // Only managers can create commitments
    if (profile.role !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized: Only managers can create commitments' }, { status: 403 });
    }

    const data = await request.json();

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
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const supabase = createClient();
  
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
    }

    // Check user's role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized: User profile not found' }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    // Get the current commitment to check assignee
    const { data: commitment, error: commitmentError } = await supabase
      .from('commitments')
      .select('assignee_id, author_id')
      .eq('id', id)
      .single();

    if (commitmentError || !commitment) {
      return NextResponse.json({ error: 'Commitment not found' }, { status: 404 });
    }

    // Check authorization based on user role
    if (profile.role === 'member') {
      // Members can only update their own commitments' status
      if (user.id !== commitment.assignee_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Check if trying to modify fields other than status
      const allowedFields = ['status'];
      const providedFields = Object.keys(updateData);
      const invalidFields = providedFields.filter(field => !allowedFields.includes(field));

      if (invalidFields.length > 0) {
        return NextResponse.json(
          { error: 'Unauthorized: Members can only update commitment status' },
          { status: 403 }
        );
      }
    } else if (profile.role === 'manager') {
      // Managers can update any field but only if they are the author
      if (user.id !== commitment.author_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Execute update
    const { error: updateError } = await supabase
      .from('commitments')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: User not authenticated' }, { status: 401 });
    }

    // Check user's role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized: User profile not found' }, { status: 401 });
    }

    const { id } = await request.json();

    // Get the commitment to check author
    const { data: commitment, error: commitmentError } = await supabase
      .from('commitments')
      .select('author_id')
      .eq('id', id)
      .single();

    if (commitmentError || !commitment) {
      return NextResponse.json({ error: 'Commitment not found' }, { status: 404 });
    }

    // Only managers who are also the authors can delete commitments
    if (profile.role !== 'manager' || user.id !== commitment.author_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Execute delete
    const { error: deleteError } = await supabase
      .from('commitments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}