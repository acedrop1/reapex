'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  MagnifyingGlass as SearchIcon,
  Tag as TagIcon,
  Check as CheckIcon,
  X as XIcon,
} from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  event_type: string;
  event_category?: string;
  google_event_id?: string;
  google_metadata?: any;
}

interface CategoryAssignmentModalProps {
  open: boolean;
  onClose: () => void;
}

const EVENT_CATEGORIES = [
  { value: 'tasks', label: 'Tasks & Appointments', color: '#C4A43B' },
  { value: 'showings', label: 'Property Showings', color: '#E2C05A' },
  { value: 'transactions', label: 'Transaction Dates', color: '#2e7d32' },
  { value: 'deals', label: 'Deal Milestones', color: '#c49d2f' },
  { value: 'company_events', label: 'Company Events', color: '#ed6c02' },
  { value: 'personal', label: 'Personal Events', color: '#757575' },
];

export default function CategoryAssignmentModal({ open, onClose }: CategoryAssignmentModalProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [bulkCategoryAssignments, setBulkCategoryAssignments] = useState<Record<string, string>>(
    {}
  );

  // Fetch all Google Calendar events without category
  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events-uncategorized'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('agent_id', user.id)
        .not('google_event_id', 'is', null)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as Event[];
    },
    enabled: open,
  });

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    return events.filter((event) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === '' || event.event_category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [events, searchQuery, selectedCategory]);

  // Group events by category
  const categorizedEvents = useMemo(() => {
    const groups: Record<string, Event[]> = {
      uncategorized: [],
      tasks: [],
      showings: [],
      transactions: [],
      deals: [],
      company_events: [],
      personal: [],
    };

    filteredEvents.forEach((event) => {
      const category = event.event_category || 'uncategorized';
      if (groups[category]) {
        groups[category].push(event);
      } else {
        groups.uncategorized.push(event);
      }
    });

    return groups;
  }, [filteredEvents]);

  // Update event category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ eventId, category }: { eventId: string; category: string }) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({ event_category: category })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events-uncategorized'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  // Bulk update categories mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (assignments: Record<string, string>) => {
      const updates = Object.entries(assignments).map(([eventId, category]) =>
        supabase
          .from('calendar_events')
          .update({ event_category: category })
          .eq('id', eventId)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events-uncategorized'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setBulkCategoryAssignments({});
    },
  });

  const handleCategoryChange = (eventId: string, category: string) => {
    setBulkCategoryAssignments((prev) => ({
      ...prev,
      [eventId]: category,
    }));
  };

  const handleApplyBulkChanges = () => {
    if (Object.keys(bulkCategoryAssignments).length > 0) {
      bulkUpdateMutation.mutate(bulkCategoryAssignments);
    }
  };

  const handleQuickAssign = (eventId: string, category: string) => {
    updateCategoryMutation.mutate({ eventId, category });
  };

  const getCategoryColor = (category?: string) => {
    const cat = EVENT_CATEGORIES.find((c) => c.value === category);
    return cat?.color || '#757575';
  };

  const getCategoryLabel = (category?: string) => {
    const cat = EVENT_CATEGORIES.find((c) => c.value === category);
    return cat?.label || 'Uncategorized';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TagIcon size={24} weight="bold" />
          <Typography variant="h6">Categorize Calendar Events</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Assign categories to your Google Calendar events to better organize and filter them in
            Reapex. Changes are saved to your Reapex calendar only.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Filter by Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {EVENT_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    <Chip
                      label={cat.label}
                      size="small"
                      sx={{
                        backgroundColor: cat.color,
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {Object.keys(bulkCategoryAssignments).length > 0 && (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleApplyBulkChanges}
                  disabled={bulkUpdateMutation.isPending}
                >
                  {bulkUpdateMutation.isPending ? <CircularProgress size={16} /> : 'Apply Changes'}
                </Button>
              }
            >
              {Object.keys(bulkCategoryAssignments).length} event(s) pending category updates
            </Alert>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No events found matching your search.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Event Title</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Current Category</TableCell>
                  <TableCell>New Category</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents.map((event) => {
                  const pendingCategory = bulkCategoryAssignments[event.id];
                  const currentCategory = event.event_category;

                  return (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {event.title}
                        </Typography>
                        {event.description && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {event.description.substring(0, 50)}
                            {event.description.length > 50 ? '...' : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(event.start_date), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getCategoryLabel(currentCategory)}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryColor(currentCategory),
                            color: 'white',
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={pendingCategory || currentCategory || ''}
                            onChange={(e) => handleCategoryChange(event.id, e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Uncategorized</em>
                            </MenuItem>
                            {EVENT_CATEGORIES.map((cat) => (
                              <MenuItem key={cat.value} value={cat.value}>
                                <Chip
                                  label={cat.label}
                                  size="small"
                                  sx={{
                                    backgroundColor: cat.color,
                                    color: 'white',
                                    fontWeight: 500,
                                  }}
                                />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        {pendingCategory && pendingCategory !== currentCategory && (
                          <Tooltip title="Apply Now">
                            <IconButton
                              size="small"
                              onClick={() => handleQuickAssign(event.id, pendingCategory)}
                              disabled={updateCategoryMutation.isPending}
                              color="primary"
                            >
                              <CheckIcon size={18} weight="bold" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {pendingCategory && (
                          <Tooltip title="Cancel">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const newAssignments = { ...bulkCategoryAssignments };
                                delete newAssignments[event.id];
                                setBulkCategoryAssignments(newAssignments);
                              }}
                            >
                              <XIcon size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {Object.keys(bulkCategoryAssignments).length > 0 && (
          <Button
            variant="contained"
            onClick={handleApplyBulkChanges}
            disabled={bulkUpdateMutation.isPending}
            startIcon={bulkUpdateMutation.isPending ? <CircularProgress size={16} /> : <CheckIcon />}
          >
            Apply All Changes
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
