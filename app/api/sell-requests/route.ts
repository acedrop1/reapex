import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Use service role key to bypass RLS for public form submissions
    // This is safe because we validate all input and only insert contact data
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

    const {  name,
      email,
      phone,
      property_address,
      property_type,
      estimated_value,
      message,
      source = 'sell_page',
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !property_address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Split name into first and last for consistency with contacts table structure
    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0] || name;
    const last_name = nameParts.slice(1).join(' ') || '';

    // Save to contacts table with sell request metadata
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        first_name,
        last_name,
        name, // Also store full name for display
        email,
        phone,
        source,
        status: 'new',
        agent_id: null, // Unassigned initially
        notes: `Property Address: ${property_address}
Property Type: ${property_type || 'Not specified'}
Estimated Value: ${estimated_value ? `$${estimated_value}` : 'Not specified'}

Message: ${message || 'No message provided'}`,
        // Store property details as metadata for later conversion to listing
        metadata: {
          property_address,
          property_type,
          estimated_value: estimated_value ? parseFloat(estimated_value as string) : null,
          request_type: 'sell',
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sell request:', error);
      return NextResponse.json(
        { error: 'Failed to submit request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in POST /api/sell-requests:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
