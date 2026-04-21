import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'text/plain',
      'text/csv',
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Allowed: PDF, Word, Excel, images, text, CSV.',
        },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify contact exists and user owns it (or is admin)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, agent_id, file_urls, attachment_names, attachment_metadata')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Check permissions - user must own contact or be admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';
    const ownsContact = contact.agent_id === user.id;

    if (!isAdmin && !ownsContact) {
      return NextResponse.json(
        { error: 'Not authorized to upload files for this contact' },
        { status: 403 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedName}`;
    const filePath = `${contactId}/${fileName}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('contact-documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('contact-documents')
      .getPublicUrl(filePath);

    // Update contact record with new file info
    const fileUrls = [...(contact.file_urls || []), publicUrl];
    const attachmentNames = [...(contact.attachment_names || []), file.name];
    const attachmentMetadata = contact.attachment_metadata || {};
    attachmentMetadata[publicUrl] = {
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.id,
    };

    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        file_urls: fileUrls,
        attachment_names: attachmentNames,
        attachment_metadata: attachmentMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    if (updateError) {
      console.error('Error updating contact with file info:', updateError);
      // File uploaded but contact update failed - we should still return success
      // The file exists in storage and can be accessed
    }

    return NextResponse.json(
      {
        url: publicUrl,
        name: file.name,
        path: filePath,
        size: file.size,
        type: file.type,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/contacts/[id]/upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a file attachment
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id;
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('fileUrl');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify contact exists and user owns it (or is admin)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, agent_id, file_urls, attachment_names, attachment_metadata')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Check permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';
    const ownsContact = contact.agent_id === user.id;

    if (!isAdmin && !ownsContact) {
      return NextResponse.json(
        { error: 'Not authorized to delete files for this contact' },
        { status: 403 }
      );
    }

    // Find the index of the file to remove
    const fileIndex = contact.file_urls?.indexOf(fileUrl) ?? -1;
    if (fileIndex === -1) {
      return NextResponse.json(
        { error: 'File not found in contact attachments' },
        { status: 404 }
      );
    }

    // Extract file path from URL (last part of the URL after bucket name)
    const urlParts = fileUrl.split('/contact-documents/');
    if (urlParts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid file URL format' },
        { status: 400 }
      );
    }
    const filePath = urlParts[1];

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('contact-documents')
      .remove([filePath]);

    if (deleteError) {
      console.error('Error deleting file from storage:', deleteError);
      // Continue anyway - we'll remove it from the contact record
    }

    // Update contact record - remove file info
    const fileUrls = [...(contact.file_urls || [])];
    const attachmentNames = [...(contact.attachment_names || [])];
    const attachmentMetadata = { ...(contact.attachment_metadata || {}) };

    fileUrls.splice(fileIndex, 1);
    attachmentNames.splice(fileIndex, 1);
    delete attachmentMetadata[fileUrl];

    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        file_urls: fileUrls,
        attachment_names: attachmentNames,
        attachment_metadata: attachmentMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    if (updateError) {
      console.error('Error updating contact after file deletion:', updateError);
      return NextResponse.json(
        { error: 'Failed to update contact record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/contacts/[id]/upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
