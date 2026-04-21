'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface CreateEventModalProps {
    open: boolean;
    onClose: () => void;
    initialDate?: string | null;
}

export default function CreateEventModal({ open, onClose, initialDate }: CreateEventModalProps) {
    const supabase = createClient();
    const queryClient = useQueryClient();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('10:00');
    const [type, setType] = useState('appointment');

    useEffect(() => {
        if (open && initialDate) {
            setStartDate(initialDate);
            setEndDate(initialDate);
        }
    }, [open, initialDate]);

    const createEventMutation = useMutation({
        mutationFn: async (eventData: any) => {
            const response = await fetch('/api/calendar/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create event');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
            // Trigger a sync to push to Google Calendar
            fetch('/api/calendar/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ syncType: 'incremental' }),
            }).catch(console.error); // Fire and forget
            handleClose();
        },
    });

    const handleSubmit = () => {
        if (!title || !startDate || !startTime) return;

        const start = `${startDate}T${startTime}:00`;
        const end = endDate && endTime ? `${endDate}T${endTime}:00` : start; // Default to 1 hour or same time? Let's say same time is point in time, but usually events have duration.

        const eventData = {
            title,
            description,
            start_date: start,
            end_date: end,
            event_type: type,
            source: 'task', // User created events are considered tasks/appointments
        };

        createEventMutation.mutate(eventData);
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setStartTime('09:00');
        setEndTime('10:00');
        setType('appointment');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: '#121212',
                    border: '1px solid #2A2A2A',
                    color: '#FFFFFF',
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid #2A2A2A' }}>Create New Event</DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <TextField
                        label="Event Title"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        sx={{
                            '& .MuiInputBase-root': { color: '#FFFFFF' },
                            '& .MuiInputLabel-root': { color: '#B0B0B0' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                        }}
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Date"
                            type="date"
                            fullWidth
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                if (!endDate) setEndDate(e.target.value);
                            }}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiInputBase-root': { color: '#FFFFFF' },
                                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                            }}
                        />
                        <TextField
                            label="Time"
                            type="time"
                            fullWidth
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiInputBase-root': { color: '#FFFFFF' },
                                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="End Date"
                            type="date"
                            fullWidth
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiInputBase-root': { color: '#FFFFFF' },
                                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                            }}
                        />
                        <TextField
                            label="End Time"
                            type="time"
                            fullWidth
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiInputBase-root': { color: '#FFFFFF' },
                                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                            }}
                        />
                    </Box>

                    <FormControl fullWidth>
                        <InputLabel sx={{ color: '#B0B0B0' }}>Type</InputLabel>
                        <Select
                            value={type}
                            label="Type"
                            onChange={(e) => setType(e.target.value)}
                            sx={{
                                color: '#FFFFFF',
                                '.MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                                '& .MuiSvgIcon-root': { color: '#B0B0B0' },
                            }}
                        >
                            <MenuItem value="appointment">Appointment</MenuItem>
                            <MenuItem value="task">Task</MenuItem>
                            <MenuItem value="transaction">Transaction</MenuItem>
                            <MenuItem value="personal">Personal</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Description"
                        multiline
                        rows={3}
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        sx={{
                            '& .MuiInputBase-root': { color: '#FFFFFF' },
                            '& .MuiInputLabel-root': { color: '#B0B0B0' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #2A2A2A', p: 2 }}>
                <Button onClick={handleClose} sx={{ color: '#B0B0B0' }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={createEventMutation.isPending}
                    sx={{ backgroundColor: '#E2C05A', color: '#FFFFFF' }}
                >
                    {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
