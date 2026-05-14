import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { safeParseUrl } from '@/lib/utils/errorHandler';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // In dev mode with bypass auth, use service role to bypass RLS
    const isDev = process.env.BYPASS_AUTH === 'true';
    const supabaseKey = isDev
      ? process.env.SUPABASE_SERVICE_ROLE_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey,
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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userProfile?.role === 'admin';

    console.log('[Listings API] User:', user.id);
    console.log('[Listings API] User role:', userProfile?.role);
    console.log('[Listings API] Is admin:', isAdmin);

    const body = await request.json();
    const {
      agent_id,
      property_type,
      listing_type,
      property_address,
      property_city,
      property_state,
      property_zip,
      price,
      price_period,
      bedrooms,
      bathrooms,
      garages,
      square_feet,
      description,
      featured,
      open_house,
      images,
      cover_image,
      features,
      listing_url,
      status,
    } = body;

    // If admin provided agent_id, use it; otherwise use current user
    const finalAgentId = isAdmin && agent_id ? agent_id : user.id;

    console.log('[Listings API] Requested agent_id:', agent_id);
    console.log('[Listings API] Final agent_id:', finalAgentId);
    console.log('[Listings API] Auth user ID:', user.id);
    console.log('[Listings API] Match:', finalAgentId === user.id);

    const { data, error } = await supabase
      .from('listings')
      .insert({
        agent_id: finalAgentId,
        property_type,
        listing_type,
        property_address,
        property_city,
        property_state,
        property_zip,
        price: parseFloat(price),
        price_period,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        garages: garages ? parseInt(garages) : null,
        square_feet: square_feet ? parseInt(square_feet) : null,
        description,
        featured: featured || false,
        open_house: open_house || false,
        images: images || [],
        cover_image: cover_image || null,
        features: features || [],
        listing_url: listing_url || null,
        status: status || 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
    const { id, ...updates } = body;

    // Convert string numbers to integers/floats
    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.bedrooms) updates.bedrooms = parseInt(updates.bedrooms);
    if (updates.bathrooms) updates.bathrooms = parseInt(updates.bathrooms);
    if (updates.garages) updates.garages = parseInt(updates.garages);
    if (updates.square_feet) updates.square_feet = parseInt(updates.square_feet);

    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .eq('agent_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    const url = safeParseUrl(request.url);
    if (!url) {
      return NextResponse.json({ error: 'Invalid request URL' }, { status: 400 });
    }

    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('agent_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

