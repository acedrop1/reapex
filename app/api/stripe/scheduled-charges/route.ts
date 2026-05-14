import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST — create a scheduled or recurring charge
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { agent_id, amount, description, charge_type, scheduled_date, recurrence_interval } = await req.json();

    if (!agent_id || !amount || !description || !charge_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (amount < 50) {
      return NextResponse.json({ error: 'Minimum charge is $0.50' }, { status: 400 });
    }

    // Validate charge_type
    if (!['scheduled', 'recurring'].includes(charge_type)) {
      return NextResponse.json({ error: 'Invalid charge type' }, { status: 400 });
    }

    if (charge_type === 'scheduled' && !scheduled_date) {
      return NextResponse.json({ error: 'Scheduled date is required for one-time scheduled charges' }, { status: 400 });
    }

    if (charge_type === 'recurring' && !recurrence_interval) {
      return NextResponse.json({ error: 'Recurrence interval is required for recurring charges' }, { status: 400 });
    }

    // Validate agent exists
    const { data: agent } = await supabase
      .from('users')
      .select('id, full_name, email, stripe_customer_id')
      .eq('id', agent_id)
      .single();

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (!agent.stripe_customer_id) {
      return NextResponse.json({ error: 'Agent has no card on file' }, { status: 400 });
    }

    // Calculate next_charge_date
    let next_charge_date = scheduled_date;
    if (charge_type === 'recurring' && !scheduled_date) {
      // For recurring without a start date, default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      next_charge_date = tomorrow.toISOString().split('T')[0];
    }

    const { data: record, error: insertError } = await supabase
      .from('scheduled_charges')
      .insert({
        agent_id,
        admin_id: user.id,
        amount,
        description,
        charge_type,
        scheduled_date: charge_type === 'scheduled' ? scheduled_date : null,
        recurrence_interval: charge_type === 'recurring' ? recurrence_interval : null,
        next_charge_date,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      data: record,
      message: charge_type === 'scheduled'
        ? `Charge of $${(amount / 100).toFixed(2)} scheduled for ${scheduled_date}`
        : `Recurring ${recurrence_interval} charge of $${(amount / 100).toFixed(2)} created`,
    });
  } catch (error: any) {
    console.error('Scheduled charge error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET — fetch scheduled/recurring charges
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: charges, error } = await supabase
      .from('scheduled_charges')
      .select(`
        *,
        agent:users!scheduled_charges_agent_id_fkey(full_name, email),
        admin:users!scheduled_charges_admin_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ charges });
  } catch (error: any) {
    console.error('Fetch scheduled charges error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — pause/resume/cancel a scheduled or recurring charge
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, action } = await req.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    const validActions = ['pause', 'resume', 'cancel'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      pause: 'paused',
      resume: 'active',
      cancel: 'cancelled',
    };

    const { data, error } = await supabase
      .from('scheduled_charges')
      .update({
        status: statusMap[action],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Update scheduled charge error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
