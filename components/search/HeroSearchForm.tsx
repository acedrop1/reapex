'use client';

import { useState } from 'react';
import { Box, Grid, FormControl, Select, MenuItem, Button, Chip } from '@mui/material';
import { Search } from '@mui/icons-material';
import { House, Buildings, Storefront, User, CurrencyDollar, MagnifyingGlass } from 'phosphor-react';

interface HeroSearchFormProps {
  cities: string[];
}

export function HeroSearchForm({ cities }: HeroSearchFormProps) {
  const [listingType, setListingType] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const propertyTypeLabels: Record<string, { label: string; icon: JSX.Element }> = {
    '': { label: 'All Properties', icon: <Buildings size={18} weight="duotone" /> },
    'for_rent': { label: 'For Rent', icon: <User size={18} weight="duotone" /> },
    'for_sale': { label: 'For Sale', icon: <House size={18} weight="duotone" /> },
  };

  const propertyLabels: Record<string, { label: string; icon: JSX.Element }> = {
    '': { label: 'All Types', icon: <Buildings size={18} weight="duotone" /> },
    'house': { label: 'Houses', icon: <House size={18} weight="duotone" /> },
    'townhome': { label: 'Townhomes', icon: <Buildings size={18} weight="duotone" /> },
    'multi_family': { label: 'Multi-family', icon: <Buildings size={18} weight="duotone" /> },
    'condo': { label: 'Condos/Co-ops', icon: <Buildings size={18} weight="duotone" /> },
    'apartment': { label: 'Apartments', icon: <Buildings size={18} weight="duotone" /> },
    'commercial': { label: 'Commercial', icon: <Storefront size={18} weight="duotone" /> },
    'business': { label: 'Business', icon: <Storefront size={18} weight="duotone" /> },
    'mixed_use': { label: 'Mixed-Use', icon: <Buildings size={18} weight="duotone" /> },
  };

  return (
    <Box sx={{ width: '70%', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Chip
          icon={<MagnifyingGlass size={18} weight="bold" />}
          label="Search the Reapex Collection"
          onClick={() => setShowSearch(!showSearch)}
          sx={{
            backgroundColor: 'rgba(26, 26, 26, 0.9)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#ffffff',
            fontWeight: 600,
            px: 1,
            py: 2.5,
            fontSize: '0.9rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '& .MuiChip-icon': {
              color: '#ffffff',
            },
            '&:hover': {
              backgroundColor: 'rgba(40, 40, 40, 0.95)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
              transform: 'translateY(-2px)',
            },
          }}
        />
      </Box>
      {showSearch && (
      <Box
        component="form"
        action="/listings"
        method="get"
        sx={{
          background: 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: 5,
          p: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <FormControl
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#ffffff',
                '& .MuiSelect-select': {
                  padding: '10px 12px',
                },
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ffffff',
                },
              },
            }}
          >
            <Select
              name="listing_type"
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              displayEmpty
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 300,
                    mt: 1,
                  }
                }
              }}
              renderValue={(value) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: value ? '#1a1a1a' : '#666666' }}>
                  {propertyTypeLabels[value as string]?.icon}
                  {propertyTypeLabels[value as string]?.label}
                </Box>
              )}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Buildings size={18} weight="duotone" />
                  All Properties
                </Box>
              </MenuItem>
              <MenuItem value="for_rent">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <User size={18} weight="duotone" />
                  For Rent
                </Box>
              </MenuItem>
              <MenuItem value="for_sale">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <House size={18} weight="duotone" />
                  For Sale
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#ffffff',
                '& .MuiSelect-select': {
                  padding: '10px 12px',
                },
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ffffff',
                },
              },
            }}
          >
            <Select
              name="type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              displayEmpty
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 300,
                    mt: 1,
                  }
                }
              }}
              renderValue={(value) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: value ? '#1a1a1a' : '#666666' }}>
                  {propertyLabels[value as string]?.icon}
                  {propertyLabels[value as string]?.label}
                </Box>
              )}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Buildings size={18} weight="duotone" />
                  All Types
                </Box>
              </MenuItem>
              <MenuItem value="house">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <House size={18} weight="duotone" />
                  Houses
                </Box>
              </MenuItem>
              <MenuItem value="townhome">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Buildings size={18} weight="duotone" />
                  Townhomes
                </Box>
              </MenuItem>
              <MenuItem value="multi_family">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Buildings size={18} weight="duotone" />
                  Multi-family
                </Box>
              </MenuItem>
              <MenuItem value="condo">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Buildings size={18} weight="duotone" />
                  Condos/Co-ops
                </Box>
              </MenuItem>
              <MenuItem value="apartment">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Buildings size={18} weight="duotone" />
                  Apartments
                </Box>
              </MenuItem>
              <MenuItem value="commercial">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Storefront size={18} weight="duotone" />
                  Commercial
                </Box>
              </MenuItem>
              <MenuItem value="business">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Storefront size={18} weight="duotone" />
                  Business
                </Box>
              </MenuItem>
              <MenuItem value="mixed_use">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Buildings size={18} weight="duotone" />
                  Mixed-Use
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#ffffff',
                '& .MuiSelect-select': {
                  padding: '10px 12px',
                },
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#ffffff',
                },
              },
            }}
          >
            <Select
              name="max_price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              displayEmpty
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 300,
                    mt: 1,
                  }
                }
              }}
              renderValue={(value) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: value ? '#1a1a1a' : '#666666' }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  {value ? `$${parseInt(value).toLocaleString()}` : 'Max Price'}
                </Box>
              )}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  Any Price
                </Box>
              </MenuItem>
              <MenuItem value="100000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $100,000
                </Box>
              </MenuItem>
              <MenuItem value="200000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $200,000
                </Box>
              </MenuItem>
              <MenuItem value="300000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $300,000
                </Box>
              </MenuItem>
              <MenuItem value="400000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $400,000
                </Box>
              </MenuItem>
              <MenuItem value="500000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $500,000
                </Box>
              </MenuItem>
              <MenuItem value="600000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $600,000
                </Box>
              </MenuItem>
              <MenuItem value="700000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $700,000
                </Box>
              </MenuItem>
              <MenuItem value="800000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $800,000
                </Box>
              </MenuItem>
              <MenuItem value="900000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $900,000
                </Box>
              </MenuItem>
              <MenuItem value="1000000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $1,000,000
                </Box>
              </MenuItem>
              <MenuItem value="1500000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $1,500,000
                </Box>
              </MenuItem>
              <MenuItem value="2000000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $2,000,000
                </Box>
              </MenuItem>
              <MenuItem value="2500000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $2,500,000
                </Box>
              </MenuItem>
              <MenuItem value="3000000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $3,000,000
                </Box>
              </MenuItem>
              <MenuItem value="4000000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $4,000,000
                </Box>
              </MenuItem>
              <MenuItem value="5000000">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyDollar size={18} weight="duotone" />
                  $5,000,000
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: 'rgba(26, 26, 26, 0.85)',
              color: '#ffffff',
              height: '42px',
              fontWeight: 600,
              padding: '10px 16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
              },
            }}
            startIcon={<Search />}
          >
            Search
          </Button>
        </Grid>
      </Grid>
      </Box>
      )}
    </Box>
  );
}
