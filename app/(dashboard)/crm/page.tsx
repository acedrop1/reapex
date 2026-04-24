'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Menu,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Users,
  Checks,
  Plus,
  PencilSimple,
  CalendarBlank,
  CaretUp,
  CaretDown,
  DotsThree,
  ShoppingCart,
  Tag,
  Key,
  Buildings,
  UserCirclePlus,
  Envelope,
  Phone,
  Eye,
  Trash,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { Fab } from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import ContactDetailsDrawer from '@/components/crm/ContactDetailsDrawer';
import TaskDetailsDrawer from '@/components/crm/TaskDetailsDrawer';
import CreateTaskModal from '@/components/crm/CreateTaskModal';
import CreateMeetingModal from '@/components/crm/CreateMeetingModal';

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
      id={`crm-tabpanel-${index}`}
      aria-labelledby={`crm-tab-${index}`}
      style={{ flex: 1, display: value === index ? 'flex' : 'none', flexDirection: 'column' }}
      {...other}
    >
      {children}
    </div>
  );
}

export default function CRMPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [tabValue, setTabValue] = useState(0);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [calendarErrorDialogOpen, setCalendarErrorDialogOpen] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contactTypeFilter, setContactTypeFilter] = useState('all');

  // Calendar view state
  const [calendarView, setCalendarView] = useState<'month' | 'agenda'>('month');

  // Sorting states
  const [contactsSortColumn, setContactsSortColumn] = useState<string | null>(null);
  const [contactsSortDirection, setContactsSortDirection] = useState<'asc' | 'desc'>('asc');
  const [dealsSortColumn, setDealsSortColumn] = useState<string | null>(null);
  const [dealsSortDirection, setDealsSortDirection] = useState<'asc' | 'desc'>('asc');
  const [tasksSortColumn, setTasksSortColumn] = useState<string | null>(null);
  const [tasksSortDirection, setTasksSortDirection] = useState<'asc' | 'desc'>('asc');

  // Drawer and Modal states
  const [contactDetailsOpen, setContactDetailsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null);
  const [menuContact, setMenuContact] = useState<any>(null);

  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    contact_type: 'lead',
    status: 'new',
    source: '',
    notes: '',
  });

  const [dealForm, setDealForm] = useState({
    title: '',
    contact_id: '',
    stage: 'lead',
    value: '',
    probability: 0,
    expected_close_date: '',
    notes: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
    contact_id: '',
    deal_id: '',
  });

  const { data: contacts } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    retry: 1,
    staleTime: 30000,
  });

  const { data: deals } = useQuery({
    queryKey: ['crm-deals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('deals')
        .select('*, contacts(first_name, last_name, email)')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    retry: 1,
    staleTime: 30000,
  });

  const { data: tasks } = useQuery({
    queryKey: ['crm-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('agent_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
    retry: 1,
    staleTime: 30000,
  });

  // Calendar events query
  const { data: calendarEvents, isLoading: calendarLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch calendar events
      const { data: events } = await supabase
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
      const allEvents = [...(events || []), ...tourEvents];

      // Transform to FullCalendar format
      return allEvents.map((event: any) => ({
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
    if (!time12h) return '00:00:00';

    const parts = time12h.split(' ');
    if (parts.length < 2) return '00:00:00';

    const [time, modifier] = parts;
    const timeParts = time.split(':');
    if (timeParts.length < 2) return '00:00:00';

    let [hours, minutes] = timeParts;

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
        return '#C4A43B'; // Blue for tasks
      case 'tour':
        return '#00bcd4'; // Cyan for tour appointments
      case 'transaction':
        return '#2e7d32'; // Green for transactions
      case 'deal':
        return '#9c27b0'; // Purple for deals
      case 'custom':
        return '#ed6c02'; // Orange for brokerage events
      default:
        return '#757575';
    }
  };

  const { data: contactsList } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .eq('agent_id', user.id);

      if (error) throw error;
      return data || [];
    },
    retry: 1,
    staleTime: 30000,
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: typeof contactForm) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contact');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      setContactDialogOpen(false);
      setContactForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        contact_type: 'lead',
        status: 'new',
        source: '',
        notes: '',
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch('/api/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contact');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      setContactDialogOpen(false);
      setEditingContact(null);
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: typeof dealForm) => {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          value: data.value ? parseFloat(data.value) : null,
          probability: parseInt(String(data.probability)),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create deal');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-list'] });
      setDealDialogOpen(false);
      setDealForm({
        title: '',
        contact_id: '',
        stage: 'lead',
        value: '',
        probability: 0,
        expected_close_date: '',
        notes: '',
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: typeof taskForm) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      setTaskDialogOpen(false);
      setTaskForm({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        status: 'pending',
        contact_id: '',
        deal_id: '',
      });
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setContactForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      contact_type: contact.contact_type || 'lead',
      status: contact.status,
      source: contact.source || '',
      notes: contact.notes || '',
    });
    setContactDialogOpen(true);
  };

  const handleSaveContact = () => {
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, ...contactForm });
    } else {
      createContactMutation.mutate(contactForm);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#E2C05A';
      case 'contacted':
        return '#FF9800';
      case 'qualified':
        return '#4CAF50';
      case 'converted':
        return '#E2C05A';
      case 'lost':
        return '#EF4444';
      default:
        return '#808080';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead':
        return 'info';
      case 'qualified':
        return 'success';
      case 'proposal':
        return 'primary';
      case 'negotiation':
        return 'warning';
      case 'closed':
        return 'success';
      case 'lost':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getLeadTypeIcon = (type: string) => {
    switch (type) {
      case 'buyer':
        return <ShoppingCart size={18} weight="duotone" color="#E2C05A" />;
      case 'seller':
        return <Tag size={18} weight="duotone" color="#E2C05A" />;
      case 'landlord':
        return <Buildings size={18} weight="duotone" color="#9C27B0" />;
      case 'tenant':
        return <Key size={18} weight="duotone" color="#FF9800" />;
      case 'lead':
        return <UserCirclePlus size={18} weight="duotone" color="#EDD48A" />;
      default:
        return <UserCirclePlus size={18} weight="duotone" color="#808080" />;
    }
  };

  const getLeadTypeLabel = (type: string) => {
    if (!type) return 'Lead';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Filter contacts based on search and filters
  const filteredAndSortedContacts = (() => {
    const filtered = contacts?.filter((contact: any) => {
      const matchesSearch = searchQuery === '' ||
        `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
      const matchesContactType = contactTypeFilter === 'all' || contact.contact_type === contactTypeFilter;

      return matchesSearch && matchesStatus && matchesContactType;
    }) || [];

    if (!contactsSortColumn) return filtered;

    return [...filtered].sort((a, b) => {
      let aVal, bVal;

      switch (contactsSortColumn) {
        case 'name':
          aVal = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          bVal = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case 'email':
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
          break;
        case 'phone':
          aVal = a.phone || '';
          bVal = b.phone || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'created':
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return contactsSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return contactsSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  // Sort deals
  const sortedDeals = (() => {
    if (!dealsSortColumn || !deals) return deals || [];

    return [...deals].sort((a, b) => {
      let aVal, bVal;

      switch (dealsSortColumn) {
        case 'deal':
          aVal = (a.title || '').toLowerCase();
          bVal = (b.title || '').toLowerCase();
          break;
        case 'contact':
          aVal = a.contacts ? `${a.contacts.first_name || ''} ${a.contacts.last_name || ''}`.toLowerCase() : '';
          bVal = b.contacts ? `${b.contacts.first_name || ''} ${b.contacts.last_name || ''}`.toLowerCase() : '';
          break;
        case 'stage':
          aVal = a.stage || '';
          bVal = b.stage || '';
          break;
        case 'value':
          aVal = a.value || 0;
          bVal = b.value || 0;
          break;
        case 'probability':
          aVal = a.probability || 0;
          bVal = b.probability || 0;
          break;
        case 'expected_close':
          aVal = a.expected_close_date ? new Date(a.expected_close_date).getTime() : 0;
          bVal = b.expected_close_date ? new Date(b.expected_close_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return dealsSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return dealsSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  // Sort tasks
  const sortedTasks = (() => {
    if (!tasksSortColumn || !tasks) return tasks || [];

    return [...tasks].sort((a, b) => {
      let aVal, bVal;

      switch (tasksSortColumn) {
        case 'task':
          aVal = (a.title || '').toLowerCase();
          bVal = (b.title || '').toLowerCase();
          break;
        case 'due_date':
          aVal = a.due_date ? new Date(a.due_date).getTime() : 0;
          bVal = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case 'status':
          aVal = a.completed ? 1 : 0;
          bVal = b.completed ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return tasksSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return tasksSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  // Sorting handlers
  const handleContactsSort = (column: string) => {
    if (contactsSortColumn === column) {
      setContactsSortDirection(contactsSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setContactsSortColumn(column);
      setContactsSortDirection('asc');
    }
  };

  const handleDealsSort = (column: string) => {
    if (dealsSortColumn === column) {
      setDealsSortDirection(dealsSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setDealsSortColumn(column);
      setDealsSortDirection('asc');
    }
  };

  const handleTasksSort = (column: string) => {
    if (tasksSortColumn === column) {
      setTasksSortDirection(tasksSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setTasksSortColumn(column);
      setTasksSortDirection('asc');
    }
  };

  // Render sort icon helper
  const renderSortIcon = (currentColumn: string, sortColumn: string | null, sortDirection: 'asc' | 'desc') => {
    if (currentColumn !== sortColumn) return null;
    return sortDirection === 'asc' ?
      <CaretUp size={14} weight="fill" style={{ marginLeft: 4 }} /> :
      <CaretDown size={14} weight="fill" style={{ marginLeft: 4 }} />;
  };

  // Drawer and Modal handlers
  const handleRowClick = (contact: any) => {
    setSelectedContact(contact);
    setContactDetailsOpen(true);
  };

  const handleActionsClick = (event: React.MouseEvent<HTMLElement>, contact: any) => {
    event.stopPropagation(); // Prevent row click
    setActionsAnchorEl(event.currentTarget);
    setMenuContact(contact);
  };

  const handleActionsClose = () => {
    setActionsAnchorEl(null);
    setMenuContact(null);
  };

  const handleEditFromMenu = () => {
    if (menuContact) {
      handleEditContact(menuContact);
      handleActionsClose();
    }
  };

  const handleCreateTask = (contact: any) => {
    setSelectedContact(contact);
    setTaskModalOpen(true);
    handleActionsClose();
  };

  const handleCreateMeeting = (contact: any) => {
    setSelectedContact(contact);
    setMeetingModalOpen(true);
    handleActionsClose();
  };

  const handleTaskSubmit = async (taskData: any) => {
    try {
      setTaskModalOpen(false);
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['crm-tasks'] });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleMeetingSubmit = async (meetingData: any) => {
    try {
      setMeetingModalOpen(false);
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData),
      });
      if (response.ok) {
        // Could invalidate meetings query here if we had one
        console.log('Meeting created successfully');
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #2A2A2A',
        backgroundColor: '#121212',
        px: 2,
        flexShrink: 0,
      }}>
        {/* Left: Tabs + Action Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="CRM tabs"
            sx={{
              '& .MuiTab-root': {
                color: '#B0B0B0',
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '1rem',
                minHeight: '48px',
                '&.Mui-selected': {
                  color: '#E2C05A',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#E2C05A',
              },
            }}
          >
            <Tab icon={<Users size={20} weight="duotone" />} iconPosition="start" label="Contacts" />
            <Tab icon={<Checks size={20} weight="duotone" />} iconPosition="start" label="Tasks" />
            <Tab icon={<CalendarBlank size={20} weight="duotone" />} iconPosition="start" label="Calendar" />
          </Tabs>

          {/* Conditional Action Button - Hidden on mobile */}
          {tabValue === 0 && (
            <Button
              variant="contained"
              startIcon={<Plus size={20} weight="duotone" />}
              onClick={() => {
                setEditingContact(null);
                setContactForm({
                  first_name: '',
                  last_name: '',
                  email: '',
                  phone: '',
                  contact_type: 'lead',
                  status: 'new',
                  source: '',
                  notes: '',
                });
                setContactDialogOpen(true);
              }}
              sx={{
                display: { xs: 'none', md: 'flex' },
                backgroundColor: 'rgba(1, 87, 155, 0.15)',
                border: '1px solid rgba(226, 192, 90, 0.3)',
                color: '#EDD48A',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(226, 192, 90, 0.25)',
                  borderColor: 'rgba(226, 192, 90, 0.5)',
                },
              }}
            >
              Add Contact
            </Button>
          )}

          {tabValue === 1 && (
            <Button
              variant="contained"
              startIcon={<Plus size={20} weight="duotone" />}
              onClick={() => {
                setEditingTask(null);
                setTaskForm({
                  title: '',
                  description: '',
                  due_date: '',
                  priority: 'medium',
                  status: 'pending',
                  contact_id: '',
                  deal_id: '',
                });
                setTaskDialogOpen(true);
              }}
              sx={{
                display: { xs: 'none', md: 'flex' },
                backgroundColor: 'rgba(1, 87, 155, 0.15)',
                border: '1px solid rgba(226, 192, 90, 0.3)',
                color: '#EDD48A',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(226, 192, 90, 0.25)',
                  borderColor: 'rgba(226, 192, 90, 0.5)',
                },
              }}
            >
              New Task
            </Button>
          )}

          {tabValue === 2 && (
            <Button
              variant="outlined"
              startIcon={<ArrowsClockwise size={20} />}
              onClick={async () => {
                try {
                  const response = await fetch('/api/calendar/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ syncType: 'incremental' }),
                  });

                  if (response.status === 401) {
                    setCalendarErrorDialogOpen(true);
                    // window.alert('Your Google Calendar session has expired or is invalid. Please sign out and sign back in with Google to re-enable syncing.');
                    return;
                  }

                  if (!response.ok) {
                    console.error('Calendar sync failed');
                    return;
                  }

                  queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
                } catch (error) {
                  console.error('Calendar sync error:', error);
                }
              }}
              sx={{
                color: '#E2C05A',
                borderColor: 'rgba(226, 192, 90, 0.5)',
                fontWeight: 600,
                textTransform: 'none',
                height: '36px',
                '&:hover': {
                  borderColor: '#E2C05A',
                  backgroundColor: 'rgba(226, 192, 90, 0.08)',
                }
              }}
            >
              Sync Calendar
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Search and Filters - Sticky */}
            <Box sx={{ position: 'sticky', top: 0, zIndex: 10, p: 2, backgroundColor: '#121212', borderBottom: '1px solid #2A2A2A', display: 'flex', gap: 2, flexWrap: 'wrap', flexShrink: 0 }}>
              <TextField
                size="small"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  flex: 1,
                  minWidth: '250px',
                  ...dashboardStyles.textField,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0D0D0D',
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: '140px' }}>
                <InputLabel sx={{ color: '#B0B0B0' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#0D0D0D',
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="qualified">Qualified</MenuItem>
                  <MenuItem value="converted">Converted</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: '150px' }}>
                <InputLabel sx={{ color: '#B0B0B0' }}>Lead Type</InputLabel>
                <Select
                  value={contactTypeFilter}
                  label="Lead Type"
                  onChange={(e) => setContactTypeFilter(e.target.value)}
                  sx={{
                    backgroundColor: '#0D0D0D',
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                  }}
                >
                  <MenuItem value="all">All Contacts</MenuItem>
                  <MenuItem value="buyer">Buyers</MenuItem>
                  <MenuItem value="seller">Sellers</MenuItem>
                  <MenuItem value="landlord">Landlords</MenuItem>
                  <MenuItem value="tenant">Tenants</MenuItem>
                  <MenuItem value="lead">Leads</MenuItem>
                </Select>
              </FormControl>
              {(searchQuery || statusFilter !== 'all' || contactTypeFilter !== 'all') && (
                <Button
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setContactTypeFilter('all');
                  }}
                  sx={{ color: '#B0B0B0', textTransform: 'none' }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>

            <Box sx={{
              flex: 1,
              overflow: 'auto',
              p: 3,
              backgroundColor: '#0D0D0D',
              '&::-webkit-scrollbar': { width: '8px' },
              '&::-webkit-scrollbar-track': { backgroundColor: '#0D0D0D' },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#2A2A2A',
                borderRadius: '4px',
                '&:hover': { backgroundColor: '#333333' },
              },
            }}>
              {filteredAndSortedContacts && filteredAndSortedContacts.length > 0 ? (
                <Grid container spacing={2}>
                  {filteredAndSortedContacts.map((contact: any) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={contact.id}>
                      <Card
                        onClick={() => handleRowClick(contact)}
                        sx={{
                          ...dashboardStyles.paper,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: '#E2C05A',
                            boxShadow: '0 4px 12px 0 rgba(226, 192, 90, 0.2)',
                          },
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1, p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getLeadTypeIcon(contact.contact_type)}
                              <Chip
                                label={getLeadTypeLabel(contact.contact_type)}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(226, 192, 90, 0.1)',
                                  color: '#EDD48A',
                                  border: '1px solid rgba(226, 192, 90, 0.3)',
                                  fontWeight: 600,
                                  fontSize: '0.65rem',
                                }}
                              />
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => handleActionsClick(e, contact)}
                              sx={{ color: '#B0B0B0', padding: '4px' }}
                            >
                              <DotsThree size={20} weight="bold" />
                            </IconButton>
                          </Box>

                          <Typography
                            variant="h6"
                            sx={{
                              color: '#FFFFFF',
                              fontWeight: 600,
                              fontSize: '1rem',
                              mb: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {contact.first_name} {contact.last_name}
                          </Typography>

                          {contact.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                              <Envelope size={14} color="#B0B0B0" weight="duotone" />
                              <Typography
                                component="a"
                                href={`mailto:${contact.email}`}
                                onClick={(e: any) => e.stopPropagation()}
                                sx={{
                                  color: '#E2C05A',
                                  fontSize: '0.75rem',
                                  textDecoration: 'none',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                              >
                                {contact.email}
                              </Typography>
                            </Box>
                          )}

                          {contact.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                              <Phone size={14} color="#B0B0B0" weight="duotone" />
                              <Typography
                                component="a"
                                href={`tel:${contact.phone}`}
                                onClick={(e: any) => e.stopPropagation()}
                                sx={{
                                  color: '#E2C05A',
                                  fontSize: '0.75rem',
                                  textDecoration: 'none',
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                              >
                                {formatPhone(contact.phone)}
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                            <Chip
                              label={formatStatus(contact.status)}
                              size="small"
                              sx={{
                                backgroundColor: `${getStatusColor(contact.status)}20`,
                                color: getStatusColor(contact.status),
                                border: `1px solid ${getStatusColor(contact.status)}40`,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                        </CardContent>

                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            p: 1.5,
                            borderTop: '1px solid #2A2A2A',
                            backgroundColor: '#0D0D0D',
                          }}
                        >
                          <Button
                            size="small"
                            startIcon={<Eye size={16} weight="duotone" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(contact);
                            }}
                            sx={{
                              flex: 1,
                              color: '#EDD48A',
                              fontSize: '0.7rem',
                              textTransform: 'none',
                              '&:hover': { backgroundColor: 'rgba(100, 181, 246, 0.1)' },
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            startIcon={<PencilSimple size={16} weight="duotone" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditContact(contact);
                            }}
                            sx={{
                              flex: 1,
                              color: '#E2C05A',
                              fontSize: '0.7rem',
                              textTransform: 'none',
                              '&:hover': { backgroundColor: 'rgba(226, 192, 90, 0.1)' },
                            }}
                          >
                            Edit
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                    {searchQuery || statusFilter !== 'all' || contactTypeFilter !== 'all'
                      ? 'No contacts match your filters.'
                      : 'No contacts yet. Add your first contact to get started.'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </TabPanel>

        {/* Tasks Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            backgroundColor: '#0D0D0D',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { backgroundColor: '#0D0D0D' },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#2A2A2A',
              borderRadius: '4px',
              '&:hover': { backgroundColor: '#333333' },
            },
          }}>
            {sortedTasks && sortedTasks.length > 0 ? (
              <Grid container spacing={2}>
                {sortedTasks.map((task: any) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={task.id}>
                    <Card
                      onClick={() => {
                        setSelectedTask(task);
                        setTaskDetailsOpen(true);
                      }}
                      sx={{
                        ...dashboardStyles.paper,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          borderColor: '#E2C05A',
                          boxShadow: '0 4px 12px 0 rgba(226, 192, 90, 0.2)',
                        },
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Chip
                            label={(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                            size="small"
                            sx={{
                              backgroundColor: (task.priority || 'medium') === 'high'
                                ? 'rgba(239, 68, 68, 0.1)'
                                : (task.priority || 'medium') === 'medium'
                                  ? 'rgba(251, 191, 36, 0.1)'
                                  : 'rgba(34, 197, 94, 0.1)',
                              color: (task.priority || 'medium') === 'high'
                                ? '#EF4444'
                                : (task.priority || 'medium') === 'medium'
                                  ? '#FBBF24'
                                  : '#22C55E',
                              border: (task.priority || 'medium') === 'high'
                                ? '1px solid rgba(239, 68, 68, 0.3)'
                                : (task.priority || 'medium') === 'medium'
                                  ? '1px solid rgba(251, 191, 36, 0.3)'
                                  : '1px solid rgba(34, 197, 94, 0.3)',
                              fontWeight: 600,
                              fontSize: '0.65rem',
                            }}
                          />
                          <Chip
                            label={task.completed ? 'Completed' : 'Pending'}
                            size="small"
                            sx={{
                              backgroundColor: task.completed
                                ? 'rgba(34, 197, 94, 0.1)'
                                : 'rgba(148, 163, 184, 0.1)',
                              color: task.completed ? '#22C55E' : '#94A3B8',
                              border: task.completed
                                ? '1px solid rgba(34, 197, 94, 0.3)'
                                : '1px solid rgba(148, 163, 184, 0.3)',
                              fontWeight: 600,
                              fontSize: '0.65rem',
                            }}
                          />
                        </Box>

                        <Typography
                          variant="h6"
                          sx={{
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '1rem',
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: '3em',
                          }}
                        >
                          {task.title}
                        </Typography>

                        {task.description && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#B0B0B0',
                              fontSize: '0.75rem',
                              mb: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {task.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 'auto' }}>
                          <CalendarBlank size={14} color="#B0B0B0" weight="duotone" />
                          <Typography
                            variant="caption"
                            sx={{
                              color: task.due_date && new Date(task.due_date) < new Date() && !task.completed
                                ? '#EF4444'
                                : '#B0B0B0',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                            }}
                          >
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit'
                              })
                              : 'No due date'}
                          </Typography>
                        </Box>
                      </CardContent>

                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          p: 1.5,
                          borderTop: '1px solid #2A2A2A',
                          backgroundColor: '#0D0D0D',
                        }}
                      >
                        <Button
                          size="small"
                          startIcon={<PencilSimple size={16} weight="duotone" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                            setTaskDialogOpen(true);
                          }}
                          sx={{
                            flex: 1,
                            color: '#E2C05A',
                            fontSize: '0.7rem',
                            textTransform: 'none',
                            '&:hover': { backgroundColor: 'rgba(226, 192, 90, 0.1)' },
                          }}
                        >
                          Edit
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                  No tasks yet. Create your first task to stay organized.
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Calendar Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            overflow: 'hidden',
            minHeight: 0,
            height: '100%',
          }}>
            {/* Top Bar: View Toggle + Legend Chips */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              flexWrap: 'wrap',
              gap: 2,
            }}>
              {/* View Toggle + Add Event Button */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <ToggleButtonGroup
                  value={calendarView}
                  exclusive
                  onChange={(_, newView) => {
                    if (newView !== null) {
                      setCalendarView(newView);
                    }
                  }}
                  sx={{
                    '& .MuiToggleButton-root': {
                      color: '#B0B0B0',
                      borderColor: '#2A2A2A',
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: 'rgba(226, 192, 90, 0.1)',
                        borderColor: '#2A2A2A',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#E2C05A',
                        color: '#FFFFFF',
                        borderColor: '#E2C05A',
                        '&:hover': {
                          backgroundColor: '#C4A43B',
                          borderColor: '#C4A43B',
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="month">Month</ToggleButton>
                  <ToggleButton value="agenda">Agenda</ToggleButton>
                </ToggleButtonGroup>

                <Button
                  variant="contained"
                  startIcon={<Plus weight="bold" />}
                  onClick={() => setMeetingModalOpen(true)}
                  sx={{
                    backgroundColor: '#E2C05A',
                    color: '#FFFFFF',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    '&:hover': {
                      backgroundColor: '#C4A43B',
                    },
                  }}
                >
                  Event
                </Button>
              </Box>

              {/* Legend Chips */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  label="Tasks"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(25, 118, 210, 0.15)',
                    color: '#EDD48A',
                    border: '1px solid rgba(25, 118, 210, 0.3)',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                />
                <Chip
                  label="Tours"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(0, 188, 212, 0.15)',
                    color: '#4DD0E1',
                    border: '1px solid rgba(0, 188, 212, 0.3)',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                />
                <Chip
                  label="Transactions"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(46, 125, 50, 0.15)',
                    color: '#66BB6A',
                    border: '1px solid rgba(46, 125, 50, 0.3)',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                />
                <Chip
                  label="Deals"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(156, 39, 176, 0.15)',
                    color: '#BA68C8',
                    border: '1px solid rgba(156, 39, 176, 0.3)',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                />
                <Chip
                  label="Brokerage"
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(237, 108, 2, 0.15)',
                    color: '#FF9800',
                    border: '1px solid rgba(237, 108, 2, 0.3)',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Box>

            {/* Calendar Container - Full Width */}
            <Box sx={{
              flex: 1,
              minHeight: 0,
              backgroundColor: '#0D0D0D',
              border: '1px solid #2A2A2A',
              borderRadius: '8px',
              overflow: 'hidden',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              '& .fc': {
                color: '#FFFFFF',
                fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif',
                height: '100%',
              },
              '& .fc-toolbar': {
                marginBottom: '16px',
              },
              '& .fc-toolbar-title': {
                color: '#FFFFFF',
                fontSize: '1.25rem',
                fontWeight: 600,
              },
              '& .fc-button': {
                color: '#FFFFFF',
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '6px',
                padding: '6px 12px',
                textTransform: 'capitalize',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#E2C05A',
                  borderColor: '#E2C05A',
                  color: '#FFFFFF',
                },
                '&:disabled': {
                  color: '#4A4A4A',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                },
                '&:focus': {
                  outline: 'none',
                  boxShadow: '0 0 0 2px rgba(226, 192, 90, 0.2)',
                },
              },
              '& .fc-button-active': {
                backgroundColor: '#E2C05A',
                borderColor: '#E2C05A',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#C4A43B',
                  borderColor: '#C4A43B',
                },
              },
              '& .fc-button-group': {
                gap: '4px',
              },
              '& .fc-col-header': {
                backgroundColor: '#0D0D0D',
              },
              '& .fc-col-header-cell': {
                padding: '8px',
                borderColor: '#2A2A2A',
              },
              '& .fc-col-header-cell-cushion': {
                color: '#B0B0B0',
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
              '& .fc-daygrid-day': {
                borderColor: '#2A2A2A',
              },
              '& .fc-daygrid-day-frame': {
                minHeight: '80px',
              },
              '& .fc-daygrid-day-top': {
                padding: '6px',
              },
              '& .fc-daygrid-day-number': {
                color: '#FFFFFF',
                padding: '2px 6px',
                fontSize: '0.8rem',
                fontWeight: 500,
              },
              '& .fc-day-today': {
                backgroundColor: 'rgba(226, 192, 90, 0.05)',
                '& .fc-daygrid-day-number': {
                  backgroundColor: '#E2C05A',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                },
              },
              '& .fc-day-past': {
                backgroundColor: '#0A0A0A',
              },
              '& .fc-event': {
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '3px',
                padding: '1px 4px',
                marginBottom: '1px',
                fontSize: '0.7rem',
                fontWeight: 500,
              },
              '& .fc-event-title': {
                color: '#FFFFFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
              '& .fc-scrollgrid': {
                borderColor: '#2A2A2A',
              },
              '& .fc-scrollgrid-section-body table': {
                borderColor: '#2A2A2A',
              },
            }}>
              {calendarLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <Typography sx={{ color: '#B0B0B0' }}>Loading calendar...</Typography>
                </Box>
              ) : (
                <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
                  {calendarView === 'month' ? (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      '& .fc': {
                        height: 'calc(100vh - 220px) !important'
                      }
                    }}>
                      <FullCalendar
                        key={tabValue === 2 ? 'month-view-active' : 'month-view-hidden'}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                          left: 'prev,next today',
                          center: 'title',
                          right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        events={calendarEvents || []}
                        editable={true}
                        selectable={true}
                        height="100%"
                      />
                    </Box>
                  ) : (
                    <Box sx={{
                      height: '100%',
                      overflow: 'auto',
                      backgroundColor: '#0D0D0D',
                      border: '1px solid #2A2A2A',
                      borderRadius: '6px',
                    }}>
                      {/* Agenda View */}
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: '#B0B0B0', fontWeight: 600, borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem' }}>Date</TableCell>
                              <TableCell sx={{ color: '#B0B0B0', fontWeight: 600, borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem' }}>Time</TableCell>
                              <TableCell sx={{ color: '#B0B0B0', fontWeight: 600, borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem' }}>Event</TableCell>
                              <TableCell sx={{ color: '#B0B0B0', fontWeight: 600, borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem' }}>Type</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(() => {
                              // Get upcoming events for next 30 days
                              const now = new Date();
                              const thirtyDaysFromNow = new Date();
                              thirtyDaysFromNow.setDate(now.getDate() + 30);

                              const upcomingEvents = (calendarEvents || [])
                                .filter((event: any) => {
                                  const eventDate = new Date(event.start);
                                  return eventDate >= now && eventDate <= thirtyDaysFromNow;
                                })
                                .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

                              if (upcomingEvents.length === 0) {
                                return (
                                  <TableRow>
                                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: '#808080', borderBottom: '1px solid #2A2A2A' }}>
                                      No upcoming events in the next 30 days
                                    </TableCell>
                                  </TableRow>
                                );
                              }

                              // Group events by date
                              const eventsByDate: { [key: string]: any[] } = {};
                              upcomingEvents.forEach((event: any) => {
                                const dateKey = new Date(event.start).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                });
                                if (!eventsByDate[dateKey]) {
                                  eventsByDate[dateKey] = [];
                                }
                                eventsByDate[dateKey].push(event);
                              });

                              return Object.entries(eventsByDate).map(([date, events], dateIndex) => {
                                return events.map((event: any, eventIndex: number) => {
                                  const eventTime = new Date(event.start).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  });

                                  // Determine event type color
                                  let typeColor = '#B0B0B0';
                                  let typeBg = 'rgba(176, 176, 176, 0.1)';
                                  let typeLabel = 'Event';

                                  if (event.backgroundColor === '#C4A43B' || event.source === 'task') {
                                    typeColor = '#EDD48A';
                                    typeBg = 'rgba(226, 192, 90, 0.15)';
                                    typeLabel = 'Task';
                                  } else if (event.backgroundColor === '#00bcd4' || event.source === 'tour') {
                                    typeColor = '#4DD0E1';
                                    typeBg = 'rgba(0, 188, 212, 0.15)';
                                    typeLabel = 'Tour';
                                  } else if (event.backgroundColor === '#2e7d32' || event.source === 'transaction') {
                                    typeColor = '#66BB6A';
                                    typeBg = 'rgba(46, 125, 50, 0.15)';
                                    typeLabel = 'Transaction';
                                  } else if (event.backgroundColor === '#9c27b0' || event.source === 'deal') {
                                    typeColor = '#BA68C8';
                                    typeBg = 'rgba(156, 39, 176, 0.15)';
                                    typeLabel = 'Deal';
                                  } else if (event.backgroundColor === '#ed6c02' || event.source === 'custom') {
                                    typeColor = '#FF9800';
                                    typeBg = 'rgba(237, 108, 2, 0.15)';
                                    typeLabel = 'Brokerage';
                                  }

                                  return (
                                    <TableRow
                                      key={`${dateIndex}-${eventIndex}`}
                                      sx={{
                                        '&:hover': {
                                          backgroundColor: '#1A1A1A',
                                        },
                                      }}
                                    >
                                      {eventIndex === 0 ? (
                                        <TableCell
                                          rowSpan={events.length}
                                          sx={{
                                            color: '#FFFFFF',
                                            fontWeight: 600,
                                            borderBottom: '1px solid #2A2A2A',
                                            borderRight: '1px solid #2A2A2A',
                                            verticalAlign: 'top',
                                            py: 1.5,
                                            fontSize: '0.75rem',
                                          }}
                                        >
                                          {date}
                                        </TableCell>
                                      ) : null}
                                      <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A', whiteSpace: 'nowrap', fontSize: '0.75rem', py: 1 }}>
                                        {eventTime}
                                      </TableCell>
                                      <TableCell sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem', py: 1 }}>
                                        {event.title}
                                      </TableCell>
                                      <TableCell sx={{ borderBottom: '1px solid #2A2A2A', py: 1 }}>
                                        <Chip
                                          label={typeLabel}
                                          size="small"
                                          sx={{
                                            backgroundColor: typeBg,
                                            color: typeColor,
                                            fontWeight: 500,
                                            fontSize: '0.65rem',
                                            border: `1px solid ${typeColor}30`,
                                            height: '20px',
                                          }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                });
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </TabPanel>
      </Box>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth sx={dashboardStyles.dialog}>
        <DialogTitle sx={dashboardStyles.dialog}>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        <DialogContent sx={dashboardStyles.dialog}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={contactForm.first_name}
                onChange={(e) => setContactForm({ ...contactForm, first_name: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={contactForm.last_name}
                onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#B0B0B0' }}>Contact Type</InputLabel>
                <Select
                  value={contactForm.contact_type}
                  label="Contact Type"
                  onChange={(e) => setContactForm({ ...contactForm, contact_type: e.target.value })}
                  sx={{
                    backgroundColor: '#0D0D0D',
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E2C05A' },
                  }}
                >
                  <MenuItem value="buyer">Buyer</MenuItem>
                  <MenuItem value="seller">Seller</MenuItem>
                  <MenuItem value="landlord">Landlord</MenuItem>
                  <MenuItem value="tenant">Tenant</MenuItem>
                  <MenuItem value="lead">Lead</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#B0B0B0' }}>Status</InputLabel>
                <Select
                  value={contactForm.status}
                  label="Status"
                  onChange={(e) => setContactForm({ ...contactForm, status: e.target.value })}
                  sx={{
                    backgroundColor: '#0D0D0D',
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E2C05A' },
                  }}
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="qualified">Qualified</MenuItem>
                  <MenuItem value="converted">Converted</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Source"
                value={contactForm.source}
                onChange={(e) => setContactForm({ ...contactForm, source: e.target.value })}
                placeholder="Website, Referral, etc."
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={contactForm.notes}
                onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                sx={dashboardStyles.textField}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={dashboardStyles.dialog}>
          <Button onClick={() => setContactDialogOpen(false)} sx={dashboardStyles.button}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveContact}
            disabled={createContactMutation.isPending || updateContactMutation.isPending}
            sx={dashboardStyles.button}
          >
            {editingContact ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Deal Dialog */}
      <Dialog open={dealDialogOpen} onClose={() => setDealDialogOpen(false)} maxWidth="sm" fullWidth sx={dashboardStyles.dialog}>
        <DialogTitle sx={dashboardStyles.dialog}>Create New Deal</DialogTitle>
        <DialogContent sx={dashboardStyles.dialog}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Deal Title"
                value={dealForm.title}
                onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#B0B0B0' }}>Contact</InputLabel>
                <Select
                  value={dealForm.contact_id}
                  label="Contact"
                  onChange={(e) => setDealForm({ ...dealForm, contact_id: e.target.value })}
                  sx={{
                    backgroundColor: '#0D0D0D',
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E2C05A' },
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {contactsList?.map((contact: any) => (
                    <MenuItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#B0B0B0' }}>Stage</InputLabel>
                <Select
                  value={dealForm.stage}
                  label="Stage"
                  onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                  sx={{
                    backgroundColor: '#0D0D0D',
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E2C05A' },
                  }}
                >
                  <MenuItem value="lead">Lead</MenuItem>
                  <MenuItem value="qualified">Qualified</MenuItem>
                  <MenuItem value="proposal">Proposal</MenuItem>
                  <MenuItem value="negotiation">Negotiation</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Value"
                type="number"
                value={dealForm.value}
                onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Probability (%)"
                type="number"
                value={dealForm.probability}
                onChange={(e) => setDealForm({ ...dealForm, probability: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0, max: 100 }}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expected Close Date"
                type="date"
                value={dealForm.expected_close_date}
                onChange={(e) => setDealForm({ ...dealForm, expected_close_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={dealForm.notes}
                onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                sx={dashboardStyles.textField}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={dashboardStyles.dialog}>
          <Button onClick={() => setDealDialogOpen(false)} sx={dashboardStyles.button}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createDealMutation.mutate(dealForm)}
            disabled={createDealMutation.isPending || !dealForm.title}
            sx={dashboardStyles.button}
          >
            {createDealMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="sm" fullWidth sx={dashboardStyles.dialog}>
        <DialogTitle sx={dashboardStyles.dialog}>Create New Task</DialogTitle>
        <DialogContent sx={dashboardStyles.dialog}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="datetime-local"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#B0B0B0' }}>Priority</InputLabel>
                <Select
                  value={taskForm.priority}
                  label="Priority"
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  sx={{
                    backgroundColor: '#0D0D0D',
                    color: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E2C05A' },
                  }}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={dashboardStyles.dialog}>
          <Button onClick={() => setTaskDialogOpen(false)} sx={dashboardStyles.button}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createTaskMutation.mutate(taskForm)}
            disabled={createTaskMutation.isPending}
            sx={dashboardStyles.button}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Actions Menu */}
      <Menu
        anchorEl={actionsAnchorEl}
        open={Boolean(actionsAnchorEl)}
        onClose={handleActionsClose}
        PaperProps={{
          sx: {
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.8)',
          },
        }}
      >
        <MenuItem
          onClick={handleEditFromMenu}
          sx={{
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#2A2A2A' },
          }}
        >
          <PencilSimple size={18} weight="duotone" style={{ marginRight: 8 }} />
          Edit Contact
        </MenuItem>
        <MenuItem
          onClick={() => menuContact && handleCreateTask(menuContact)}
          sx={{
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#2A2A2A' },
          }}
        >
          <Checks size={18} weight="duotone" style={{ marginRight: 8 }} />
          Create Task
        </MenuItem>
        <MenuItem
          onClick={() => menuContact && handleCreateMeeting(menuContact)}
          sx={{
            color: '#FFFFFF',
            '&:hover': { backgroundColor: '#2A2A2A' },
          }}
        >
          <CalendarBlank size={18} weight="duotone" style={{ marginRight: 8 }} />
          Create Meeting
        </MenuItem>
      </Menu>

      {/* Contact Details Drawer */}
      <ContactDetailsDrawer
        open={contactDetailsOpen}
        contact={selectedContact}
        onClose={() => setContactDetailsOpen(false)}
        onEdit={(contact) => {
          setContactDetailsOpen(false);
          handleEditContact(contact);
        }}
        onCreateTask={(contact) => {
          setContactDetailsOpen(false);
          handleCreateTask(contact);
        }}
        onCreateMeeting={(contact) => {
          setContactDetailsOpen(false);
          handleCreateMeeting(contact);
        }}
      />

      {/* Task Details Drawer */}
      <TaskDetailsDrawer
        open={taskDetailsOpen}
        task={selectedTask}
        onClose={() => setTaskDetailsOpen(false)}
        onEdit={(task) => {
          setTaskDetailsOpen(false);
          setEditingTask(task);
          setTaskDialogOpen(true);
        }}
        onDelete={() => {
          setTaskDetailsOpen(false);
          setSelectedTask(null);
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        open={taskModalOpen}
        contact={selectedContact}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
      />

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        open={meetingModalOpen}
        contact={selectedContact}
        onClose={() => setMeetingModalOpen(false)}
        onSubmit={handleMeetingSubmit}
      />
      {/* Calendar Session Expired Error Modal */}
      <Dialog
        open={calendarErrorDialogOpen}
        onClose={() => setCalendarErrorDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A' }}>
          Session Expired
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ color: '#E0E0E0' }}>
            Your Google Calendar session has expired or is invalid. Please sign out and sign back in with Google to re-enable syncing.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #2A2A2A', p: 2 }}>
          <Button
            onClick={() => setCalendarErrorDialogOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: '#E2C05A',
              '&:hover': { backgroundColor: '#C4A43B' },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile Floating Action Buttons - Contacts Tab */}
      {tabValue === 0 && (
        <Fab
          color="primary"
          aria-label="add contact"
          onClick={() => {
            setEditingContact(null);
            setContactForm({
              first_name: '',
              last_name: '',
              email: '',
              phone: '',
              contact_type: 'lead',
              status: 'new',
              source: '',
              notes: '',
            });
            setContactDialogOpen(true);
          }}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#E2C05A',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#C4A43B',
            },
            zIndex: 1000,
          }}
        >
          <UserCirclePlus size={28} weight="duotone" />
        </Fab>
      )}

      {/* Mobile Floating Action Buttons - Tasks Tab */}
      {tabValue === 1 && (
        <Fab
          color="primary"
          aria-label="add task"
          onClick={() => {
            setEditingTask(null);
            setTaskForm({
              title: '',
              description: '',
              due_date: '',
              priority: 'medium',
              status: 'pending',
              contact_id: '',
              deal_id: '',
            });
            setTaskDialogOpen(true);
          }}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#E2C05A',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#C4A43B',
            },
            zIndex: 1000,
          }}
        >
          <Plus size={28} weight="bold" />
        </Fab>
      )}
    </Box>
  );
}
