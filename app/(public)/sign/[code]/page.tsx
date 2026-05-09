import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SignRedirectPage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = await createClient();
  const { code } = params;

  // Look up the yard sign by its unique code
  const { data: sign, error } = await supabase
    .from('yard_signs')
    .select('*')
    .eq('sign_code', code.toUpperCase())
    .single();

  if (error || !sign || sign.status !== 'active') {
    return <SignNotFound />;
  }

  // Increment scan count (fire-and-forget, don't block the redirect)
  await supabase
    .from('yard_signs')
    .update({ scan_count: (sign.scan_count || 0) + 1 })
    .eq('id', sign.id);

  // Priority 1: If the sign has a listing_id, redirect to the listing page
  if (sign.listing_id) {
    const { data: listing } = await supabase
      .from('listings')
      .select('slug, property_city')
      .eq('id', sign.listing_id)
      .single();

    if (listing?.slug && listing?.property_city) {
      const city = listing.property_city
        .toLowerCase()
        .replace(/\s+/g, '-');
      redirect(`/listings/${city}/${listing.slug}`);
    }
  }

  // Priority 2: If the sign has a custom redirect URL
  if (sign.redirect_url) {
    // Ensure the URL has a protocol so redirect works for external sites
    let url = sign.redirect_url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    redirect(url);
  }

  // Priority 3: If there's an agent_id, redirect to agent page
  if (sign.agent_id) {
    const { data: agent } = await supabase
      .from('users')
      .select('slug, full_name')
      .eq('id', sign.agent_id)
      .single();

    if (agent?.slug) {
      redirect(`/agent/${agent.slug}`);
    }
  }

  // Fallback: no valid redirect target configured
  return <SignNotFound />;
}

function SignNotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'rgba(226,192,90,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Typography sx={{ fontSize: 40 }}>?</Typography>
      </Box>
      <Typography
        variant="h4"
        sx={{ color: '#FFFFFF', fontWeight: 700, mb: 1 }}
      >
        Sign Not Found
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: '#B0B0B0', mb: 4, maxWidth: 420 }}
      >
        This yard sign link is no longer active or could not be found.
        The listing may have been removed or the sign has been deactivated.
      </Typography>
      <Button
        component={Link}
        href="/"
        variant="contained"
        sx={{
          backgroundColor: '#E2C05A',
          color: '#0a0a0a',
          fontWeight: 600,
          px: 4,
          py: 1.5,
          borderRadius: '8px',
          '&:hover': { backgroundColor: '#C4A43B' },
        }}
      >
        Go to Homepage
      </Button>
    </Box>
  );
}
