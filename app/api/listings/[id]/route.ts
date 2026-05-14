import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Convert string numbers to correct types
    const updates: any = { ...body };
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.bedrooms) updates.bedrooms = parseInt(updates.bedrooms);
    if (updates.bathrooms) updates.bathrooms = parseInt(updates.bathrooms);
    if (updates.garages) updates.garages = parseInt(updates.garages);
    if (updates.square_feet) updates.square_feet = parseInt(updates.square_feet);

    // Get user role to check permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Build query based on role
    let query = supabase
      .from('listings')
      .update(updates)
      .eq('id', params.id);

    // If not admin, restrict to own listings
    if (userData?.role !== 'admin') {
      query = query.eq('agent_id', user.id);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Error updating listing:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({
        error: 'Listing not found or you do not have permission to edit it'
      }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in PUT /api/listings/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH is an alias for PUT - both do partial updates
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Build query based on role
    let query = supabase
      .from('listings')
      .delete()
      .eq('id', params.id);

    // If not admin, restrict to own listings
    if (userData?.role !== 'admin') {
      query = query.eq('agent_id', user.id);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
