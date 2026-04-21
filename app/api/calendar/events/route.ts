import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, start_date, end_date, event_type, source } = body;

        if (!title || !start_date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('calendar_events')
            .insert({
                agent_id: user.id,
                title,
                description,
                start_date,
                end_date,
                event_type: event_type || 'appointment',
                source: source || 'task',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, event: data });
    } catch (error: any) {
        console.error('Error creating event:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create event' },
            { status: 500 }
        );
    }
}
