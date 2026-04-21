'use client';

import { Box, Typography, Grid } from '@mui/material';
import {
  CheckCircle,
} from '@phosphor-icons/react';

interface ListingFeaturesProps {
  features: Record<string, any>;
}

// Helper function to format feature names into human-readable labels
function formatFeatureName(key: string): string {
  // Handle common abbreviations and patterns
  const replacements: Record<string, string> = {
    'AC': 'Air Conditioning',
    'HVAC': 'Heating & Cooling',
    'HOA': 'HOA',
    'MLS': 'MLS',
    'Sq_ft': 'Square Feet',
    'Sqft': 'Square Feet',
    'Yr': 'Year',
    'Num': 'Number',
    'Bldg': 'Building',
    'Apt': 'Apartment',
    'Condo': 'Condominium',
  };

  // Replace underscores and add spaces before capital letters
  let formatted = key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();

  // Apply specific replacements
  Object.entries(replacements).forEach(([abbrev, full]) => {
    const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
    formatted = formatted.replace(regex, full);
  });

  // Capitalize first letter of each word
  formatted = formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted;
}

export default function ListingFeatures({ features }: ListingFeaturesProps) {
  if (!features || typeof features !== 'object' || Object.keys(features).length === 0) {
    return null;
  }

  const featureEntries = Object.entries(features).filter(([key, value]) => {
    // Exclude database/metadata fields and agent-related information
    const excludedFields = [
      'Agent_email',
      'Agent_phone',
      'Agent_name',
      'Agent_id',
      'Lot_area_units',
      'id',
      'created_at',
      'updated_at',
      'listing_id',
      'agent_id',
      'mls_number',
      'status',
    ];

    // Check if field should be excluded
    const shouldExclude = excludedFields.some(excluded =>
      key.toLowerCase().includes(excluded.toLowerCase())
    );

    if (shouldExclude) {
      return false;
    }

    // Only include if value is true or a non-'None' string
    return value === true || (typeof value === 'string' && value !== 'None' && value !== '');
  });

  if (featureEntries.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Property Features
      </Typography>
      <Grid container spacing={2}>
        {featureEntries.map(([key, value]) => {
          const formattedLabel = formatFeatureName(key);

          return (
            <Grid item xs={12} sm={6} key={key}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 0.5,
                }}
              >
                <CheckCircle size={20} weight="duotone" style={{ color: '#ffffff', flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                  {formattedLabel}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
