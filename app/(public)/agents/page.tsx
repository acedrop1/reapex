import { createServerComponentClient } from '@/lib/supabase/server';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  Avatar,
  Button,
  Rating,
  Chip,
} from '@mui/material';
import { Phone, Email } from '@mui/icons-material';
import Link from 'next/link';
import type { Metadata } from 'next';
import Script from 'next/script';
import { generateOrganizationSchema, generateBreadcrumbSchema } from '@/lib/seo/jsonLd';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meet Reapex Advisors | Expert Real Estate Agents',
  description: 'Connect with elite real estate advisors. Our expert agents deliver personalized guidance, market insights, and proven results. Find your trusted advisor today.',
  keywords: ['real estate agents', 'realtors', 'real estate advisors', 'property experts', 'top agents', 'Reapex agents'],
  openGraph: {
    title: 'Meet Reapex Advisors | Expert Real Estate Agents',
    description: 'Connect with elite real estate advisors. Our expert agents deliver personalized guidance, market insights, and proven results.',
    url: 'https://reapex.com/agents',
    siteName: 'Reapex',
    images: [
      {
        url: '/images/og-image.jpeg',
        width: 1200,
        height: 630,
        alt: 'Reapex - Meet Our Expert Advisors',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet Reapex Advisors | Expert Real Estate Agents',
    description: 'Connect with elite real estate advisors. Our expert agents deliver personalized guidance, market insights, and proven results.',
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

const getInitials = (fullName: string): string => {
  const names = fullName.trim().split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

export default async function AgentsPage() {
  const supabase = await createServerComponentClient();

  // Get all approved agents (including brokers and admins), excluding hidden
  const { data: agents, error } = await supabase
    .from('users')
    .select('*')
    .in('role', ['agent', 'admin'])
    .eq('account_status', 'approved')
    .eq('hide_from_listing', false)
    .order('display_order', { ascending: true })
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching agents:', error);
  }

  // Fetch rating stats for all agents
  const { data: ratingsData } = await supabase
    .from('agent_ratings_summary')
    .select('*');

  // Create a map of agent ratings
  const ratingsMap = new Map();
  if (ratingsData) {
    ratingsData.forEach((rating: any) => {
      ratingsMap.set(rating.agent_id, rating);
    });
  }

  const organizationSchema = generateOrganizationSchema();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://reapex.com' },
    { name: 'Agents', url: 'https://reapex.com/agents' },
  ]);

  return (
    <Box sx={{ backgroundColor: '#0a0a0a', pt: 16, pb: 8 }}>
      {/* JSON-LD Structured Data */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
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
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            Meet the Reapex Advisors
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#999999',
            }}
          >
            Expert guidance for every step of your real estate journey
          </Typography>
        </Box>

        {/* Agents Grid */}
        {agents && agents.length > 0 ? (
          <Grid container spacing={4}>
            {agents.map((agent: any) => {
              const ratingStats = ratingsMap.get(agent.id);
              const averageRating = ratingStats?.average_rating || 0;
              const totalReviews = ratingStats?.total_reviews || 0;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={agent.id}>
                  <Link
                    href={`/agent/${agent.slug}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <Card
                      sx={{
                        height: 400,
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 40px rgba(212, 175, 55, 0.4)',
                          '& .agent-overlay': {
                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)',
                          },
                          '& .agent-button': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.5)',
                          },
                        },
                      }}
                    >
                      {/* Background Image */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundImage: agent.headshot_url
                            ? `url(${agent.headshot_url})`
                            : 'linear-gradient(135deg, #d4af37 0%, #c49d2f 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: agent.headshot_url ? 'none' : 'brightness(0.8)',
                        }}
                      >
                        {!agent.headshot_url && (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <svg
                              width="120"
                              height="120"
                              viewBox="0 0 120 120"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {/* Head */}
                              <circle cx="60" cy="40" r="20" fill="rgba(255,255,255,0.25)" />
                              {/* Body/Shoulders */}
                              <path
                                d="M20 105C20 85 35 72 60 72C85 72 100 85 100 105"
                                fill="rgba(255,255,255,0.25)"
                              />
                            </svg>
                          </Box>
                        )}
                      </Box>

                      {/* Gradient Overlay */}
                      <Box
                        className="agent-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)',
                          transition: 'all 0.3s ease',
                        }}
                      />

                      {/* Content */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          p: 3,
                          zIndex: 1,
                        }}
                      >
                        {/* Rating Display */}
                        {totalReviews > 0 && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              mb: 2,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#ffffff',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                              }}
                            >
                              {averageRating.toFixed(1)}
                            </Typography>
                            <Rating
                              value={averageRating}
                              precision={0.1}
                              readOnly
                              size="small"
                              sx={{
                                '& .MuiRating-iconFilled': {
                                  color: '#d4af37',
                                },
                                '& .MuiRating-iconEmpty': {
                                  color: 'rgba(255,255,255,0.3)',
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'rgba(255,255,255,0.8)',
                              }}
                            >
                              ({totalReviews})
                            </Typography>
                          </Box>
                        )}

                        {/* Glassmorphic Name Button */}
                        <Box
                          className="agent-button"
                          sx={{
                            background: 'rgba(212, 175, 55, 0.15)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            }}
                          >
                            {agent.full_name}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Link>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box
            sx={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
            }}
          >
            <Typography variant="body1" sx={{ color: '#999999' }}>
              No agents available at this time.
            </Typography>
          </Box>
        )}

      </Container>
    </Box>
  );
}
