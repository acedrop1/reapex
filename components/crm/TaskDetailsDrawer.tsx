'use client';

import { useState } from 'react';
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
  TextField,
} from '@mui/material';
import {
  X,
  PencilSimple,
  CheckCircle,
  Circle,
  CalendarBlank,
  Tag,
  Trash,
  Clock,
  Flag,
  User,
} from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  completed: boolean;
  tags?: string[];
  agent_id: string;
  created_at: string;
  updated_at: string;
}

interface TaskDetailsDrawerProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskDetailsDrawer({
  open,
  task,
  onClose,
  onEdit,
  onDelete,
}: TaskDetailsDrawerProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch linked contacts for this task
  const { data: linkedContacts } = useQuery({
    queryKey: ['task-contacts', task?.id || ''],
    queryFn: async () => {
      if (!task) return [];
      const { data } = await supabase
        .from('contact_tasks')
        .select('*, contacts(*)')
        .eq('task_id', task.id);
      return data || [];
    },
    enabled: !!task?.id,
  });

  // Toggle complete/incomplete mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      if (!task) throw new Error('No task selected');

      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task) throw new Error('No task selected');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      if (onDelete && task) {
        onDelete(task.id);
      }
      setDeleteDialogOpen(false);
      onClose();
    },
  });

  const handleToggleComplete = () => {
    if (!task) return;
    toggleCompleteMutation.mutate(!task.completed);
  };

  const handleDelete = () => {
    deleteTaskMutation.mutate();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: 'rgba(244, 67, 54, 0.15)', border: 'rgba(244, 67, 54, 0.3)', text: '#EF5350' };
      case 'medium':
        return { bg: 'rgba(255, 152, 0, 0.15)', border: 'rgba(255, 152, 0, 0.3)', text: '#FFA726' };
      case 'low':
        return { bg: 'rgba(76, 175, 80, 0.15)', border: 'rgba(76, 175, 80, 0.3)', text: '#66BB6A' };
      default:
        return { bg: 'rgba(158, 158, 158, 0.15)', border: 'rgba(158, 158, 158, 0.3)', text: '#BDBDBD' };
    }
  };

  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  if (!task) {
    return null;
  }

  const priorityStyle = getPriorityColor(task.priority);

  return (
    <>
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
              Task Details
            </Typography>
            <IconButton onClick={onClose} size="small">
              <X size={20} color="#B0B0B0" />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {/* Title & Status */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                {task.completed ? (
                  <CheckCircle size={24} color="#66BB6A" weight="fill" style={{ marginTop: 4 }} />
                ) : (
                  <Circle size={24} color="#B0B0B0" style={{ marginTop: 4 }} />
                )}
                <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700, flex: 1 }}>
                  {task.title}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={task.completed ? 'Completed' : 'Active'}
                  size="small"
                  sx={{
                    ...dashboardStyles.chip,
                    borderColor: task.completed ? '#66BB6A' : '#EDD48A',
                    color: task.completed ? '#66BB6A' : '#EDD48A',
                    fontSize: '0.75rem',
                  }}
                />
                <Chip
                  label={formatPriority(task.priority)}
                  size="small"
                  sx={{
                    ...dashboardStyles.chip,
                    borderColor: priorityStyle.text,
                    color: priorityStyle.text,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
            </Box>

            {/* Action Buttons */}
            <Grid container spacing={1} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PencilSimple size={18} weight="duotone" />}
                  onClick={() => onEdit(task)}
                  sx={{
                    ...dashboardStyles.button,
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                  }}
                >
                  Edit Task
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={task.completed ? <Circle size={18} weight="duotone" /> : <CheckCircle size={18} weight="duotone" />}
                  onClick={handleToggleComplete}
                  sx={{
                    ...dashboardStyles.button,
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                  }}
                >
                  {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Trash size={18} weight="duotone" />}
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{
                    ...dashboardStyles.button,
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    borderColor: 'rgba(244, 67, 54, 0.3)',
                    color: '#EF5350',
                    '&:hover': {
                      borderColor: 'rgba(244, 67, 54, 0.5)',
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                    },
                  }}
                >
                  Delete
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />

            {/* Task Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 2, fontWeight: 700 }}>
                Task Information
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {task.description && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Tag size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#FFFFFF', whiteSpace: 'pre-wrap' }}>
                        {task.description}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {task.due_date && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CalendarBlank size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                        Due Date
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                        {formatDate(task.due_date)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Flag size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                      Priority
                    </Typography>
                    <Typography variant="body2" sx={{ color: priorityStyle.text }}>
                      {formatPriority(task.priority)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Linked Contacts */}
            {linkedContacts && linkedContacts.length > 0 && (
              <>
                <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 2, fontWeight: 700 }}>
                    Linked Contacts
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {linkedContacts.map((link: any) => (
                      <Box
                        key={link.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          backgroundColor: '#121212',
                          border: '1px solid #2A2A2A',
                          borderRadius: '8px',
                        }}
                      >
                        <User size={16} color="#B0B0B0" />
                        <Typography variant="body2" sx={{ color: '#FFFFFF', flex: 1 }}>
                          {link.contacts?.first_name} {link.contacts?.last_name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <>
                <Divider sx={{ borderColor: '#2A2A2A', mb: 3 }} />
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 2, fontWeight: 700 }}>
                    Tags
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {task.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{
                          ...dashboardStyles.chip,
                          fontSize: '0.75rem',
                        }}
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

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Clock size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                      Created
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {formatDateTime(task.created_at)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Clock size={18} color="#B0B0B0" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#808080', display: 'block' }}>
                      Last Updated
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {formatDateTime(task.updated_at)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            minWidth: '400px',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600 }}>
          Delete Task
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#B0B0B0' }}>
            Are you sure you want to delete this task? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              ...dashboardStyles.button,
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleteTaskMutation.isPending}
            sx={{
              backgroundColor: 'rgba(244, 67, 54, 0.15)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              color: '#EF5350',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.25)',
                borderColor: 'rgba(244, 67, 54, 0.5)',
              },
            }}
          >
            {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
