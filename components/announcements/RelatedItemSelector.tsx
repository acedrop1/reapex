'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface RelatedItemSelectorProps {
  value: {
    type: string | null;
    id: string | null;
    title: string | null;
    url: string | null;
    ctaText: string | null;
  };
  onChange: (value: {
    type: string | null;
    id: string | null;
    title: string | null;
    url: string | null;
    ctaText: string | null;
  }) => void;
}

const RELATED_TYPES = [
  { value: '', label: 'None' },
  { value: 'form', label: 'Form', defaultCta: 'View Form' },
  { value: 'marketing', label: 'Marketing Material', defaultCta: 'View Resource' },
  { value: 'listing', label: 'Listing', defaultCta: 'View Listing' },
  { value: 'event', label: 'Public Event', defaultCta: 'View Event' },
  { value: 'link', label: 'External Link', defaultCta: 'Learn More' },
  { value: 'training', label: 'Training Material', defaultCta: 'Start Training' },
];

export default function RelatedItemSelector({ value, onChange }: RelatedItemSelectorProps) {
  const supabase = createClient();
  const [selectedType, setSelectedType] = useState(value.type || '');

  // Fetch forms
  const { data: forms, isLoading: formsLoading, error: formsError } = useQuery({
    queryKey: ['forms-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('id, title, file_name')
        .order('title');

      if (error) {
        console.error('Error fetching forms:', error);
        throw error;
      }

      console.log('Loaded forms:', data?.length || 0);
      return data || [];
    },
    enabled: selectedType === 'form',
  });

  // Fetch marketing resources
  const { data: marketing, isLoading: marketingLoading, error: marketingError } = useQuery({
    queryKey: ['marketing-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokerage_documents')
        .select('id, title, description')
        .eq('category', 'marketing')
        .order('title');

      if (error) {
        console.error('Error fetching marketing:', error);
        throw error;
      }

      console.log('Loaded marketing resources:', data?.length || 0);
      return data || [];
    },
    enabled: selectedType === 'marketing',
  });

  // Fetch listings
  const { data: listings, isLoading: listingsLoading, error: listingsError } = useQuery({
    queryKey: ['listings-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, property_address, city, state')
        .eq('status', 'active')
        .order('property_address');

      if (error) {
        console.error('Error fetching listings:', error);
        throw error;
      }

      console.log('Loaded listings:', data?.length || 0);
      return data || [];
    },
    enabled: selectedType === 'listing',
  });

  // Fetch public calendar events (one week by default)
  const { data: events, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['public-events-list'],
    queryFn: async () => {
      const now = new Date();
      const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, start_date, description')
        .eq('source', 'custom')
        .is('agent_id', null) // Public events (brokerage-wide)
        .gte('start_date', now.toISOString())
        .lte('start_date', oneWeekLater.toISOString())
        .order('start_date');

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      console.log('Loaded events (next week):', data?.length || 0);
      return data || [];
    },
    enabled: selectedType === 'event',
  });

  // Fetch training materials
  const { data: training, isLoading: trainingLoading, error: trainingError } = useQuery({
    queryKey: ['training-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokerage_documents')
        .select('id, title, description')
        .eq('category', 'training')
        .order('title');

      if (error) {
        console.error('Error fetching training:', error);
        throw error;
      }

      console.log('Loaded training materials:', data?.length || 0);
      return data || [];
    },
    enabled: selectedType === 'training',
  });

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);

    const defaultCta = RELATED_TYPES.find(t => t.value === newType)?.defaultCta || '';

    onChange({
      type: newType || null,
      id: null,
      title: null,
      url: null,
      ctaText: defaultCta || null,
    });
  };

  const handleItemSelect = (item: any, type: string) => {
    let itemTitle = '';
    let itemUrl = '';

    switch (type) {
      case 'form':
        itemTitle = item.title;
        itemUrl = `/dashboard/forms`; // Will filter to specific form
        break;
      case 'marketing':
        itemTitle = item.title;
        itemUrl = `/dashboard/marketing`;
        break;
      case 'listing':
        itemTitle = `${item.property_address}, ${item.city}, ${item.state}`;
        itemUrl = `/listings/${item.city.toLowerCase().replace(/\s+/g, '-')}/${item.id}`;
        break;
      case 'event':
        itemTitle = item.title;
        itemUrl = `/calendar`;
        break;
      case 'training':
        itemTitle = item.title;
        itemUrl = `/dashboard/training`;
        break;
    }

    onChange({
      ...value,
      id: item.id,
      title: itemTitle,
      url: itemUrl,
    });
  };

  const getOptions = () => {
    switch (selectedType) {
      case 'form':
        return forms || [];
      case 'marketing':
        return marketing || [];
      case 'listing':
        return listings || [];
      case 'event':
        return events || [];
      case 'training':
        return training || [];
      default:
        return [];
    }
  };

  const getOptionLabel = (option: any) => {
    if (!option) return '';

    switch (selectedType) {
      case 'form':
        return option.title;
      case 'marketing':
      case 'training':
        return option.title;
      case 'listing':
        return `${option.property_address}, ${option.city}, ${option.state}`;
      case 'event':
        return `${option.title} (${new Date(option.start_date).toLocaleDateString()})`;
      default:
        return '';
    }
  };

  const isLoading = formsLoading || marketingLoading || listingsLoading || eventsLoading || trainingLoading;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ color: '#FFFFFF', fontWeight: 600, mb: 2 }}>
        Related Item (Optional)
      </Typography>
      <Typography variant="caption" sx={{ color: '#B0B0B0', display: 'block', mb: 2 }}>
        Add a call-to-action button linking to a related resource
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Related Type</InputLabel>
        <Select
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value)}
          label="Related Type"
          sx={{
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(226, 192, 90, 0.3)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#E2C05A',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#E2C05A',
            },
            '& .MuiSelect-select': {
              color: '#FFFFFF',
            },
          }}
        >
          {RELATED_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedType && selectedType !== 'link' && (
        <Box sx={{ mb: 2 }}>
          <Autocomplete
            options={getOptions()}
            getOptionLabel={getOptionLabel}
            loading={isLoading}
            value={value.id ? getOptions().find((opt: any) => opt.id === value.id) : null}
            onChange={(_, newValue) => {
              if (newValue) {
                handleItemSelect(newValue, selectedType);
              } else {
                onChange({ ...value, id: null, title: null, url: null });
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={`Select ${RELATED_TYPES.find(t => t.value === selectedType)?.label}`}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(226, 192, 90, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#E2C05A',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#E2C05A',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#B0B0B0',
                  },
                  '& .MuiInputBase-input': {
                    color: '#FFFFFF',
                  },
                }}
              />
            )}
          />
          {!isLoading && (
            <Typography variant="caption" sx={{ color: '#757575', mt: 0.5, display: 'block' }}>
              {getOptions().length === 0
                ? `No ${RELATED_TYPES.find(t => t.value === selectedType)?.label.toLowerCase()} found`
                : `${getOptions().length} ${RELATED_TYPES.find(t => t.value === selectedType)?.label.toLowerCase()}${getOptions().length === 1 ? '' : 's'} available${selectedType === 'event' ? ' (next 7 days)' : ''}`}
              {selectedType === 'event' && ' - Type to search all events'}
            </Typography>
          )}
        </Box>
      )}

      {selectedType === 'link' && (
        <>
          <TextField
            fullWidth
            label="Link Title"
            value={value.title || ''}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(226, 192, 90, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: '#E2C05A',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#E2C05A',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#B0B0B0',
              },
              '& .MuiInputBase-input': {
                color: '#FFFFFF',
              },
            }}
          />
          <TextField
            fullWidth
            label="URL"
            value={value.url || ''}
            onChange={(e) => onChange({ ...value, url: e.target.value })}
            placeholder="https://example.com"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(226, 192, 90, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: '#E2C05A',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#E2C05A',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#B0B0B0',
              },
              '& .MuiInputBase-input': {
                color: '#FFFFFF',
              },
            }}
          />
        </>
      )}

      {selectedType && (
        <TextField
          fullWidth
          label="CTA Button Text (Optional)"
          value={value.ctaText || ''}
          onChange={(e) => onChange({ ...value, ctaText: e.target.value })}
          placeholder={RELATED_TYPES.find(t => t.value === selectedType)?.defaultCta || 'Learn More'}
          helperText="Leave empty to use default text"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(226, 192, 90, 0.3)',
              },
              '&:hover fieldset': {
                borderColor: '#E2C05A',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#E2C05A',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#B0B0B0',
            },
            '& .MuiInputBase-input': {
              color: '#FFFFFF',
            },
            '& .MuiFormHelperText-root': {
              color: '#757575',
            },
          }}
        />
      )}
    </Box>
  );
}
