import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/utils/auth';

export async function POST(request: Request) {
  try {
    // Verify admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !isAdmin(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract the file path from the public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/agent-application-documents/applications/filename.ext
    const bucketName = 'agent-application-documents';
    const pathMatch = url.match(new RegExp(`${bucketName}/(.+)$`));

    if (!pathMatch) {
      // If we can't parse it, just return the original URL
      return NextResponse.json({ signedUrl: url });
    }

    const filePath = pathMatch[1];

    const serviceClient = await createServiceRoleClient();
    const { data, error } = await serviceClient.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      // Fall back to original URL
      return NextResponse.json({ signedUrl: url });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error) {
    console.error('Error in document-url:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
