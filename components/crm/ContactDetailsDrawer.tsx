'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Button,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  X,
  PencilSimple,
  CheckSquare,
  CalendarBlank,
  Envelope,
  Phone,
  MapPin,
  Buildings,
  User,
  Tag,
  Plus,
  Trash,
  ListChecks,
  ChatCircleDots,
  VideoCamera,
  Note,
  Clock,
  UploadSimple,
  File as FileIcon,
  FilePdf,
  FileDoc,
  FileXls,
  FileImage,
  DownloadSimple,
} from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  phone_secondary?: string;
  contact_type?: string;
  source?: string;
  status: string;
  company?: string;
  job_title?: string;
  address?: string;
  city?: string;
  emirate?: string;
  country?: string;
  notes?: string;
  tags?: string[];
  file_urls?: string[];
  attachment_names?: string[];
  attachment_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface ContactDetailsDrawerProps {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onCreateTask: (contact: Contact) => void;
  onCreateMeeting: (contact: Contact) => void;
}

export default function ContactDetailsDrawer({
  open,
  contact,
  onClose,
  onEdit,
  onCreateTask,
  onCreateMeeting,
}: ContactDetailsDrawerProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [attachTaskDialogOpen, setAttachTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');
  const [taskUrgency, setTaskUrgency] = useState('medium');

  // File attachment states
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Communication history states
  const [logCommDialogOpen, setLogCommDialogOpen] = useState(false);
  const [commForm, setCommForm] = useState({
    type: 'call',
    direction: 'outbound',
    subject: '',
    notes: '',
    occurred_at: new Date().toISOString().slice(0, 16),
  });

  // Fetch tasks attached to this contact
  const { data: contactTasks } = useQuery({
    queryKey: ['contact-tasks', contact?.id || ''],
    queryFn: async () => {
      if (!contact) return [];
      const { data } = await supabase
        .from('contact_tasks')
        .select('*, tasks(*)')
        .eq('contact_id', contact.id);
      return data || [];
    },
    enabled: !!contact?.id,
  });

  // Fetch communication history for this contact
  const { data: communications } = useQuery({
    queryKey: ['contact-communications', contact?.id || ''],
    queryFn: async () => {
      if (!contact) return [];
      const { data } = await supabase
        .from('contact_communications')
        .select('*')
        .eq('contact_id', contact.id)
        .order('occurred_at', { ascending: false });
      return data || [];
    },
    enabled: !!contact?.id,
  });

  // Fetch all available tasks for attachment
  const { data: allTasks } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('agent_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: attachTaskDialogOpen,
  });

  // Mutation to attach task to contact
  const attachTaskMutation = useMutation({
    mutationFn: async ({ taskId, priority, urgency }: { taskId: string; priority: string; urgency: string }) => {
      if (!contact) throw new Error('No contact selected');

      const { data, error } = await supabase
        .from('contact_tasks')
        .insert({
          contact_id: contact.id,
          task_id: taskId,
          priority,
          urgency,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tasks', contact?.id || ''] });
      setAttachTaskDialogOpen(false);
      setSelectedTaskId('');
      setTaskPriority('normal');
      setTaskUrgency('medium');
    },
  });

  // Mutation to detach task from contact
  const detachTaskMutation = useMutation({
    mutationFn: async (contactTaskId: string) => {
      const { error } = await supabase
        .from('contact_tasks')
        .delete()
        .eq('id', contactTaskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tasks', contact?.id || ''] });
    },
  });

  // Mutation to log communication
  const logCommunicationMutation = useMutation({
    mutationFn: async () => {
      if (!contact) throw new Error('No contact selected');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('contact_communications')
        .insert({
          contact_id: contact.id,
          type: commForm.type,
          direction: commForm.direction,
          subject: commForm.subject,
          notes: commForm.notes,
          occurred_at: commForm.occurred_at,
          created_by: user.id,
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-communications', contact?.id || ''] });
      setLogCommDialogOpen(false);
      setCommForm({
        type: 'call',
        direction: 'outbound',
        subject: '',
        notes: '',
        occurred_at: new Date().toISOString().slice(0, 16),
      });
    },
  });

  // Mutation to upload file attachment
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!contact) throw new Error('No contact selected');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/contacts/${contact.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setUploadingFile(false);
    },
    onError: () => {
      setUploadingFile(false);
    },
  });

  // Mutation to delete file attachment
  const deleteFileMutation = useMutation({
    mutationFn: async (fileUrl: string) => {
      if (!contact) throw new Error('No contact selected');

      const response = await fetch(`/api/contacts/${contact.id}/upload?fileUrl=${encodeURIComponent(fileUrl)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete file');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const handleAttachTask = () => {
    if (!selectedTaskId) return;
    attachTaskMutation.mutate({
      taskId: selectedTaskId,
      priority: taskPriority,
      urgency: taskUrgency,
    });
  };

  const handleDetachTask = (contactTaskId: string) => {
    detachTaskMutation.mutate(contactTaskId);
  };

  // File attachment handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    uploadFileMutation.mutate(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = (fileUrl: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteFileMutation.mutate(fileUrl);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FilePdf size={20} weight="duotone" color="#F44336" />;
      case 'doc':
      case 'docx':
        return <FileDoc size={20} weight="duotone" color="#C4A43B" />;
      case 'xls':
      case 'xlsx':
        return <FileXls size={20} weight="duotone" color="#1B5E20" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <FileImage size={20} weight="duotone" color="#c49d2f" />;
      default:
        return <FileIcon size={20} weight="duotone" color="#808080" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'info';
      case 'contacted':
        return 'warning';
      case 'qualified':
      case 'converted':
        return 'success';
      case 'lost':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatContactType = (type?: string) => {
    if (!type) return '-';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatSource = (source?: string) => {
    if (!source) return '-';
    return source
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getCommIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone size={16} weight="duotone" />;
      case 'email':
        return <Envelope size={16} weight="duotone" />;
      case 'message':
        return <ChatCircleDots size={16} weight="duotone" />;
      case 'meeting':
        return <VideoCamera size={16} weight="duotone" />;
      case 'note':
        return <Note size={16} weight="duotone" />;
      default:
        return <ChatCircleDots size={16} weight="duotone" />;
    }
  };

  const formatCommType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateTimeString;
    }
  };

  if (!contact) {
    return null;
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: '450px' },
          backgroundColor: '#0A0A0A',
          borderLeft: '1px solid #2A2A2A',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: '1px solid #2A2A2A',
            }}
          >
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
              Contact Details
            </Typography>
            <IconButton onClick={onClose} size="small">
              <X size={20} color="#B0B0B0" />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {/* Name & Status */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 1 }}>
              {contact.first_name} {contact.last_name}
            </Typography>
            <Chip
              label={contact.status}
              color={getStatusColor(contact.status) as any}
              size="small"
              sx={{ ...dashboardStyles.chip, fontSize: '0.75rem' }}
            />
          </Box>

          {/* Action Buttons */}
          <Grid container spacing={1} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PencilSimple size={18} weight="duotone" />}
                onClick={() => onEdit(contact)}
                sx={{
                  ...dashboardStyles.button,
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                }}
              >
                Edit Contact
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CheckSquare size={18} weight="duotone" />}
                onClick={() => onCreateTask(contact)}
                sx={{
                  ...dashboardStyles.button,
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                }}
              >
                Create Task
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CalendarBlank size={18} weight="duotone" />}
                onClick={() => onCreateMeeting(contact)}
                sx={{
                  ...dashboardStyles.button,
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                }}
              >
                Create Meeting
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />

          {/* Contact Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 2, fontWeight: 700 }}>
              Contact Information
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {contact.email && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Envelope size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {contact.email}
                    </Typography>
                  </Box>
                </Box>
              )}

              {contact.phone && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Phone size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                      Primary Phone
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {contact.phone}
                    </Typography>
                  </Box>
                </Box>
              )}

              {contact.phone_secondary && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Phone size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                      Secondary Phone
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {contact.phone_secondary}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />

          {/* Classification */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 2, fontWeight: 700 }}>
              Classification
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {contact.contact_type && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <User size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                      Contact Type
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {formatContactType(contact.contact_type)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {contact.source && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Tag size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                      Source
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {formatSource(contact.source)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Company & Job */}
          {(contact.company || contact.job_title) && (
            <>
              <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 2, fontWeight: 700 }}>
                  Professional Information
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {contact.company && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Buildings size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                          Company
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                          {contact.company}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {contact.job_title && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <User size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                          Job Title
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                          {contact.job_title}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </>
          )}

          {/* Communication History */}
          <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#E2C05A', fontWeight: 700 }}>
                Communication History
              </Typography>
              <Button
                size="small"
                startIcon={<Plus size={16} weight="duotone" />}
                onClick={() => setLogCommDialogOpen(true)}
                sx={{
                  ...dashboardStyles.button,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1,
                }}
              >
                Log Communication
              </Button>
            </Box>

            {communications && communications.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {communications.slice(0, 5).map((comm: any) => (
                  <Box
                    key={comm.id}
                    sx={{
                      backgroundColor: '#121212',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      p: 1.5,
                      '&:hover': {
                        backgroundColor: '#1A1A1A',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box sx={{ color: '#E2C05A', mt: 0.5 }}>
                        {getCommIcon(comm.type)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                            {comm.subject || `${formatCommType(comm.type)} - ${comm.direction}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#808080', fontSize: '0.65rem' }}>
                            {formatDateTime(comm.occurred_at)}
                          </Typography>
                        </Box>
                        {comm.notes && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#B0B0B0',
                              fontSize: '0.7rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {comm.notes}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#808080', fontSize: '0.875rem', textAlign: 'center', py: 2 }}>
                No communication history yet
              </Typography>
            )}
          </Box>

          {/* Address */}
          {(contact.address || contact.city || contact.emirate || contact.country) && (
            <>
              <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 2, fontWeight: 700 }}>
                  Location
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <MapPin size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                  <Box>
                    {contact.address && (
                      <Typography variant="body2" sx={{ color: '#FFFFFF', mb: 0.5 }}>
                        {contact.address}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                      {[contact.city, contact.emirate, contact.country].filter(Boolean).join(', ')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </>
          )}

          {/* Notes */}
          {contact.notes && (
            <>
              <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 2, fontWeight: 700 }}>
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ color: '#FFFFFF', whiteSpace: 'pre-wrap' }}>
                  {contact.notes}
                </Typography>
              </Box>
            </>
          )}

          {/* File Attachments */}
          <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#E2C05A', fontWeight: 700 }}>
                File Attachments
              </Typography>
              <Button
                size="small"
                component="label"
                disabled={uploadingFile}
                startIcon={uploadingFile ? <CircularProgress size={14} /> : <UploadSimple size={16} weight="duotone" />}
                sx={{
                  ...dashboardStyles.button,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1,
                }}
              >
                {uploadingFile ? 'Uploading...' : 'Upload File'}
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
                />
              </Button>
            </Box>

            {contact.file_urls && contact.file_urls.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {contact.file_urls.map((fileUrl, index) => {
                  const fileName = contact.attachment_names?.[index] || 'Unknown file';
                  const metadata = contact.attachment_metadata?.[fileUrl];

                  return (
                    <Box
                      key={fileUrl}
                      sx={{
                        backgroundColor: '#121212',
                        border: '1px solid #2A2A2A',
                        borderRadius: '8px',
                        p: 1.5,
                        '&:hover': {
                          backgroundColor: '#1A1A1A',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ color: '#E2C05A' }}>
                          {getFileIcon(fileName)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#FFFFFF',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {fileName}
                          </Typography>
                          {metadata && (
                            <Typography variant="caption" sx={{ color: '#808080', fontSize: '0.65rem' }}>
                              {formatFileSize(metadata.size)} • {new Date(metadata.uploadedAt).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => window.open(fileUrl, '_blank')}
                            sx={{
                              color: '#E2C05A',
                              '&:hover': { backgroundColor: '#8C6D1F' },
                            }}
                          >
                            <DownloadSimple size={18} weight="duotone" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteFile(fileUrl)}
                            disabled={deleteFileMutation.isPending}
                            sx={{
                              color: '#F44336',
                              '&:hover': { backgroundColor: '#D32F2F' },
                            }}
                          >
                            <Trash size={18} weight="duotone" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#808080', fontSize: '0.875rem', textAlign: 'center', py: 2 }}>
                No files attached yet
              </Typography>
            )}
          </Box>

          {/* Attached Tasks */}
          <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: '#E2C05A', fontWeight: 700 }}>
                Attached Tasks
              </Typography>
              <Button
                size="small"
                startIcon={<Plus size={16} weight="duotone" />}
                onClick={() => setAttachTaskDialogOpen(true)}
                sx={{
                  ...dashboardStyles.button,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1,
                }}
              >
                Attach Task
              </Button>
            </Box>

            {contactTasks && contactTasks.length > 0 ? (
              <List sx={{ p: 0 }}>
                {contactTasks.map((ct: any) => (
                  <ListItem
                    key={ct.id}
                    sx={{
                      backgroundColor: '#121212',
                      border: '1px solid #2A2A2A',
                      borderRadius: '8px',
                      mb: 1,
                      '&:hover': {
                        backgroundColor: '#1A1A1A',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ListChecks size={16} color="#E2C05A" weight="duotone" />
                          <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                            {ct.tasks?.title || 'Untitled Task'}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={ct.priority || 'normal'}
                            size="small"
                            sx={{
                              ...dashboardStyles.chip,
                              fontSize: '0.65rem',
                              height: '18px',
                              textTransform: 'capitalize',
                              backgroundColor: ct.priority === 'high' ? 'rgba(239, 83, 80, 0.15)' :
                                             ct.priority === 'urgent' ? 'rgba(244, 67, 54, 0.2)' :
                                             ct.priority === 'low' ? 'rgba(76, 175, 80, 0.15)' :
                                             'rgba(226, 192, 90, 0.15)',
                              border: `1px solid ${ct.priority === 'high' ? '#EF5350' :
                                                   ct.priority === 'urgent' ? '#F44336' :
                                                   ct.priority === 'low' ? '#4CAF50' :
                                                   '#E2C05A'}`,
                              color: ct.priority === 'high' ? '#EF5350' :
                                    ct.priority === 'urgent' ? '#F44336' :
                                    ct.priority === 'low' ? '#4CAF50' :
                                    '#E2C05A',
                            }}
                          />
                          <Chip
                            label={ct.urgency || 'medium'}
                            size="small"
                            sx={{
                              ...dashboardStyles.chip,
                              fontSize: '0.65rem',
                              height: '18px',
                              textTransform: 'capitalize',
                            }}
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleDetachTask(ct.id)}
                        sx={{
                          color: '#EF5350',
                          '&:hover': {
                            backgroundColor: 'rgba(239, 83, 80, 0.1)',
                          },
                        }}
                      >
                        <Trash size={16} weight="duotone" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: '#808080', fontStyle: 'italic' }}>
                No tasks attached to this contact yet.
              </Typography>
            )}
          </Box>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <>
              <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 2, fontWeight: 700 }}>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {contact.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{ ...dashboardStyles.chip, fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Box>
            </>
          )}

          {/* Metadata */}
          <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 2, fontWeight: 700 }}>
              Metadata
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                  Created
                </Typography>
                <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                  {new Date(contact.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                  {new Date(contact.updated_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Attach Task Dialog */}
      <Dialog
        open={attachTaskDialogOpen}
        onClose={() => setAttachTaskDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #3A3A3A',
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
              Attach Task to Contact
            </Typography>
            <IconButton onClick={() => setAttachTaskDialogOpen(false)} size="small" sx={{ color: '#B0B0B0' }}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth sx={dashboardStyles.textField}>
              <InputLabel sx={{ color: '#B0B0B0' }}>Select Task</InputLabel>
              <Select
                value={selectedTaskId}
                label="Select Task"
                onChange={(e) => setSelectedTaskId(e.target.value)}
                sx={{
                  backgroundColor: '#0D0D0D',
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              >
                {allTasks && allTasks.length > 0 ? (
                  allTasks
                    .filter((task: any) =>
                      !contactTasks?.some((ct: any) => ct.task_id === task.id)
                    )
                    .map((task: any) => (
                      <MenuItem key={task.id} value={task.id}>
                        {task.title}
                      </MenuItem>
                    ))
                ) : (
                  <MenuItem value="" disabled>
                    No tasks available
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={dashboardStyles.textField}>
              <InputLabel sx={{ color: '#B0B0B0' }}>Priority</InputLabel>
              <Select
                value={taskPriority}
                label="Priority"
                onChange={(e) => setTaskPriority(e.target.value)}
                sx={{
                  backgroundColor: '#0D0D0D',
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={dashboardStyles.textField}>
              <InputLabel sx={{ color: '#B0B0B0' }}>Urgency</InputLabel>
              <Select
                value={taskUrgency}
                label="Urgency"
                onChange={(e) => setTaskUrgency(e.target.value)}
                sx={{
                  backgroundColor: '#0D0D0D',
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setAttachTaskDialogOpen(false)} sx={{ color: '#808080', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAttachTask}
            disabled={!selectedTaskId || attachTaskMutation.isPending}
            sx={{
              ...dashboardStyles.buttonContained,
              textTransform: 'none',
            }}
          >
            {attachTaskMutation.isPending ? 'Attaching...' : 'Attach Task'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log Communication Dialog */}
      <Dialog
        open={logCommDialogOpen}
        onClose={() => setLogCommDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600, borderBottom: '1px solid #2A2A2A' }}>
          Log Communication
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth sx={dashboardStyles.textField}>
              <InputLabel sx={{ color: '#B0B0B0' }}>Communication Type</InputLabel>
              <Select
                value={commForm.type}
                label="Communication Type"
                onChange={(e) => setCommForm({ ...commForm, type: e.target.value })}
                sx={{
                  backgroundColor: '#0D0D0D',
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              >
                <MenuItem value="call">Call</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="message">Message</MenuItem>
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="note">Note</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={dashboardStyles.textField}>
              <InputLabel sx={{ color: '#B0B0B0' }}>Direction</InputLabel>
              <Select
                value={commForm.direction}
                label="Direction"
                onChange={(e) => setCommForm({ ...commForm, direction: e.target.value })}
                sx={{
                  backgroundColor: '#0D0D0D',
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              >
                <MenuItem value="inbound">Inbound</MenuItem>
                <MenuItem value="outbound">Outbound</MenuItem>
                <MenuItem value="internal">Internal</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Subject"
              value={commForm.subject}
              onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })}
              sx={dashboardStyles.textField}
              InputLabelProps={{ style: { color: '#B0B0B0' } }}
            />

            <TextField
              fullWidth
              label="Notes"
              value={commForm.notes}
              onChange={(e) => setCommForm({ ...commForm, notes: e.target.value })}
              multiline
              rows={4}
              sx={dashboardStyles.textField}
              InputLabelProps={{ style: { color: '#B0B0B0' } }}
            />

            <TextField
              fullWidth
              label="Occurred At"
              type="datetime-local"
              value={commForm.occurred_at}
              onChange={(e) => setCommForm({ ...commForm, occurred_at: e.target.value })}
              sx={dashboardStyles.textField}
              InputLabelProps={{ shrink: true, style: { color: '#B0B0B0' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setLogCommDialogOpen(false)} sx={{ color: '#808080', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => logCommunicationMutation.mutate()}
            disabled={logCommunicationMutation.isPending}
            sx={{
              ...dashboardStyles.buttonContained,
              textTransform: 'none',
            }}
          >
            {logCommunicationMutation.isPending ? 'Logging...' : 'Log Communication'}
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
