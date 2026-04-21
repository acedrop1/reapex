'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface CreateTaskModalProps {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSubmit: (taskData: any) => void;
}

export default function CreateTaskModal({
  open,
  contact,
  onClose,
  onSubmit,
}: CreateTaskModalProps) {
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
  });

  const handleSubmit = () => {
    if (!taskForm.title) return;

    const taskData = {
      ...taskForm,
      contact_id: contact?.id || null,
    };

    onSubmit(taskData);
    handleClose();
  };

  const handleClose = () => {
    setTaskForm({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth sx={dashboardStyles.dialog}>
      <DialogTitle sx={dashboardStyles.dialog}>
        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
          Create Task
        </Typography>
        {contact && (
          <Typography variant="body2" sx={{ color: '#B0B0B0', mt: 0.5 }}>
            For: {contact.first_name} {contact.last_name}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={dashboardStyles.dialog}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
              sx={dashboardStyles.textField}
              InputLabelProps={{ sx: { color: '#B0B0B0' } }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              multiline
              rows={4}
              sx={dashboardStyles.textField}
              InputLabelProps={{ sx: { color: '#B0B0B0' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Due Date"
              type="date"
              value={taskForm.due_date}
              onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
              InputLabelProps={{
                shrink: true,
                sx: { color: '#B0B0B0' },
              }}
              InputProps={{
                sx: {
                  color: '#FFFFFF',
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)',
                    cursor: 'pointer',
                  },
                },
              }}
              sx={dashboardStyles.textField}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Priority"
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              sx={dashboardStyles.textField}
              InputLabelProps={{ sx: { color: '#B0B0B0' } }}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Status"
              value={taskForm.status}
              onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              sx={dashboardStyles.textField}
              InputLabelProps={{ sx: { color: '#B0B0B0' } }}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ ...dashboardStyles.dialog, p: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ color: '#B0B0B0', textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={dashboardStyles.buttonContained}
          disabled={!taskForm.title}
        >
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}
