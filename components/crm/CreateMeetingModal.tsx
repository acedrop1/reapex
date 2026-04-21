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
  Typography,
} from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface CreateMeetingModalProps {
  open: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSubmit: (meetingData: any) => void;
}

export default function CreateMeetingModal({
  open,
  contact,
  onClose,
  onSubmit,
}: CreateMeetingModalProps) {
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    date: '',
    time: '',
    duration: '30',
    location: '',
    notes: '',
  });

  const handleSubmit = () => {
    if (!meetingForm.title || !meetingForm.date) return;

    const meetingData = {
      ...meetingForm,
      contact_id: contact?.id || null,
      attendees: contact?.email ? [contact.email] : [],
    };

    onSubmit(meetingData);
    handleClose();
  };

  const handleClose = () => {
    setMeetingForm({
      title: '',
      date: '',
      time: '',
      duration: '30',
      location: '',
      notes: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth sx={dashboardStyles.dialog}>
      <DialogTitle sx={dashboardStyles.dialog}>
        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
          Create Meeting
        </Typography>
        {contact && (
          <Typography variant="body2" sx={{ color: '#B0B0B0', mt: 0.5 }}>
            With: {contact.first_name} {contact.last_name}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={dashboardStyles.dialog}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Meeting Title"
              value={meetingForm.title}
              onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
              required
              sx={dashboardStyles.textField}
              InputLabelProps={{ sx: { color: '#B0B0B0' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={meetingForm.date}
              onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
              required
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
              label="Time"
              type="time"
              value={meetingForm.time}
              onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
              InputLabelProps={{
                shrink: true,
                sx: { color: '#B0B0B0' },
              }}
              InputProps={{
                sx: {
                  color: '#FFFFFF',
                  '& input[type="time"]::-webkit-calendar-picker-indicator': {
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
              label="Duration (minutes)"
              type="number"
              value={meetingForm.duration}
              onChange={(e) => setMeetingForm({ ...meetingForm, duration: e.target.value })}
              sx={dashboardStyles.textField}
              InputLabelProps={{ sx: { color: '#B0B0B0' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={meetingForm.location}
              onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
              sx={dashboardStyles.textField}
              InputLabelProps={{ sx: { color: '#B0B0B0' } }}
              placeholder="e.g., Office, Zoom, Phone"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              value={meetingForm.notes}
              onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
              multiline
              rows={4}
              sx={dashboardStyles.textField}
              InputLabelProps={{ sx: { color: '#B0B0B0' } }}
            />
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
          disabled={!meetingForm.title || !meetingForm.date}
        >
          Create Meeting
        </Button>
      </DialogActions>
    </Dialog>
  );
}
