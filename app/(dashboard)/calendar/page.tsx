'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Container,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Button,
  Divider,
} from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import {
  CalendarBlank,
  Tag as TagIcon,
} from '@phosphor-icons/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import SyncStatusIndicator from '@/components/calendar/SyncStatusIndicator';
import CategoryAssignmentModal from '@/components/calendar/CategoryAssignmentModal';
import CreateEventModal from '@/components/calendar/CreateEventModal';
import { ArrowsClockwise } from '@phosphor-icons/react';

export default function CalendarPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showFUBEvents, setShowFUBEvents] = useState(true);
  const [showTransactionDates, setShowTransactionDates] = useState(true);
  const [showBrokerageEvents, setShowBrokerageEvents] = useState(true);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr);
    setCreateModalOpen(true);
  };


  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events', showFUBEvents, showTransactionDates, showBrokerageEvents],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch calendar events
      const { data: calendarEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .or(`agent_id.eq.${user.id},agent_id.is.null`)
        .order('start_date', { ascending: true });

      // Fetch tour appointments
      const { data: tourAppointments } = await supabase
        .from('tour_appointments')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          visitor_name,
          status,
          listings(property_address)
        `)
        .eq('agent_id', user.id)
        .order('scheduled_date', { ascending: true });

      // Transform tour appointments into calendar event format
      const tourEvents = (tourAppointments || []).map((tour: any) => ({
        source: 'tour',
        id: `tour-${tour.id}`,
        title: `Tour: ${tour.listings?.property_address || 'Property'} - ${tour.visitor_name}`,
        start_date: `${tour.scheduled_date}T${convertTo24Hour(tour.scheduled_time)}`,
        end_date: null,
        agent_id: user.id,
      }));

      // Combine both event sources
      const allEvents = [...(calendarEvents || []), ...tourEvents];

      // Filter events based on source and filters
      let filteredEvents = allEvents;

      if (!showFUBEvents) {
        filteredEvents = filteredEvents.filter(e => e.source !== 'task' && e.source !== 'tour');
      }
      if (!showTransactionDates) {
        filteredEvents = filteredEvents.filter(e => e.source !== 'transaction');
      }
      if (!showBrokerageEvents) {
        filteredEvents = filteredEvents.filter(e => e.source !== 'custom' || e.agent_id !== null);
      }

      // Transform to FullCalendar format
      return filteredEvents.map((event: any) => ({
        id: event.id,
        title: event.title,
        start: event.start_date,
        end: event.end_date,
        allDay: !event.end_date,
        backgroundColor: getEventColor(event.source),
        borderColor: getEventColor(event.source),
      }));
    },
  });

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') {
      hours = modifier === 'AM' ? '00' : '12';
    } else {
      hours = modifier === 'PM' ? String(parseInt(hours, 10) + 12) : hours.padStart(2, '0');
    }

    return `${hours}:${minutes || '00'}:00`;
  };

  const getEventColor = (source: string) => {
    switch (source) {
      case 'task':
        return '#E2C05A'; // Gold for tasks
      case 'tour':
        return '#c49d2f'; // Dark gold for tour appointments
      case 'transaction':
        return '#16a34a'; // Green for transactions
      case 'deal':
        return '#f0d98a'; // Light gold for deals
      case 'custom':
        return '#ffb020'; // Amber for brokerage events
      default:
        return '#757575';
    }
  };

  return (
    <Box sx={{ minHeight: '100%', backgroundColor: '#0D0D0D', py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 1, md: 2 }, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
              <CalendarBlank size={32} weight="duotone" color="#E2C05A" />
              <Typography variant="h4" component="h1" sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                Calendar
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
              <Button
                variant="outlined"
                startIcon={<ArrowsClockwise size={20} />}
                onClick={() => {
                  fetch('/api/calendar/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ syncType: 'incremental' }),
                  }).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
                    queryClient.invalidateQueries({ queryKey: ['calendar-sync-status'] });
                  });
                }}
                sx={{
                  color: '#E2C05A',
                  borderColor: 'rgba(226, 192, 90, 0.5)',
                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 0.5, md: 1 },
                  '&:hover': {
                    borderColor: '#E2C05A',
                    backgroundColor: 'rgba(226, 192, 90, 0.08)',
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sync with Google</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Sync</Box>
              </Button>
              <SyncStatusIndicator />
            </Box>
          </Box>
          <Typography variant="body1" sx={{ color: '#B0B0B0', fontSize: { xs: '0.875rem', md: '1rem' }, display: { xs: 'none', sm: 'block' } }}>
            View all your tasks, appointments, and important dates. Synced with Google Calendar.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper sx={{
              backgroundColor: '#121212',
              border: '1px solid #2A2A2A',
              borderRadius: 0,
              p: 3,
              height: 'calc(100vh - 200px)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF', fontWeight: 600, mb: 3 }}>
                Filters
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showFUBEvents}
                      onChange={(e) => setShowFUBEvents(e.target.checked)}
                      sx={{
                        color: '#B0B0B0',
                        '&.Mui-checked': { color: '#E2C05A' }
                      }}
                    />
                  }
                  label="Tasks & Appointments"
                  sx={{ '& .MuiFormControlLabel-label': { color: '#FFFFFF' } }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showTransactionDates}
                      onChange={(e) => setShowTransactionDates(e.target.checked)}
                      sx={{
                        color: '#B0B0B0',
                        '&.Mui-checked': { color: '#E2C05A' }
                      }}
                    />
                  }
                  label="Transaction Dates"
                  sx={{ '& .MuiFormControlLabel-label': { color: '#FFFFFF' } }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showBrokerageEvents}
                      onChange={(e) => setShowBrokerageEvents(e.target.checked)}
                      sx={{
                        color: '#B0B0B0',
                        '&.Mui-checked': { color: '#E2C05A' }
                      }}
                    />
                  }
                  label="Brokerage Events"
                  sx={{ '& .MuiFormControlLabel-label': { color: '#FFFFFF' } }}
                />
              </Box>

              <Divider sx={{ my: 3, borderColor: 'rgba(226, 192, 90, 0.1)' }} />

              <Button
                fullWidth
                variant="outlined"
                startIcon={<TagIcon size={18} weight="bold" />}
                onClick={() => setCategoryModalOpen(true)}
                sx={{
                  borderColor: 'rgba(226, 192, 90, 0.3)',
                  color: '#E2C05A',
                  '&:hover': {
                    borderColor: '#E2C05A',
                    backgroundColor: 'rgba(226, 192, 90, 0.1)',
                  },
                }}
              >
                Categorize Events
              </Button>

              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#FFFFFF', fontWeight: 600, mb: 2 }}>
                  Legend
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: '#E2C05A', borderRadius: '6px', mr: 1.5 }} />
                    <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Tasks</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: '#c49d2f', borderRadius: '6px', mr: 1.5 }} />
                    <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Tour Appointments</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: '#16a34a', borderRadius: '6px', mr: 1.5 }} />
                    <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Transaction Dates</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: '#f0d98a', borderRadius: '6px', mr: 1.5 }} />
                    <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Deals</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: '#ffb020', borderRadius: '6px', mr: 1.5 }} />
                    <Typography variant="body2" sx={{ color: '#B0B0B0' }}>Brokerage Events</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={9}>
            <Paper sx={{
              backgroundColor: '#0D0D0D',
              border: 'none',
              borderRadius: 0,
              p: { xs: 1, md: 3 },
              height: { xs: 'calc(100vh - 180px)', md: 'calc(100vh - 200px)' },
              overflow: 'auto',
              '& .fc': {
                color: '#FFFFFF',
                '--fc-border-color': 'rgba(226, 192, 90, 0.1)',
                '--fc-today-bg-color': 'rgba(226, 192, 90, 0.08)',
              },
              '& .fc-toolbar': {
                marginBottom: { xs: '12px', md: '24px' },
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: '8px', md: '0' },
              },
              '& .fc-toolbar-chunk': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', md: 'flex-start' },
              },
              '& .fc-toolbar-title': {
                color: '#FFFFFF',
                fontSize: { xs: '1.1rem', md: '1.5rem' },
                fontWeight: 600,
              },
              '& .fc-button': {
                backgroundColor: 'transparent',
                border: '1px solid rgba(226, 192, 90, 0.2)',
                borderRadius: { xs: '6px', md: '8px' },
                color: '#E2C05A',
                textTransform: 'none',
                fontWeight: 500,
                padding: { xs: '4px 8px', md: '8px 16px' },
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                transition: 'all 200ms ease',
                '&:hover': {
                  backgroundColor: 'rgba(226, 192, 90, 0.1)',
                  borderColor: '#E2C05A',
                  color: '#EDD48A',
                },
                '&:disabled': {
                  color: '#808080',
                  borderColor: 'rgba(226, 192, 90, 0.1)',
                  opacity: 0.5,
                },
                '&:focus': {
                  boxShadow: 'none',
                },
              },
              '& .fc-button-primary:not(:disabled).fc-button-active': {
                backgroundColor: '#E2C05A',
                borderColor: '#E2C05A',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#C4A43B',
                  borderColor: '#C4A43B',
                },
              },
              '& .fc-col-header-cell': {
                backgroundColor: '#121212',
                borderColor: 'rgba(226, 192, 90, 0.1)',
                borderWidth: '1px',
                padding: { xs: '8px 2px', md: '12px 4px' },
              },
              '& .fc-col-header-cell-cushion': {
                color: '#E2C05A',
                fontWeight: 600,
                fontSize: { xs: '0.65rem', md: '0.75rem' },
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
              '& .fc-daygrid-day': {
                borderColor: 'rgba(226, 192, 90, 0.08)',
                borderWidth: '1px',
                '&:hover': {
                  backgroundColor: 'rgba(226, 192, 90, 0.05)',
                },
              },
              '& .fc-daygrid-day-frame': {
                padding: { xs: '4px', md: '8px' },
                minHeight: { xs: '60px', md: 'auto' },
              },
              '& .fc-daygrid-day-number': {
                color: '#E0E0E0',
                padding: { xs: '2px 4px', md: '4px 8px' },
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                fontWeight: 500,
              },
              '& .fc-daygrid-day.fc-day-today': {
                backgroundColor: 'rgba(226, 192, 90, 0.05)',
                '.fc-daygrid-day-number': {
                  backgroundColor: '#E2C05A',
                  borderRadius: '50%',
                  width: { xs: '24px', md: '28px' },
                  height: { xs: '24px', md: '28px' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                },
              },
              '& .fc-event': {
                borderRadius: '4px',
                padding: { xs: '2px 4px', md: '4px 8px' },
                fontSize: { xs: '0.65rem', md: '0.75rem' },
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                marginBottom: '2px',
                '&:hover': {
                  opacity: 0.85,
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                },
              },
              '& .fc-event-title': {
                color: '#FFFFFF',
                fontWeight: 500,
              },
              '& .fc-timegrid-slot': {
                height: '50px',
                borderColor: 'rgba(226, 192, 90, 0.08)',
                borderWidth: '1px',
              },
              '& .fc-timegrid-slot-label': {
                color: '#EDD48A',
                fontSize: '0.7rem',
                padding: '4px 8px',
                fontWeight: 500,
              },
              '& .fc-timegrid-axis-cushion': {
                color: '#EDD48A',
                fontSize: '0.7rem',
              },
              '& .fc-timegrid-event': {
                borderRadius: '4px',
                padding: '4px 6px',
                borderWidth: '0',
                borderLeftWidth: '3px',
                borderStyle: 'solid',
              },
              '& .fc-scrollgrid': {
                borderColor: 'rgba(226, 192, 90, 0.1)',
                borderWidth: '1px',
              },
              '& .fc-timegrid-divider': {
                borderColor: 'rgba(226, 192, 90, 0.15)',
                borderWidth: '1px',
              },
              '& .fc-timegrid-col': {
                backgroundColor: '#0D0D0D',
                borderColor: 'rgba(226, 192, 90, 0.08)',
              },
              '& .fc-timegrid-col.fc-day-today': {
                backgroundColor: 'rgba(226, 192, 90, 0.03)',
              },
              '& .fc-timegrid-now-indicator-line': {
                borderColor: '#E2C05A',
                borderWidth: '2px',
              },
              '& .fc-timegrid-now-indicator-arrow': {
                borderColor: '#E2C05A',
              },
              '& .fc-list-event': {
                backgroundColor: '#121212',
                borderColor: 'rgba(226, 192, 90, 0.1)',
                borderLeftWidth: '3px',
                '&:hover': {
                  backgroundColor: 'rgba(226, 192, 90, 0.08)',
                },
              },
              '& .fc-list-event-title': {
                color: '#FFFFFF',
              },
              '& .fc-list-event-time': {
                color: '#EDD48A',
              },
              '& .fc-day-other': {
                opacity: 0.3,
              },
            }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <Typography sx={{ color: '#B0B0B0' }}>Loading calendar...</Typography>
                </Box>
              ) : (
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  }}
                  events={events || []}
                  editable={true}
                  selectable={true}
                  dateClick={handleDateClick}
                  height="auto"
                  slotMinTime="08:00:00"
                  slotMaxTime="18:00:00"
                  slotDuration="00:30:00"
                  allDaySlot={true}
                  nowIndicator={true}
                  scrollTime="08:00:00"
                  businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5],
                    startTime: '08:00',
                    endTime: '18:00',
                  }}
                  expandRows={true}
                  slotEventOverlap={false}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <CategoryAssignmentModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
      />

      <CreateEventModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialDate={selectedDate}
      />
    </Box>
  );
}
