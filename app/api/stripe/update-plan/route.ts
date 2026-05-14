import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PLAN_CAPS: Record<string, number> = {
  launch: 18000,
  growth: 12000,
  pro: 0,
};

const PLAN_COMMISSIONS: Record<string, string> = {
  launch: '80/20 Split',
  growth: '90/10 Split',
  pro: '100% Commission',
};

export async function POST(request: Request) {
  try {
    const { planId, planName, targetUserId } = await request.json();

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

    // Get current user's role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = currentUser?.role === 'admin';

    // Determine which user to update
    const userToUpdate = targetUserId && isAdmin ? targetUserId : user.id;

    // If not admin, check plan lock
    if (!isAdmin) {
      const { data: userData } = await supabase
        .from('users')
        .select('plan_locked_until')
        .eq('id', user.id)
        .single();

      if (userData?.plan_locked_until) {
        const lockDate = new Date(userData.plan_locked_until);
        if (lockDate > new Date()) {
          const formattedDate = lockDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          return NextResponse.json(
            { error: `Your plan is locked until ${formattedDate}. Plan changes are not allowed during the 1-year term.` },
            { status: 403 }
          );
        }
      }
    }

    // Build update data
    const updateData: any = {
      subscription_plan: planId,
      commission_plan: planName,
      updated_at: new Date().toISOString(),
    };

    // Update cap amount based on plan
    if (PLAN_CAPS[planId] !== undefined) {
      updateData.cap_amount = PLAN_CAPS[planId];
    }

    // If admin is changing another user's plan, also reset their lock if needed
    if (isAdmin && targetUserId) {
      // Admin can optionally reset the lock — for now we just update the plan
      // If you want to also reset the lock: updateData.plan_locked_until = null;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userToUpdate);

    if (updateError) {
      console.error('Error updating plan:', updateError);
      return NextResponse.json(
        { error: 'Failed to update plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: targetUserId && isAdmin
        ? `Plan updated to ${planName} for user`
        : 'Plan updated successfully',
    });
  } catch (error: any) {
    console.error('Error in update-plan:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
