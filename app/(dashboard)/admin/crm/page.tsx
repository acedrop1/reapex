'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  MagnifyingGlass as SearchIcon,
  User as UserIcon,
  Envelope as EmailIcon,
  Phone as PhoneIcon,
  UserPlus as AssignIcon,
  Eye as ViewIcon,
  Trash as DeleteIcon,
} from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { format } from 'date-fns';

interface Contact {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  metadata: any;
  created_at: string;
  contact_agent_assignments?: Array<{
    id: string;
    agent_id: string;
    is_primary: boolean;
    agent: {
      id: string;
      full_name: string;
      email: string;
    };
  }>;
}

export default function AdminMasterCRMPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // all, assigned, unassigned
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  // Fetch Contacts
  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select(`
          *,
          contact_agent_assignments (
            id,
            agent_id,
            is_primary,
            agent:users!agent_id (
              id,
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
  });

  // Fetch Agents for Assignment
  const { data: agents } = useQuery({
    queryKey: ['admin-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'agent')
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Assign Agent Mutation
  const assignAgentMutation = useMutation({
    mutationFn: async ({ contactId, agentId }: { contactId: string; agentId: string }) => {
      const { error } = await supabase
        .from('contact_agent_assignments')
        .insert({
          contact_id: contactId,
          agent_id: agentId,
          is_primary: true, // Defaulting to primary for now
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      setAssignDialogOpen(false);
      setSelectedContact(null);
      setSelectedAgent('');
    },
  });

  // Delete Mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
    },
  });

  const handleAssignClick = (contact: Contact) => {
    setSelectedContact(contact);
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = () => {
    if (selectedContact && selectedAgent) {
      assignAgentMutation.mutate({ contactId: selectedContact.id, agentId: selectedAgent });
    }
  };

  const handleDeleteClick = (id: string) => {
    setContactToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate(contactToDelete);
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  // Filter Logic
  const filteredContacts = contacts?.filter((contact) => {
    const matchesSearch =
      (contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.includes(searchTerm));

    const matchesSource = sourceFilter === 'all' || contact.source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

    const isAssigned = contact.contact_agent_assignments && contact.contact_agent_assignments.length > 0;
    const matchesAssignment =
      assignmentFilter === 'all' ||
      (assignmentFilter === 'assigned' && isAssigned) ||
      (assignmentFilter === 'unassigned' && !isAssigned);

    return matchesSearch && matchesSource && matchesStatus && matchesAssignment;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
          Master CRM
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#1E1E1E', border: '1px solid #333' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={20} color="#B0B0B0" />
                  </InputAdornment>
                ),
              }}
              sx={dashboardStyles.textField}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small" sx={dashboardStyles.formControl}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="contacted">Contacted</MenuItem>
                <MenuItem value="qualified">Qualified</MenuItem>
                <MenuItem value="lost">Lost</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small" sx={dashboardStyles.formControl}>
              <InputLabel>Assignment</InputLabel>
              <Select
                value={assignmentFilter}
                label="Assignment"
                onChange={(e) => setAssignmentFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ backgroundColor: '#1E1E1E', border: '1px solid #333' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>Name</TableCell>
              <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>Contact Info</TableCell>
              <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>Source</TableCell>
              <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>Status</TableCell>
              <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>Assigned Agent</TableCell>
              <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>Created</TableCell>
              <TableCell sx={{ color: '#B0B0B0', borderColor: '#333', textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#B0B0B0', borderColor: '#333' }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filteredContacts && filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id} hover sx={{ '&:hover': { backgroundColor: '#252525' } }}>
                  <TableCell sx={{ color: '#fff', borderColor: '#333' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UserIcon size={18} color="#E2C05A" />
                      <Typography variant="body2">{contact.name || `${contact.first_name} ${contact.last_name}`}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {contact.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon size={14} />
                          <Typography variant="caption">{contact.email}</Typography>
                        </Box>
                      )}
                      {contact.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon size={14} />
                          <Typography variant="caption">{contact.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>
                    <Chip label={contact.source || 'Direct'} size="small" sx={{ backgroundColor: '#333', color: '#fff' }} />
                  </TableCell>
                  <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>
                    <Chip
                      label={contact.status}
                      size="small"
                      sx={{
                        backgroundColor:
                          contact.status === 'new'
                            ? 'rgba(226, 192, 90, 0.2)'
                            : contact.status === 'qualified'
                              ? 'rgba(76, 175, 80, 0.2)'
                              : 'rgba(255, 255, 255, 0.1)',
                        color:
                          contact.status === 'new'
                            ? '#EDD48A'
                            : contact.status === 'qualified'
                              ? '#81C784'
                              : '#B0B0B0',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>
                    {contact.contact_agent_assignments && contact.contact_agent_assignments.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {contact.contact_agent_assignments.map((assign) => (
                          <Chip key={assign.id} label={assign.agent?.full_name} size="small" sx={{ backgroundColor: '#004D40', color: '#A7FFEB' }} />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: '#B0B0B0', borderColor: '#333' }}>
                    {format(new Date(contact.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell sx={{ borderColor: '#333', textAlign: 'right' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="Assign to Agent">
                        <IconButton
                          size="small"
                          onClick={() => handleAssignClick(contact)}
                          sx={{
                            color: '#E2C05A',
                            '&:hover': {
                              backgroundColor: 'rgba(226, 192, 90, 0.08)',
                            },
                          }}
                        >
                          <AssignIcon size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(contact.id)}
                          sx={{
                            color: '#E57373',
                            '&:hover': {
                              backgroundColor: 'rgba(229, 115, 115, 0.08)',
                            },
                          }}
                        >
                          <DeleteIcon size={20} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#666', borderColor: '#333' }}>
                  No contacts found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assign Agent Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1E1E1E',
            color: '#FFFFFF',
            border: '1px solid #333',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333' }}>Assign Agent</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedContact && (
            <Typography variant="body2" sx={{ mb: 2, color: '#B0B0B0' }}>
              Assigning agent for contact: <strong style={{ color: '#fff' }}>{selectedContact.name || selectedContact.email}</strong>
            </Typography>
          )}
          <FormControl fullWidth sx={dashboardStyles.formControl}>
            <InputLabel>Select Agent</InputLabel>
            <Select
              value={selectedAgent}
              label="Select Agent"
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              {agents?.map((agent: any) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.full_name} ({agent.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #333', p: 2 }}>
          <Button onClick={() => setAssignDialogOpen(false)} sx={{ color: '#B0B0B0' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAssignSubmit} disabled={!selectedAgent || assignAgentMutation.isPending}>
            {assignAgentMutation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1E1E1E',
            color: '#FFFFFF',
            border: '1px solid #333',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333' }}>Delete Contact</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: '#E0E0E0' }}>
            Are you sure you want to delete this contact? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #333', p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#B0B0B0' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmDelete} color="error" disabled={deleteContactMutation.isPending}>
            {deleteContactMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
