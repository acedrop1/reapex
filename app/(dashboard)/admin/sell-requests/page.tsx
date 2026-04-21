'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import {
  Home as HomeIcon,
  Phone,
  Email,
  Visibility,
  PersonAdd,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface SellRequest {
  id: string;
  name: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string;
  notes: string | null;
  metadata: {
    property_address?: string;
    property_type?: string;
    estimated_value?: number;
    request_type?: string;
  } | null;
  created_at: string;
  agent_id: string | null;
  archived: boolean;
}

export default function SellRequestsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<SellRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Fetch sell requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['sell-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, users!contacts_agent_id_fkey(full_name, email)')
        .eq('source', 'sell_page')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SellRequest[];
    },
  });

  // Fetch agents for assignment
  const { data: agents } = useQuery({
    queryKey: ['agents-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('role', ['agent'])
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });

  // Convert to CRM contact mutation
  const convertMutation = useMutation({
    mutationFn: async ({ requestId, agentId }: { requestId: string; agentId: string }) => {
      const { error } = await supabase
        .from('contacts')
        .update({
          agent_id: agentId,
          status: 'contacted',
          source: 'sell_page_converted',
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sell-requests'] });
      setShowConvertDialog(false);
      setSelectedRequest(null);
      setSelectedAgentId('');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return dashboardStyles.chipInfo;
      case 'contacted':
        return dashboardStyles.chipWarning;
      case 'qualified':
        return dashboardStyles.chipSuccess;
      default:
        return dashboardStyles.chip;
    }
  };

  const handleViewDetails = (request: SellRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const handleConvert = (request: SellRequest) => {
    setSelectedRequest(request);
    setShowConvertDialog(true);
  };

  const handleConfirmConvert = () => {
    if (selectedRequest && selectedAgentId) {
      convertMutation.mutate({
        requestId: selectedRequest.id,
        agentId: selectedAgentId,
      });
    }
  };

  // Archive/unarchive mutation
  const archiveMutation = useMutation({
    mutationFn: async ({ requestId, archived }: { requestId: string; archived: boolean }) => {
      const { error } = await supabase
        .from('contacts')
        .update({ archived: !archived })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sell-requests'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sell-requests'] });
    },
  });

  const handleArchive = (request: SellRequest) => {
    archiveMutation.mutate({ requestId: request.id, archived: request.archived });
  };

  const handleDelete = (request: SellRequest) => {
    if (!confirm('Are you sure you want to delete this sell request? This action cannot be undone.')) return;
    deleteMutation.mutate(request.id);
  };

  // Filter requests based on archived status
  const filteredRequests = requests?.filter(request =>
    showArchived || !request.archived
  ) || [];

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      {/* Filter Bar - Sticky */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 5, p: 2, backgroundColor: '#121212', borderBottom: '1px solid #2A2A2A', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              sx={{
                color: '#B0B0B0',
                '&.Mui-checked': {
                  color: '#E2C05A',
                },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
              Show Archived
            </Typography>
          }
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : filteredRequests.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'center' }}>
          <Typography variant="body1" sx={{ color: '#666666' }}>
            No sell requests found
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#121212',
          minHeight: 0,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#0D0D0D',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#2A2A2A',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#333333',
            },
          },
        }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#2A2A2A' }}>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Property Address</TableCell>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Contact</TableCell>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Assigned To</TableCell>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Submitted</TableCell>
                <TableCell sx={{ color: '#B0B0B0', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                      {request.name || `${request.first_name} ${request.last_name}`.trim()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {request.metadata?.property_address || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                      {request.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 16, color: '#B0B0B0' }} />
                          <Typography variant="caption" sx={{ color: '#B0B0B0' }}>{request.email}</Typography>
                        </Box>
                      )}
                      {request.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 16, color: '#B0B0B0' }} />
                          <Typography variant="caption">{request.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      size="small"
                      sx={getStatusColor(request.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {request.agent_id ? (
                      <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                        {(request as any).users?.full_name || 'Assigned'}
                      </Typography>
                    ) : (
                      <Chip label="Unassigned" size="small" sx={dashboardStyles.chipWarning} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {new Date(request.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(request)}
                        title="View Details"
                        sx={{ color: '#E2C05A' }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      {!request.agent_id && (
                        <IconButton
                          size="small"
                          onClick={() => handleConvert(request)}
                          title="Convert to CRM & Assign"
                          sx={{ color: '#4CAF50' }}
                        >
                          <PersonAdd fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleArchive(request)}
                        title={request.archived ? 'Unarchive' : 'Archive'}
                        sx={{ color: request.archived ? '#FFB74D' : '#B0B0B0' }}
                      >
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(request)}
                        title="Delete"
                        sx={{ color: '#EF5350' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        sx={dashboardStyles.dialog}
      >
        <DialogTitle>Sell Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#B0B0B0', mb: 0.5 }}>
                  Contact Information
                </Typography>
                <Typography variant="body1">
                  <strong>Name:</strong> {selectedRequest.name || `${selectedRequest.first_name} ${selectedRequest.last_name}`.trim()}
                </Typography>
                {selectedRequest.email && (
                  <Typography variant="body1"><strong>Email:</strong> {selectedRequest.email}</Typography>
                )}
                {selectedRequest.phone && (
                  <Typography variant="body1"><strong>Phone:</strong> {selectedRequest.phone}</Typography>
                )}
              </Box>

              {selectedRequest.metadata && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#B0B0B0', mb: 0.5 }}>
                    Property Information
                  </Typography>
                  {selectedRequest.metadata.property_address && (
                    <Typography variant="body1">
                      <strong>Address:</strong> {selectedRequest.metadata.property_address}
                    </Typography>
                  )}
                  {selectedRequest.metadata.property_type && (
                    <Typography variant="body1">
                      <strong>Type:</strong> {selectedRequest.metadata.property_type}
                    </Typography>
                  )}
                  {selectedRequest.metadata.estimated_value && (
                    <Typography variant="body1">
                      <strong>Estimated Value:</strong> ${selectedRequest.metadata.estimated_value.toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}

              {selectedRequest.notes && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#B0B0B0', mb: 0.5 }}>
                    Message
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedRequest.notes}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" sx={{ color: '#B0B0B0', mb: 0.5 }}>
                  Request Status
                </Typography>
                <Typography variant="body1">
                  <strong>Status:</strong> {selectedRequest.status}
                </Typography>
                <Typography variant="body1">
                  <strong>Submitted:</strong> {new Date(selectedRequest.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Convert to CRM Dialog */}
      <Dialog
        open={showConvertDialog}
        onClose={() => setShowConvertDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={dashboardStyles.dialog}
      >
        <DialogTitle>Convert to CRM Contact</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedRequest && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Converting this sell request to a CRM contact for:{' '}
                <strong>{selectedRequest.name || `${selectedRequest.first_name} ${selectedRequest.last_name}`.trim()}</strong>
              </Alert>
            )}
            <FormControl fullWidth sx={dashboardStyles.textField}>
              <InputLabel>Assign to Agent</InputLabel>
              <Select
                value={selectedAgentId}
                label="Assign to Agent"
                onChange={(e) => setSelectedAgentId(e.target.value)}
              >
                {agents?.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.full_name || agent.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConvertDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmConvert}
            variant="contained"
            disabled={!selectedAgentId || convertMutation.isPending}
            sx={dashboardStyles.buttonContained}
          >
            {convertMutation.isPending ? 'Converting...' : 'Convert & Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
