import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/utils/errorHandler';

export async function POST(request: Request) {
  try {
    // Use service role key to bypass RLS for public form submissions
    // This is safe because we validate all input and only insert review data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body = await request.json();
    const {
      agent_id,
      reviewer_name,
      reviewer_email,
      rating,
      review_text
    } = body;

    // Validate required fields
    if (!agent_id || !reviewer_name || !rating || !review_text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if agent exists and is approved
    const { data: agent, error: agentError } = await supabase
      .from('users')
      .select('id, role, account_status')
      .eq('id', agent_id)
      .eq('role', 'agent')
      .eq('account_status', 'approved')
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Invalid agent ID or agent not found' },
        { status: 404 }
      );
    }

    // Create review (will be unapproved by default due to RLS policy)
    const { data, error } = await supabase
      .from('agent_reviews')
      .insert({
        agent_id,
        reviewer_name,
        reviewer_email: reviewer_email || null,
        rating,
        review_text,
        is_approved: false // Explicitly set to false for admin approval
      })
      .select()
      .single();

    if (error) {
      console.error('[API /agent-reviews] Error creating review:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // TODO: Send email notification to admins (optional enhancement)
    // await sendAdminNotificationEmail(data);

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully and is pending approval',
      data
    });
  } catch (error: any) {
    console.error('[API /agent-reviews POST]', error);
    return createErrorResponse(error, 'Failed to submit review');
  }
}
