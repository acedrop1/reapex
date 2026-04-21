'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Typography,
  Chip,
} from '@mui/material';
import { Business, Star } from '@mui/icons-material';
import { Bed, Bathtub, Ruler } from '@phosphor-icons/react';
import Link from 'next/link';
import Image from 'next/image';
import ReviewsList from '@/components/agents/ReviewsList';
import LeaveReviewModal from '@/components/agents/LeaveReviewModal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`agent-tabpanel-${index}`}
      aria-labelledby={`agent-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface AgentProfileTabsProps {
  listings: any[];
  reviews: any[];
  agentId: string;
  agentName: string;
}

export default function AgentProfileTabs({ listings, reviews, agentId, agentName }: AgentProfileTabsProps) {
  const [tabValue, setTabValue] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      {/* Tabs */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: '#2a2a2a',
          marginBottom: '24px',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="agent profile tabs"
          sx={{
            '& .MuiTab-root': {
              color: '#999999',
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              paddingX: '24px',
              '&.Mui-selected': {
                color: '#d4af37',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#d4af37',
              height: '3px',
            },
          }}
        >
          <Tab label={`Listings (${listings.length})`} />
          <Tab label={`Reviews (${reviews.length})`} />
        </Tabs>
      </Box>

      {/* Listings Tab Panel */}
      <TabPanel value={tabValue} index={0}>
        {listings && listings.length > 0 ? (
          <Grid container spacing={3}>
            {listings.map((listing: any) => (
              <Grid item xs={12} sm={6} md={4} key={listing.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#d4af37',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px 0 rgba(212, 175, 55, 0.2)',
                    },
                  }}
                >
                  {/* Property Image */}
                  <Box sx={{ position: 'relative', width: '100%', height: 200 }}>
                    {listing.cover_image ? (
                      <Image
                        src={listing.cover_image}
                        alt={listing.property_address}
                        fill
                        style={{ objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                      />
                    ) : listing.images && listing.images.length > 0 ? (
                      <Image
                        src={listing.images[0]}
                        alt={listing.property_address}
                        fill
                        style={{ objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: '100%',
                          backgroundColor: '#F5F5F5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '12px 12px 0 0',
                        }}
                      >
                        <Business sx={{ fontSize: 64, color: '#E0E0E0' }} />
                      </Box>
                    )}

                    {/* Featured Badge */}
                    {listing.featured && (
                      <Chip
                        label="FEATURED"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          backgroundColor: '#d4af37',
                          color: '#0a0a0a',
                          fontWeight: 700,
                          fontSize: '11px',
                          height: '24px',
                        }}
                      />
                    )}

                    {/* For Sale/Rent Badge */}
                    <Chip
                      label={listing.listing_type === 'for_sale' ? 'FOR SALE' : 'FOR RENT'}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        backgroundColor: '#d4af37',
                        color: '#0a0a0a',
                        fontWeight: 700,
                        fontSize: '11px',
                        height: '24px',
                      }}
                    />
                  </Box>

                  <CardContent sx={{ flexGrow: 1, padding: '16px' }}>
                    {/* Price */}
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        fontWeight: 700,
                        color: '#d4af37',
                        fontSize: '20px',
                      }}
                    >
                      {listing.listing_type === 'for_rent' && listing.monthly_rental
                        ? `$${listing.monthly_rental.toLocaleString()}/mo`
                        : `$${listing.price?.toLocaleString() || 'N/A'}`}
                    </Typography>

                    {/* Title or Address */}
                    <Typography
                      variant="body1"
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        color: '#ffffff',
                        fontSize: '16px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {listing.title || listing.property_address}
                    </Typography>

                    {/* Location */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      sx={{ color: '#999999', mb: 2 }}
                    >
                      {listing.property_city}, {listing.property_state}
                    </Typography>

                    {/* Property Details */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                      {listing.bedrooms && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bed size={16} weight="duotone" color="#d4af37" />
                          <Typography variant="body2" sx={{ color: '#ffffff' }}>
                            {listing.bedrooms} {listing.bedrooms === 1 ? 'Bed' : 'Beds'}
                          </Typography>
                        </Box>
                      )}
                      {listing.bathrooms && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Bathtub size={16} weight="duotone" color="#d4af37" />
                          <Typography variant="body2" sx={{ color: '#ffffff' }}>
                            {listing.bathrooms} {listing.bathrooms === 1 ? 'Bath' : 'Baths'}
                          </Typography>
                        </Box>
                      )}
                      {listing.square_feet && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Ruler size={16} weight="duotone" color="#d4af37" />
                          <Typography variant="body2" sx={{ color: '#ffffff' }}>
                            {listing.square_feet.toLocaleString()} Sq Ft
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Button
                      variant="outlined"
                      fullWidth
                      component={Link}
                      href={`/listings/${listing.property_city}/${listing.slug}`}
                      sx={{
                        mt: 2,
                        borderColor: '#2a2a2a',
                        color: '#ffffff',
                        borderRadius: '8px',
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#d4af37',
                          backgroundColor: 'rgba(212, 175, 55, 0.1)',
                          color: '#d4af37',
                        },
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box
            sx={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
            }}
          >
            <Business sx={{ fontSize: 64, color: '#2a2a2a', marginBottom: '16px' }} />
            <Typography variant="h6" sx={{ color: '#d4af37', marginBottom: '8px' }}>
              No listings available
            </Typography>
            <Typography variant="body2" sx={{ color: '#999999' }}>
              This agent doesn't have any active listings at this time.
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Reviews Tab Panel */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<Star />}
            onClick={() => setReviewModalOpen(true)}
            sx={{
              backgroundColor: '#d4af37',
              color: '#0a0a0a',
              px: 3,
              py: 1.5,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#c49d2f',
              },
            }}
          >
            Leave a Review
          </Button>
        </Box>
        <ReviewsList reviews={reviews} />
      </TabPanel>

      {/* Leave Review Modal */}
      <LeaveReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        agentId={agentId}
        agentName={agentName}
      />
    </>
  );
}
