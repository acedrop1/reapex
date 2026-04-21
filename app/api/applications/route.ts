import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      licenseNumber,
      transactions12Months,
      salesVolumeRange,
      commissionPlans,
      photoIdUrl,
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!phoneNumber) missingFields.push('phoneNumber');
    if (!email) missingFields.push('email');
    if (!licenseNumber) missingFields.push('licenseNumber');
    if (transactions12Months === undefined || transactions12Months === null || transactions12Months === '') {
      missingFields.push('transactions12Months');
    }
    if (!salesVolumeRange) missingFields.push('salesVolumeRange');

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      console.error('Received data:', { firstName, lastName, phoneNumber, email, licenseNumber, transactions12Months, salesVolumeRange, commissionPlans });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields,
          details: `Please provide: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS for public submissions
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

    // Insert application
    const { data, error } = await supabase
      .from('agent_applications')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        email: email,
        license_number: licenseNumber,
        transactions_12_months: transactions12Months,
        sales_volume_range: salesVolumeRange,
        commission_plans: commissionPlans || [],
        photo_id_url: photoIdUrl || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !isAdmin(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all applications
    const { data, error } = await supabase
      .from('agent_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
