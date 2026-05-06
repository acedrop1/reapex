import { createServerComponentClient } from '@/lib/supabase/server';
import {
  Container,
  Box,
  Grid,
  Button,
} from '@mui/material';
import {
  ArrowBack,
} from '@mui/icons-material';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import AgentProfileHeader from '@/components/agents/AgentProfileHeader';
import AgentAboutSection from '@/components/agents/AgentAboutSection';
import AgentProfileTabs from '@/components/agents/AgentProfileTabs';
import AgentContactForm from '@/components/agents/AgentContactForm';
import { generateAgentSchema, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

export const dynamic = 'force-dynamic';

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const supabase = await createServerComponentClient();

  // Fetch agent data (including brokers)
  const { data: agent, error: agentError } = await supabase
    .from('users')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .in('role', ['agent', 'broker'])
    .eq('account_status', 'approved')
    .single();

  if (agentError || !agent) {
    notFound();
  }

  // Fetch agent's listings
  const { data: listingsData } = await supabase
    .from('listings')
    .select('*')
    .eq('agent_id', agent.id)
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });
  const listings = listingsData || [];

  // Fetch approved reviews
  const { data: reviewsData } = await supabase
    .from('agent_reviews')
    .select('*')
    .eq('agent_id', agent.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });
  const reviews = reviewsData || [];

  // Fetch rating stats
  const { data: ratingStats } = await supabase
    .from('agent_ratings_summary')
    .select('*')
    .eq('agent_id', agent.id)
    .single();

  // Generate JSON-LD structured data
  const agentSchema = generateAgentSchema({
    name: agent.full_name || agent.email,
    slug: agent.slug,
    email: agent.email,
    phone: agent.phone || undefined,
    bio: agent.bio || undefined,
    headshot_url: agent.headshot_url || undefined,
    averageRating: ratingStats?.average_rating || undefined,
    totalReviews: ratingStats?.total_reviews || undefined,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://reapex.com' },
    { name: 'Agents', url: 'https://reapex.com/agents' },
    { name: agent.full_name || agent.email, url: `https://reapex.com/agent/${agent.slug}` },
  ]);

  return (
    <Box sx={{ backgroundColor: '#0a0a0a', pt: 4, pb: 8 }}>
      {/* JSON-LD Structured Data */}
      <Script
        id="agent-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(agentSchema),
        }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <Container maxWidth="xl">
        {/* Back Button */}
        <Button
          component={Link}
          href="/agents"
          startIcon={<ArrowBack />}
          sx={{
            mb: 4,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#1a1a1a',
              color: '#d4af37',
            },
          }}
        >
          Back to Agents
        </Button>

        {/* Agent Profile Header */}
        <AgentProfileHeader
          agent={agent}
          averageRating={ratingStats?.average_rating || 0}
          totalReviews={ratingStats?.total_reviews || 0}
        />

        <Grid container spacing={4}>
          {/* Left Column - Listings and Reviews Tabs */}
          <Grid item xs={12} md={8}>
            <AgentProfileTabs
              listings={listings}
              reviews={reviews}
              agentId={agent.id}
              agentName={agent.full_name}
            />
          </Grid>

          {/* Right Column - About and Get in Touch */}
          <Grid item xs={12} md={4}>
            {/* About Section */}
            <AgentAboutSection
              agentName={agent.full_name}
              phone={agent.phone}
              website={agent.website}
              social_facebook={agent.social_facebook}
              social_instagram={agent.social_instagram}
              social_linkedin={agent.social_linkedin}
              social_tiktok={agent.social_tiktok}
              social_x={agent.social_x}
            />

            {/* Get in Touch Form - Below About */}
            <AgentContactForm
              agentId={agent.id}
              agentName={agent.full_name}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
