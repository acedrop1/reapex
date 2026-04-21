import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Helper function to normalize city name for URL
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Legacy Property Detail Page
 * This page now permanently redirects (301) to the new slug-based URL structure
 * Old URL: /property/[id]
 * New URL: /listings/[city]/[slug]
 */
export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createServerComponentClient();

  // Fetch listing by ID to get slug and city for redirect
  const { data: listing, error } = await supabase
    .from('listings')
    .select('slug, property_city')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (error || !listing) {
    notFound();
  }

  // Redirect to new slug-based URL with 301 (permanent redirect)
  const citySlug = normalizeCity(listing.property_city);
  redirect(`/listings/${citySlug}/${listing.slug}`);
}
