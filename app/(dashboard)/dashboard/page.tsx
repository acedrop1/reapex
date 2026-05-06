'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Popover,
  Menu,
  MenuItem,
  Badge,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
} from '@mui/material';
import {
  House,
  Calendar as CalendarIcon,
  CheckSquare,
  Bell,
  User,
  X,
  CalendarBlank,
  List as ListIcon,
  CaretLeft,
  CaretRight,
  TrendUp,
  FileText,
  Check,
  Megaphone,
} from '@phosphor-icons/react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggeredEntrance';

interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  category: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Array<{ id: number | string; title: string; time: string; date: string }>>([]);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('month');
  const [listingScroll, setListingScroll] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileTab, setMobileTab] = useState(0);

  const getDefaultCta = (type: string) => {
    switch (type) {
      case 'form': return 'View Form';
      case 'marketing': return 'View Resource';
      case 'listing': return 'View Listing';
      case 'event': return 'View Event';
      case 'link': return 'Learn More';
      case 'training': return 'Start Training';
      default: return 'Learn More';
    }
  };

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setUser(userData);

      // Check if onboarding is completed
      if (userData && !userData.onboarding_completed) {
        setOnboardingOpen(true);
      }

      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .lte('published_at', new Date().toISOString())
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .eq('archived', false)
        .order('published_at', { ascending: false })
        .limit(1);
      setAnnouncements(announcementsData || []);

      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, property_address, property_city, price, cover_image, status')
        .eq('agent_id', session.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);
      setListings(listingsData || []);

      // Fetch transactions (3 latest active deals)
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('id, property_address, property_city, sale_price, status, closing_date')
        .eq('agent_id', session.user.id)
        .in('status', ['pending', 'under_contract'])
        .order('updated_at', { ascending: false })
        .limit(3);
      setTransactions(transactionsData || []);

      // Fetch notifications (unread)
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      setNotifications(notificationsData || []);

      // Fetch tasks from tasks table
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, priority, completed')
        .eq('agent_id', session.user.id)
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(5);

      // Transform to match Task interface
      const transformedTasks: Task[] = (tasksData || []).map((task: any) => ({
        id: task.id,
        title: task.title || 'Untitled Task',
        description: task.description || '',
        dueDate: task.due_date || new Date().toISOString(),
        priority: (task.priority || 'medium') as 'high' | 'medium' | 'low',
        completed: task.completed || false,
        category: 'Task',
      }));
      setTasks(transformedTasks);

      // Fetch calendar events
      const { data: eventsData } = await supabase
        .from('calendar_events')
        .select('id, title, start_date')
        .or(`agent_id.eq.${session.user.id},agent_id.is.null`)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(10);

      // Fetch tour appointments as calendar events
      const { data: tourData } = await supabase
        .from('tour_appointments')
        .select('id, scheduled_date, scheduled_time, visitor_name, listings(property_address)')
        .eq('agent_id', session.user.id)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .limit(10);

      // Transform to upcomingEvents format
      const calendarEvents = (eventsData || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        time: new Date(event.start_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        date: event.start_date.split('T')[0],
      }));

      const tourEvents = (tourData || []).map((tour: any) => ({
        id: `tour-${tour.id}`,
        title: `Tour: ${(tour.listings as any)?.property_address || 'Property'} - ${tour.visitor_name}`,
        time: tour.scheduled_time,
        date: tour.scheduled_date,
      }));

      setUpcomingEvents([...calendarEvents, ...tourEvents]);
    }

    loadData();
  }, [router, supabase]);

  const handleOnboardingComplete = async () => {
    setOnboardingOpen(false);
    // Reload user data to get updated profile
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setUser(userData);
    }
  };

  // Plan-based cap calculation
  const userPlan = user?.subscription_plan || 'launch';
  const planCaps = {
    launch: 21000,
    growth: 18000,
    pro: null, // No cap
  };
  const capAmount = planCaps[userPlan as keyof typeof planCaps] || user?.cap_amount || 21000;
  const currentProgress = user?.current_cap_progress || 0;
  const capPercentage = capAmount ? Math.min((currentProgress / capAmount) * 100, 100) : 0;

  // Color gradient based on percentage (0-50%: green, 50-75%: yellow, 75-100%: red)
  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return '#E2C05A'; // Green
    if (percentage < 75) return '#FFB74D'; // Yellow
    return '#EF5350'; // Red
  };

  const eventsByDate = upcomingEvents.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, typeof upcomingEvents>);

  const uniqueDates = Object.keys(eventsByDate).sort();

  // Calendar helper functions
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const hasEventOnDate = (date: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return eventsByDate[dateStr] !== undefined;
  };

  const getEventsForDate = (date: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return eventsByDate[dateStr] || [];
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const scrollListings = (direction: 'left' | 'right') => {
    const container = document.getElementById('listings-carousel');
    if (container) {
      const scrollAmount = 300;
      const newScroll = direction === 'left'
        ? Math.max(0, listingScroll - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, listingScroll + scrollAmount);

      container.scrollTo({ left: newScroll, behavior: 'smooth' });
      setListingScroll(newScroll);
    }
  };

  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const markNotificationRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <StaggerContainer delay={1.0}>
      {/* Header Row - Progress Bar and Announcements */}
      <StaggerItem>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'stretch',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Announcements (Top on mobile, Right on desktop) */}
        <Box
          sx={{
            flex: 1,
            p: 2.5,
            backgroundColor: '#000000',
            borderRadius: '12px',
            border: '1px solid #3A3A3A',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Megaphone size={18} color="#E2C05A" weight="duotone" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.95rem' }}>
              Announcements
            </Typography>
          </Box>
          {announcements && announcements.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {announcements.map((announcement: any) => (
                <Box key={announcement.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.875rem' }}>
                      {announcement.title}
                    </Typography>
                    {announcement.priority === 'high' && (
                      <Box sx={{
                        px: 1,
                        py: 0.25,
                        backgroundColor: 'rgba(239, 83, 80, 0.15)',
                        borderRadius: '4px',
                        border: '1px solid rgba(239, 83, 80, 0.3)'
                      }}>
                        <Typography variant="caption" sx={{ color: '#EF5350', fontSize: '0.7rem', fontWeight: 600 }}>
                          HIGH
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#aaaaaa',
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {announcement.content}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#808080', fontSize: '0.7rem' }}>
                      {new Date(announcement.published_at).toLocaleDateString()}
                    </Typography>
                    {announcement.related_type && announcement.related_title && (
                      <Button
                        size="small"
                        variant="outlined"
                        href={announcement.related_url || '#'}
                        sx={{
                          fontSize: '0.7rem',
                          py: 0.25,
                          px: 1,
                          minHeight: 0,
                          borderColor: 'rgba(226, 192, 90, 0.5)',
                          color: '#E2C05A',
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: '#E2C05A',
                            backgroundColor: 'rgba(226, 192, 90, 0.1)',
                          },
                        }}
                      >
                        {announcement.related_cta_text || getDefaultCta(announcement.related_type)}
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#aaaaaa', fontSize: '0.85rem' }}>
              No new announcements
            </Typography>
          )}
        </Box>

        {/* Progress Bar (Bottom on mobile, Left on desktop) */}
        <Box
          sx={{
            flex: 1,
            p: 2.5,
            backgroundColor: '#000000',
            borderRadius: '12px',
            border: '1px solid #3A3A3A',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TrendUp size={18} color={getProgressColor(capPercentage)} weight="duotone" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.95rem' }}>
              Progress to {userPlan === 'pro' ? 'No' : '$' + (capAmount / 1000).toFixed(0) + 'K'} Cap
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1.1rem', fontFamily: '"JetBrains Mono", monospace' }}>
              {userPlan === 'pro' ? (
                `$${(currentProgress / 1000).toFixed(1)}K`
              ) : (
                `$${(currentProgress / 1000).toFixed(1)}K / $${(capAmount / 1000).toFixed(0)}K`
              )}
            </Typography>
          </Box>

          {/* Linear Progress Bar */}
          {userPlan !== 'pro' && (
            <Box sx={{ position: 'relative', height: 12, backgroundColor: '#1A1A1A', borderRadius: '6px', overflow: 'hidden' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${capPercentage}%`,
                  backgroundColor: getProgressColor(capPercentage),
                  borderRadius: '6px',
                  transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: `0 0 12px ${getProgressColor(capPercentage)}80`,
                }}
              />
            </Box>
          )}
          {userPlan === 'pro' && (
            <Typography variant="caption" sx={{ color: '#E2C05A', fontWeight: 500 }}>
              No cap limit on Pro plan
            </Typography>
          )}
        </Box>
      </Box>
      </StaggerItem>

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notificationsAnchor)}
        anchorEl={notificationsAnchor}
        onClose={handleNotificationsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 360,
            maxHeight: 400,
            backgroundColor: '#111111',
            border: '1px solid #3A3A3A',
            borderRadius: '12px',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
            Notifications
          </Typography>
        </Box>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#808080' }}>
              No new notifications
            </Typography>
          </Box>
        ) : (
          <Box>
            {notifications.map((notification) => (
              <Box
                key={notification.id}
                sx={{
                  p: 2,
                  borderBottom: '1px solid rgba(226, 192, 90, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    backgroundColor: 'rgba(226, 192, 90, 0.05)',
                  },
                }}
                onClick={() => markNotificationRead(notification.id)}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 0.5 }}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                  {notification.message}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Popover>

      {isMobile && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={mobileTab}
            onChange={(e, v) => setMobileTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': { color: '#aaaaaa' },
              '& .Mui-selected': { color: '#E2C05A' },
              '& .MuiTabs-indicator': { backgroundColor: '#E2C05A' },
            }}
          >
            <Tab label="Overview" />
            <Tab label="Listings" />
            <Tab label="Calendar" />
          </Tabs>
        </Box>
      )}
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        {/* Left Side - Tasks, Transactions, Listings stacked */}
        <Grid item xs={12} md={7} sx={{ height: isMobile ? 'auto' : '100%', display: (isMobile && mobileTab === 2) ? 'none' : 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Tasks and Transactions Row */}
          <Grid container spacing={2} sx={{ flexShrink: 0, display: (isMobile && mobileTab !== 0) ? 'none' : 'flex' }}>
            {/* Transactions Box */}
            <Grid item xs={12} md={6}>
              <StaggerItem>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#000000',
                  borderRadius: '12px',
                  border: '1px solid #3A3A3A',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <FileText size={18} color="#E2C05A" weight="duotone" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '1rem' }}>
                    Active Deals
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    component={Link}
                    href="/transactions"
                    sx={{ color: '#E2C05A', textTransform: 'none', fontSize: '0.75rem', p: 0, minWidth: 'auto' }}
                  >
                    View All
                  </Button>
                </Box>

                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  overflowY: 'auto',
                  flex: 1,
                  '&::-webkit-scrollbar': { width: '8px' },
                  '&::-webkit-scrollbar-track': { backgroundColor: '#000000', borderRadius: '4px' },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#2A2A2A',
                    borderRadius: '4px',
                    '&:hover': { backgroundColor: '#333333' },
                  },
                }}>
                  {transactions && transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <Box
                        key={transaction.id}
                        component={Link}
                        href={`/transactions/${transaction.id}`}
                        sx={{
                          p: 1,
                          backgroundColor: '#111111',
                          borderRadius: '6px',
                          border: '1px solid #3A3A3A',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                          '&:hover': {
                            borderColor: '#E2C05A',
                            boxShadow: '0 4px 12px rgba(226, 192, 90, 0.2)',
                          },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: '#FFFFFF',
                            mb: 0.5,
                            fontSize: '0.8rem',
                          }}
                        >
                          {transaction.property_address}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#808080', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                          {transaction.property_city}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#E2C05A', fontWeight: 600, fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace' }}>
                            ${transaction.sale_price?.toLocaleString()}
                          </Typography>
                          <Chip
                            label={transaction.status === 'pending' ? 'Pending' : 'Under Contract'}
                            size="small"
                            sx={{
                              height: '16px',
                              fontSize: '0.65rem',
                              fontWeight: 500,
                              backgroundColor:
                                transaction.status === 'pending' ? 'rgba(226, 192, 90, 0.15)' : 'rgba(255, 183, 77, 0.15)',
                              border: `1px solid ${transaction.status === 'pending' ? 'rgba(226, 192, 90, 0.3)' : 'rgba(255, 183, 77, 0.3)'
                                }`,
                              color: transaction.status === 'pending' ? '#E2C05A' : '#FFB74D',
                            }}
                          />
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <FileText size={32} color="#4A4A4A" weight="duotone" />
                      <Typography variant="caption" sx={{ color: '#808080', mt: 1, display: 'block', fontSize: '0.7rem' }}>
                        No active transactions
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              </StaggerItem>
            </Grid>

            {/* Tasks Box */}
            <Grid item xs={12} md={6}>
              <StaggerItem>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#000000',
                  borderRadius: '12px',
                  border: '1px solid #3A3A3A',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <CheckSquare size={18} color="#E2C05A" weight="duotone" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '1rem' }}>
                    Tasks
                  </Typography>
                </Box>

                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  overflowY: 'auto',
                  flex: 1,
                  '&::-webkit-scrollbar': { width: '8px' },
                  '&::-webkit-scrollbar-track': { backgroundColor: '#000000', borderRadius: '4px' },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#2A2A2A',
                    borderRadius: '4px',
                    '&:hover': { backgroundColor: '#333333' },
                  },
                }}>
                  {tasks.map((task) => (
                    <Box
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      sx={{
                        p: 1,
                        backgroundColor: '#111111',
                        borderRadius: '6px',
                        border: '1px solid #3A3A3A',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        '&:hover': {
                          borderColor: '#E2C05A',
                          boxShadow: '0 4px 12px rgba(226, 192, 90, 0.2)',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: task.completed ? '#808080' : '#FFFFFF',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          mb: 0.5,
                          fontSize: '0.8rem',
                        }}
                      >
                        {task.title}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#E2C05A', fontWeight: 500, fontSize: '0.7rem' }}>
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Typography>
                        <Chip
                          label={task.priority}
                          size="small"
                          sx={{
                            height: '16px',
                            fontSize: '0.65rem',
                            fontWeight: 500,
                            textTransform: 'capitalize',
                            backgroundColor:
                              task.priority === 'high' ? 'rgba(229, 115, 115, 0.15)' :
                                task.priority === 'medium' ? 'rgba(255, 183, 77, 0.15)' :
                                  'rgba(129, 199, 132, 0.15)',
                            border: `1px solid ${task.priority === 'high' ? 'rgba(229, 115, 115, 0.3)' :
                              task.priority === 'medium' ? 'rgba(255, 183, 77, 0.3)' :
                                'rgba(129, 199, 132, 0.3)'
                              }`,
                            color:
                              task.priority === 'high' ? '#E57373' :
                                task.priority === 'medium' ? '#FFB74D' :
                                  '#81C784',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
              </StaggerItem>
            </Grid>
          </Grid>

          {/* Listings Below - Full Width */}
          <StaggerItem style={{ flex: 1, minHeight: 0 }}>
          <Box sx={{ flex: 1, minHeight: 0, display: (isMobile && mobileTab !== 1) ? 'none' : 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <House size={18} color="#E2C05A" weight="duotone" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '1rem' }}>
                  My Listings
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/dashboard/business?tab=listings"
                sx={{ color: '#E2C05A', textTransform: 'none', fontSize: '0.75rem' }}
              >
                View All
              </Button>
            </Box>

            {listings && listings.length > 0 ? (
              <>
                <Box
                  id="listings-carousel"
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 1.5,
                    overflowX: 'auto',
                    flex: 1,
                    pb: 2,
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth',
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                  }}
                  onScroll={(e) => {
                    const container = e.target as HTMLElement;
                    const scrollLeft = container.scrollLeft;
                    const cardWidth = 165; // minWidth + gap
                    const currentIndex = Math.round(scrollLeft / cardWidth);
                    setListingScroll(currentIndex);
                  }}
                >
                  {listings.map((listing) => (
                    <Box
                      key={listing.id}
                      component={Link}
                      href="/dashboard/business?tab=listings"
                      sx={{
                        p: 1,
                        backgroundColor: '#000000',
                        borderRadius: '8px',
                        border: '1px solid #3A3A3A',
                        transition: 'all 200ms ease',
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.75,
                        minWidth: 160,
                        maxWidth: 160,
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                        '&:hover': {
                          borderColor: '#E2C05A',
                          boxShadow: '0 4px 12px rgba(226, 192, 90, 0.2)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: 75,
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: '#2A2A2A',
                          flexShrink: 0,
                        }}
                      >
                        {listing.cover_image ? (
                          <Image
                            src={listing.cover_image}
                            alt={listing.property_address}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <House size={28} color="#4A4A4A" weight="duotone" />
                          </Box>
                        )}
                      </Box>

                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 0.3, fontSize: '0.75rem', lineHeight: 1.1 }} noWrap>
                          {listing.property_address}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#808080', display: 'block', mb: 0.3, fontSize: '0.6rem', lineHeight: 1.1 }} noWrap>
                          {listing.property_city}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#E2C05A', fontSize: '0.75rem', lineHeight: 1.1, fontFamily: '"JetBrains Mono", monospace' }}>
                          ${listing.price?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Carousel Dots */}
                {listings.length > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                    {Array.from({ length: Math.min(5, listings.length) }).map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: listingScroll === index ? '#E2C05A' : '#3A3A3A',
                          transition: 'background-color 200ms ease',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          const container = document.getElementById('listings-carousel');
                          if (container) {
                            const cardWidth = 165;
                            container.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                          }
                        }}
                      />
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#000000', borderRadius: '8px', border: '1px solid #3A3A3A' }}>
                <House size={32} color="#4A4A4A" weight="duotone" />
                <Typography variant="caption" sx={{ color: '#808080', mt: 1, display: 'block', fontSize: '0.7rem' }}>
                  No active listings
                </Typography>
              </Box>
            )}
          </Box>
          </StaggerItem>
        </Grid>

        {/* Right Side - Calendar Full Height */}
        <Grid item xs={12} md={5} sx={{ height: isMobile ? '70vh' : '100%', display: (isMobile && mobileTab !== 2) ? 'none' : 'block' }}>
          <StaggerItem style={{ height: '100%' }}>
          <Box
            sx={{
              p: 1.5,
              backgroundColor: '#000000',
              borderRadius: '12px',
              border: '1px solid #3A3A3A',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon size={18} color="#E2C05A" weight="duotone" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '1rem' }}>
                  Calendar
                </Typography>
              </Box>

              <ToggleButtonGroup
                value={calendarView}
                exclusive
                onChange={(e, newView) => newView && setCalendarView(newView)}
                size="small"
              >
                <ToggleButton
                  value="week"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    border: '1px solid #3A3A3A',
                    color: '#808080',
                    '&.Mui-selected': {
                      backgroundColor: '#E2C05A',
                      color: '#FFFFFF',
                      '&:hover': {
                        backgroundColor: '#C4A43B',
                      },
                    },
                  }}
                >
                  <ListIcon size={16} weight="bold" />
                </ToggleButton>
                <ToggleButton
                  value="month"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    border: '1px solid #3A3A3A',
                    color: '#808080',
                    '&.Mui-selected': {
                      backgroundColor: '#E2C05A',
                      color: '#FFFFFF',
                      '&:hover': {
                        backgroundColor: '#C4A43B',
                      },
                    },
                  }}
                >
                  <CalendarBlank size={16} weight="bold" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* List View */}
            {calendarView === 'week' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', flex: 1, minHeight: 0 }}>
                {uniqueDates.length > 0 ? (
                  uniqueDates.map((date) => (
                    <Box
                      key={date}
                      sx={{
                        p: 1,
                        backgroundColor: '#111111',
                        borderRadius: '6px',
                        border: '1px solid #3A3A3A',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        '&:hover': {
                          borderColor: '#E2C05A',
                          boxShadow: '0 4px 12px rgba(226, 192, 90, 0.2)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                          pb: 1,
                          borderBottom: '1px solid rgba(226, 192, 90, 0.08)',
                        }}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            backgroundColor: 'rgba(226, 192, 90, 0.15)',
                            border: '1px solid rgba(226, 192, 90, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#EDD48A', fontWeight: 600, fontSize: '0.55rem' }}>
                            {new Date(date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#E2C05A', fontWeight: 700, lineHeight: 1, fontSize: '0.85rem' }}>
                            {new Date(date).getDate()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#aaaaaa', fontWeight: 500, fontSize: '0.75rem' }}>
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {eventsByDate[date].map((event) => (
                          <Box
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              cursor: 'pointer',
                              p: 0.5,
                              borderRadius: '4px',
                              transition: 'all 200ms ease',
                              '&:hover': {
                                backgroundColor: 'rgba(226, 192, 90, 0.1)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: '#E2C05A',
                                flexShrink: 0,
                              }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#FFFFFF', fontSize: '0.7rem' }}>
                                {event.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#808080', fontSize: '0.6rem' }}>
                                {event.time}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    py: 4
                  }}>
                    <CalendarBlank size={48} color="#4A4A4A" weight="duotone" />
                    <Typography variant="body2" sx={{ color: '#808080', mt: 2, fontWeight: 500 }}>
                      No upcoming events
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#606060', mt: 0.5 }}>
                      Your calendar is clear
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Calendar View */}
            {calendarView === 'month' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {/* Month Navigation */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 1 }}>
                  <IconButton
                    size="small"
                    onClick={previousMonth}
                    sx={{
                      color: '#aaaaaa',
                      '&:hover': { backgroundColor: 'rgba(226, 192, 90, 0.1)', color: '#E2C05A' },
                    }}
                  >
                    <CaretLeft size={20} weight="bold" />
                  </IconButton>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.9rem' }}>
                    {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={nextMonth}
                    sx={{
                      color: '#aaaaaa',
                      '&:hover': { backgroundColor: 'rgba(226, 192, 90, 0.1)', color: '#E2C05A' },
                    }}
                  >
                    <CaretRight size={20} weight="bold" />
                  </IconButton>
                </Box>

                {/* Weekday Headers */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Box key={day} sx={{ textAlign: 'center', py: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#808080', fontWeight: 600, fontSize: '0.65rem' }}>
                        {day}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Calendar Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, flex: 1 }}>
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, index) => (
                    <Box key={`empty-${index}`} sx={{ aspectRatio: '1', backgroundColor: 'transparent' }} />
                  ))}

                  {/* Days of the month */}
                  {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, index) => {
                    const date = index + 1;
                    const isToday =
                      new Date().getDate() === date &&
                      new Date().getMonth() === currentMonth &&
                      new Date().getFullYear() === currentYear;
                    const hasEvent = hasEventOnDate(date);

                    return (
                      <Box
                        key={date}
                        sx={{
                          aspectRatio: '1',
                          backgroundColor: isToday ? 'rgba(226, 192, 90, 0.1)' : '#121212',
                          border: isToday ? '2px solid #E2C05A' : '1px solid rgba(226, 192, 90, 0.08)',
                          borderRadius: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          cursor: hasEvent ? 'pointer' : 'default',
                          transition: 'all 200ms ease',
                          '&:hover': hasEvent ? {
                            borderColor: '#E2C05A',
                            backgroundColor: 'rgba(226, 192, 90, 0.15)',
                          } : {},
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isToday ? 700 : 500,
                            color: isToday ? '#E2C05A' : '#FFFFFF',
                            fontSize: '0.75rem',
                          }}
                        >
                          {date}
                        </Typography>
                        {hasEvent && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              backgroundColor: '#E2C05A',
                              boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
          </StaggerItem>
        </Grid>
      </Grid>
      </StaggerContainer>

      {/* Task Detail Modal */}
      <Dialog
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedTask && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedTask.title}
                </Typography>
                <IconButton onClick={() => setSelectedTask(null)} size="small">
                  <X size={20} />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip
                  label={selectedTask.category}
                  size="small"
                  sx={{
                    backgroundColor: '#FFF8E1',
                    color: '#C4A43B',
                    fontWeight: 500,
                  }}
                />
                <Chip
                  label={selectedTask.priority}
                  size="small"
                  sx={{
                    textTransform: 'capitalize',
                    backgroundColor:
                      selectedTask.priority === 'high' ? '#FFEBEE' :
                        selectedTask.priority === 'medium' ? '#FFF3E0' :
                          '#E8F5E9',
                    color:
                      selectedTask.priority === 'high' ? '#D32F2F' :
                        selectedTask.priority === 'medium' ? '#F57C00' :
                          '#388E3C',
                    fontWeight: 500,
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#808080', display: 'block', mb: 0.5 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ color: '#1A1A1A', lineHeight: 1.6 }}>
                  {selectedTask.description}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#808080', display: 'block', mb: 0.5 }}>
                  Due Date
                </Typography>
                <Typography variant="body2" sx={{ color: '#E2C05A', fontWeight: 500 }}>
                  {new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                onClick={() => setSelectedTask(null)}
                sx={{ color: '#808080' }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#E2C05A',
                  '&:hover': {
                    backgroundColor: '#C4A43B',
                  },
                }}
              >
                Mark Complete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Event Detail Modal */}
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedEvent.title}
                </Typography>
                <IconButton onClick={() => setSelectedEvent(null)} size="small">
                  <X size={20} />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#808080', display: 'block', mb: 0.5 }}>
                  Date & Time
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon size={18} color="#E2C05A" weight="duotone" />
                    <Typography variant="body2" sx={{ color: '#E2C05A', fontWeight: 500 }}>
                      {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#1A1A1A', fontWeight: 500 }}>
                    {selectedEvent.time}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                onClick={() => setSelectedEvent(null)}
                sx={{ color: '#808080' }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#E2C05A',
                  '&:hover': {
                    backgroundColor: '#C4A43B',
                  },
                }}
              >
                Edit Event
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Onboarding Wizard */}
      <OnboardingWizard
        open={onboardingOpen}
        onClose={() => {}} // Prevent closing - onboarding is mandatory
        onComplete={handleOnboardingComplete}
      />
    </Container>
  );
}
