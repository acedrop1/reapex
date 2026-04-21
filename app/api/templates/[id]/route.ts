import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/utils/auth';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/templates/[id] - Get a specific template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: template, error } = await supabase
      .from('canva_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      console.error('Error fetching template:', error);
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error('Error in GET /api/templates/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/templates/[id] - Update a template (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    if (!userProfile || !isAdmin(userProfile.role)) {
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

    // Validate category if provided
    if (category) {
      const validCategories = ['business_card', 'property_flyer', 'social_media'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Build update object (only include provided fields)
    const updates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (template_id !== undefined) updates.template_id = template_id;
    if (preview_image_url !== undefined) updates.preview_image_url = preview_image_url;
    if (canva_url !== undefined) updates.canva_url = canva_url;
    if (field_mappings !== undefined) updates.field_mappings = field_mappings;
    if (is_active !== undefined) updates.is_active = is_active;
    if (display_order !== undefined) updates.display_order = display_order;

    const { data: template, error } = await supabase
      .from('canva_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      console.error('Error updating template:', error);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    return NextResponse.json({ data: template });
  } catch (error) {
    console.error('Error in PUT /api/templates/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/templates/[id] - Delete a template (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    if (!userProfile || !isAdmin(userProfile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { error } = await supabase
      .from('canva_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/templates/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
