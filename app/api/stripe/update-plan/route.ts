import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { planId, planName } = await request.json();

    if (!planId || !planName) {
      return NextResponse.json(
        { error: 'Plan ID and name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if plan is locked (1-year commitment)
    const { data: userData } = await supabase
      .from('users')
      .select('plan_locked_until, role')
      .eq('id', user.id)
      .single();

    if (userData?.plan_locked_until && userData.role !== 'admin') {
      const lockDate = new Date(userData.plan_locked_until);
      if (lockDate > new Date()) {
        const formattedDate = lockDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return NextResponse.json(
          { error: `Your plan is locked until ${formattedDate}. Plan changes are not allowed during the 1-year term.` },
          { status: 403 }
        );
      }
    }

    // Update user's subscription plan
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_plan: planId,
        commission_plan: planName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating plan:', updateError);
      return NextResponse.json(
        { error: 'Failed to update plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plan updated successfully',
    });
  } catch (error: any) {
    console.error('Error in update-plan:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
