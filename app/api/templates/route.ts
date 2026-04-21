import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import { isAdmin as checkIsAdmin } from '@/lib/utils/auth';

// GET /api/templates - List all active templates or all templates (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Check if user is admin (admin or admin_agent)
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = checkIsAdmin(userProfile?.role);

    // Build query
    let query = supabase
      .from('canva_templates')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Only show active templates for non-admins
    if (!isAdmin || !includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Resolve preview_image_url: convert Supabase storage paths to full public URLs
    // Paths starting with '/' (e.g. /images/...) or 'http' are already usable — leave them.
    // Anything else (e.g. 'marketing/1234-img.png') is a storage path in the 'documents' bucket.
    const resolvedTemplates = (templates ?? []).map((template) => {
      const raw = template.preview_image_url;
      if (!raw || raw.startsWith('/') || raw.startsWith('http')) {
        return template;
      }
      const { data } = supabase.storage.from('documents').getPublicUrl(raw);
      return { ...template, preview_image_url: data.publicUrl };
    });

    return NextResponse.json({ data: resolvedTemplates });
  } catch (error) {
    console.error('Error in GET /api/templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/templates - Create a new template (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
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

    if (!userProfile || !checkIsAdmin(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      template_id,
      preview_image_url,
      canva_url,
      field_mappings,
      is_active,
      display_order,
    } = body;

    // Validate required fields
    if (!name || !category || !template_id || !canva_url) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, template_id, canva_url' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['business_card', 'property_flyer', 'yard_sign', 'social_media'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert template
    const { data: template, error } = await supabase
      .from('canva_templates')
      .insert({
        name,
        description: description || null,
        category,
        template_id,
        preview_image_url: preview_image_url || null,
        canva_url,
        field_mappings: field_mappings || {},
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
