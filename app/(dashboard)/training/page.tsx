'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import {
  Video,
  FilePdf,
  FileDoc,
  FilePpt,
  MagnifyingGlass,
  Tag as TagIcon,
  FileXls,
  File as FileIcon,
} from '@phosphor-icons/react';

export default function TrainingPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  const { data: resources } = useQuery({
    queryKey: ['training-resources'],
    queryFn: async () => {
      const { data } = await supabase
        .from('training_resources')
        .select('*')
        .order('created_at', { ascending: false });
      return data;
    },
  });

  // Get unique categories and tags
  const allCategories = Array.from(new Set(resources?.map((r: any) => r.category).filter(Boolean))) as string[];
  const allTags = Array.from(new Set(resources?.flatMap((r: any) => r.tags || []).filter(Boolean))) as string[];

  // Filter resources
  const filteredResources = resources?.filter((resource: any) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter;
    const matchesType = typeFilter === 'all' || resource.resource_type === typeFilter;
    const matchesTag = tagFilter === 'all' || resource.tags?.includes(tagFilter);

    return matchesSearch && matchesCategory && matchesType && matchesTag;
  }) || [];

  // Get file icon based on type
  const getFileIcon = (type: string, size = 48) => {
    const iconProps = { size, weight: 'duotone' as const };

    switch (type) {
      case 'video':
        return <Video {...iconProps} color="#E53935" />;
      case 'pdf':
        return <FilePdf {...iconProps} color="#F44336" />;
      case 'slides':
        return <FilePpt {...iconProps} color="#FF6F00" />;
      case 'spreadsheet':
        return <FileXls {...iconProps} color="#1B5E20" />;
      case 'document':
        return <FileDoc {...iconProps} color="#C4A43B" />;
      default:
        return <FileIcon {...iconProps} color="#757575" />;
    }
  };

  // Get resource URL helper
  const getResourceUrl = (resource: any) => {
    if (resource.resource_type === 'video') return resource.video_url;
    const url = resource.document_url;
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    // All training files now in documents bucket with training/ prefix
    return supabase.storage.from('documents').getPublicUrl(url).data.publicUrl;
  };

  return (
    <Container maxWidth="xl" sx={dashboardStyles.container}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#FFFFFF', fontWeight: 700 }}>
            Training & Knowledge Library
          </Typography>
          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>
            Access training videos, documents, presentations, and resources
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlass size={20} weight="duotone" color="#B0B0B0" />
                </InputAdornment>
              ),
            }}
            sx={{ ...dashboardStyles.textField, flex: 1, minWidth: 300 }}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#B0B0B0' }}>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{
                ...dashboardStyles.textField,
                '& .MuiSelect-select': { color: '#FFFFFF' },
              }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {allCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#B0B0B0' }}>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{
                ...dashboardStyles.textField,
                '& .MuiSelect-select': { color: '#FFFFFF' },
              }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="video">Videos</MenuItem>
              <MenuItem value="pdf">PDFs</MenuItem>
              <MenuItem value="slides">Presentations</MenuItem>
              <MenuItem value="spreadsheet">Spreadsheets</MenuItem>
              <MenuItem value="document">Documents</MenuItem>
            </Select>
          </FormControl>

          {allTags.length > 0 && (
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: '#B0B0B0' }}>Tag</InputLabel>
              <Select
                value={tagFilter}
                label="Tag"
                onChange={(e) => setTagFilter(e.target.value)}
                sx={{
                  ...dashboardStyles.textField,
                  '& .MuiSelect-select': { color: '#FFFFFF' },
                }}
              >
                <MenuItem value="all">All Tags</MenuItem>
                {allTags.map((tag, index) => (
                  <MenuItem key={tag} value={tag}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TagIcon size={16} color="#EDD48A" />
                      {tag}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      {/* Resource Grid - Icon Based Layout */}
      <Grid container spacing={3}>
        {filteredResources.length > 0 ? (
          filteredResources.map((resource: any) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={resource.id}>
              <Card
                component="a"
                href={getResourceUrl(resource)}
                target="_blank"
                sx={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    '& .icon-container': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      transform: 'scale(1.05)',
                    },
                    '& .title': {
                      color: '#E2C05A',
                    },
                  },
                }}
              >
                {/* Icon with subtle circular background */}
                <Box
                  className="icon-container"
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    mb: 2,
                  }}
                >
                  {getFileIcon(resource.resource_type, 40)}
                </Box>

                {/* Title */}
                <Typography
                  className="title"
                  variant="body1"
                  sx={{
                    color: '#FFFFFF',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    transition: 'color 0.2s ease',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {resource.title}
                </Typography>

                {/* Category Label (optional, subtle) */}
                {resource.category && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#808080',
                      fontSize: '0.75rem',
                      mt: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {resource.category}
                  </Typography>
                )}
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                backgroundColor: '#0D0D0D',
                borderRadius: '16px',
                border: '1px solid #2A2A2A',
              }}
            >
              <Typography variant="h6" sx={{ color: '#B0B0B0', mb: 1 }}>
                No resources found
              </Typography>
              <Typography variant="body2" sx={{ color: '#808080' }}>
                {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all' || tagFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first resource to get started'}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

    </Container>
  );
}
