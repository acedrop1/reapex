import { createServerComponentClient } from '@/lib/supabase/server';
import { Box } from '@mui/material';
import type { Metadata } from 'next';
import Script from 'next/script';
import AgentHeroSection from '@/components/home/AgentHeroSection';
import IncomeCalculator from '@/components/home/IncomeCalculator';
import CommissionTiersSummary from '@/components/home/CommissionTiersSummary';
import ModelComparison from '@/components/home/ModelComparison';
import AgentTestimonialsSection from '@/components/home/AgentTestimonialsSection';
import FeaturedAgentsSection from '@/components/home/FeaturedAgentsSection';
import AgentOnboardingFooter from '@/components/home/AgentOnboardingFooter';
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo/jsonLd';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reapex | Keep 100% of Your Commission',
  description: 'High splits. Capped costs. Real wealth. Join the agent-first platform with 100% commission plans and elite tech. Stop splitting your profits. Apply in minutes.',
  keywords: ['real estate commission', '100% commission', 'realtor', 'real estate agent', 'high commission split', 'low cap', 'Reapex'],
  openGraph: {
    title: 'Reapex | Keep 100% of Your Commission',
    description: 'High splits. Capped costs. Real wealth. Join the agent-first platform with 100% commission plans and elite tech. Stop splitting your profits. Apply in minutes.',
    url: 'https://reapex.com',
    siteName: 'Reapex',
    images: [
      {
        url: '/images/og-image.jpeg',
        width: 1200,
        height: 630,
        alt: 'Reapex - Reach Your Real Estate Apex',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reapex | Keep 100% of Your Commission',
    description: 'High splits. Capped costs. Real wealth. Join the agent-first platform with 100% commission plans and elite tech.',
    images: ['/images/og-image.jpeg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function HomePage() {
  let cities: string[] = [];
  let featuredAgents: any[] = [];

  try {
    const supabase = await createServerComponentClient();

    // Get unique cities from active listings for search bar
    const { data: citiesData, error: citiesError } = await supabase
      .from('listings')
      .select('property_city')
      .eq('status', 'active')
      .order('property_city', { ascending: true });

    if (!citiesError && citiesData) {
      // Extract unique cities and filter out null/empty values
      const uniqueCities = [...new Set(citiesData.map((item: any) => item.property_city))].filter(Boolean) as string[];
      cities = uniqueCities.sort();
    }

    // Get featured agents (3 random approved agents with headshots)
    const { data: agentsData, error: agentsError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        headshot_url,
        slug,
        specialties,
        agent_ratings_summary (
          average_rating,
          total_reviews
        )
      `)
      .in('role', ['agent', 'admin_agent'])
      .eq('account_status', 'approved')
      .not('headshot_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!agentsError && agentsData && agentsData.length > 0) {
      // Randomly select 3 agents from the fetched results
      const shuffled = [...agentsData].sort(() => Math.random() - 0.5);
      featuredAgents = shuffled.slice(0, 3);
    }
  } catch (error) {
    // If there's an error (e.g., database not connected), just use empty arrays
    console.error('Error fetching data:', error);
    cities = [];
    featuredAgents = [];
  }

  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      {/* Agent-Focused Hero Section */}
      <AgentHeroSection cities={cities} />

      {/* Income Calculator Section */}
      <Box id="income-calculator">
        <IncomeCalculator />
      </Box>

      {/* Commission Menu Section */}
      <CommissionTiersSummary />

      {/* Old vs New Model Comparison */}
      <Box id="plans">
        <ModelComparison />
      </Box>

      {/* Agent Testimonials Section */}
      <AgentTestimonialsSection />

      {/* Featured Agents Section */}
      <FeaturedAgentsSection agents={featuredAgents} />

      {/* Agent Onboarding Footer */}
      <AgentOnboardingFooter />
    </>
  );
}
