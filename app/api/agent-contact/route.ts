import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/utils/errorHandler';

// Ensure this route is treated as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const {
      agent_id,
      first_name,
      last_name,
      email,
      phone,
      message,
      source,
      contact_type,
      status
    } = body;

    // Validate required fields
    if (!agent_id || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: agent_id, email, and message are required' },
        { status: 400 }
      );
    }

    // Check if agent exists and is approved (includes both agent and admin_agent roles)
    const { data: agent, error: agentError } = await supabase
      .from('users')
      .select('id, role, account_status')
      .eq('id', agent_id)
      .in('role', ['agent', 'admin_agent'])
      .eq('account_status', 'approved')
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Invalid agent ID or agent not found' },
        { status: 404 }
      );
    }

    // Check if contact exists by email
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, phone')
      .eq('email', email)
      .maybeSingle();

    let contactId: string;
    let isNewContact = false;

    if (existingContact) {
      // Update existing contact if new data provided
      const { data: updatedContact, error: updateError } = await supabase
        .from('contacts')
        .update({
          first_name: first_name || existingContact.first_name,
          last_name: last_name || existingContact.last_name,
          phone: phone || existingContact.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingContact.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('[API /agent-contact] Error updating contact:', updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }
      contactId = updatedContact.id;
    } else {
      // Create new contact
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          first_name,
          last_name,
          email,
          phone: phone || null,
          status: status || 'new',
          source: source || 'agent_website',
          contact_type: contact_type || 'lead',
          tags: ['website-inquiry'],
        })
        .select('id')
        .single();

      if (createError) {
        console.error('[API /agent-contact] Error creating contact:', createError);
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        );
      }
      contactId = newContact.id;
      isNewContact = true;
    }

    // Create or update agent assignment
    const { error: assignmentError } = await supabase
      .from('contact_agent_assignments')
      .insert({
        contact_id: contactId,
        agent_id,
        is_primary: isNewContact, // First assignment is primary
        assigned_by: null, // Public form submission, no admin assigned
      })
      .select('id, contact_id, agent_id, is_primary, assigned_at')
      .single();

    // If assignment already exists (23505 = unique violation), that's okay
    // Contact has already contacted this agent before
    if (assignmentError && assignmentError.code !== '23505') {
      console.error('[API /agent-contact] Error creating assignment:', assignmentError);
      return NextResponse.json(
        { error: assignmentError.message },
        { status: 400 }
      );
    }

    const isExistingAssignment = assignmentError?.code === '23505';

    // Create activity record with the message
    const { error: activityError } = await supabase
      .from('contact_activities')
      .insert({
        contact_id: contactId,
        agent_id,
        activity_type: 'form_submission',
        subject: `Contact form submission from ${first_name || ''} ${last_name || ''}`.trim() || 'Contact form submission',
        body: message,
        direction: 'inbound',
        status: 'completed',
        metadata: {
          source: source || 'agent_website',
          form_data: {
            first_name,
            last_name,
            email,
            phone,
          },
          is_new_contact: isNewContact,
          is_existing_assignment: isExistingAssignment,
        },
      });

    if (activityError) {
      console.error('[API /agent-contact] Error creating activity:', activityError);
      // Don't fail the request if activity creation fails
      // Contact and assignment were created successfully
    }

    // TODO: Send email notification to agent (optional enhancement)
    // await sendAgentNotificationEmail(agent_id, contactId, isNewContact);

    return NextResponse.json({
      success: true,
      message: isNewContact
        ? 'Thank you for your message! The agent will be in touch soon.'
        : 'Thank you for your message! Your information has been updated and the agent will be in touch soon.',
      contact_id: contactId,
      is_new_contact: isNewContact,
      is_existing_assignment: isExistingAssignment,
    });
  } catch (error: any) {
    console.error('[API /agent-contact POST]', error);
    return createErrorResponse(error, 'Failed to submit contact form');
  }
}
