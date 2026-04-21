'use client';

import { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  TextField,
} from '@mui/material';
import { X, CalendarBlank, Clock } from '@phosphor-icons/react';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { createClient } from '@/lib/supabase/client';

interface ScheduleTourModalProps {
  agentId: string;
  agentName: string;
  listingId: string;
  listingAddress: string;
}

export default function ScheduleTourModal({
  agentId,
  agentName,
  listingId,
  listingAddress,
}: ScheduleTourModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const supabase = createClient();

  // Generate time slots from 8 AM to 5 PM in 1-hour increments
  const timeSlots = [
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
  ];

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedTime('');
    setName('');
    setEmail('');
    setPhone('');
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !name || !email || !phone) {
      setErrorMessage('Please fill in all fields');
      setErrorModalOpen(true);
      return;
    }

    if (!agentId || !listingId) {
      console.error('Missing agent or listing information:', { agentId, listingId });
      setErrorMessage('Unable to schedule tour. Missing property or agent information.');
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Check if contact exists by email
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, phone')
        .eq('email', email)
        .maybeSingle();

      let contactId: string;
      let isNewContact = false;

      if (existingContact) {
        // Update existing contact if new data provided
        const { data: updatedContact, error: updateError } = await supabase
          .from('contacts')
          .update({
            first_name: firstName || existingContact.first_name,
            last_name: lastName || existingContact.last_name,
            phone: phone || existingContact.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingContact.id)
          .select('id')
          .single();

        if (updateError) {
          console.error('[ScheduleTourModal] Error updating contact:', updateError);
          throw new Error('Failed to update contact information');
        }
        contactId = updatedContact.id;
      } else {
        // Create new contact
        const { data: newContact, error: createError } = await supabase
          .from('contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            status: 'new',
            source: 'tour_request',
            contact_type: 'lead',
            tags: ['tour-request'],
          })
          .select('id')
          .single();

        if (createError) {
          console.error('[ScheduleTourModal] Error creating contact:', createError);
          throw new Error('Failed to create contact');
        }
        contactId = newContact.id;
        isNewContact = true;
      }

      // Create or update agent assignment
      const { error: assignmentError } = await supabase
        .from('contact_agent_assignments')
        .insert({
          contact_id: contactId,
          agent_id: agentId,
          is_primary: isNewContact,
          assigned_by: null,
        })
        .select('id')
        .single();

      // If assignment already exists (23505 = unique violation), that's okay
      if (assignmentError && assignmentError.code !== '23505') {
        console.error('[ScheduleTourModal] Error creating assignment:', assignmentError);
        throw new Error('Failed to assign contact to agent');
      }

      // Create a tour appointment in the database
      const { error: tourError } = await supabase.from('tour_appointments').insert({
        agent_id: agentId,
        listing_id: listingId,
        scheduled_date: selectedDate.format('YYYY-MM-DD'),
        scheduled_time: selectedTime,
        visitor_name: name,
        visitor_email: email,
        visitor_phone: phone,
        status: 'pending',
      });

      if (tourError) {
        console.error('[ScheduleTourModal] Tour scheduling error:', tourError);
        throw tourError;
      }

      // Create activity record for the contact
      await supabase.from('contact_activities').insert({
        contact_id: contactId,
        agent_id: agentId,
        activity_type: 'tour_scheduled',
        subject: `Tour scheduled for ${selectedDate.format('MMMM D, YYYY')} at ${selectedTime}`,
        body: `Tour appointment scheduled at ${listingAddress}`,
        direction: 'inbound',
        status: 'completed',
        metadata: {
          listing_address: listingAddress,
          scheduled_date: selectedDate.format('YYYY-MM-DD'),
          scheduled_time: selectedTime,
          is_new_contact: isNewContact,
        },
      });

      handleClose();
      setSuccessModalOpen(true);
    } catch (error: any) {
      console.error('[ScheduleTourModal] Tour scheduling failed:', error);
      setErrorMessage(`Failed to schedule tour: ${error.message}`);
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        fullWidth
        size="large"
        onClick={handleOpen}
        sx={{
          borderColor: '#ffffff',
          color: '#ffffff',
          backgroundColor: '#0a0a0a',
          py: 1.5,
          fontWeight: 600,
          textTransform: 'none',
          '&:hover': {
            borderColor: '#d4af37',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
          },
        }}
        startIcon={<CalendarBlank size={20} weight="duotone" />}
      >
        Schedule Tour
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: '#0a0a0a',
            borderRadius: '16px',
            maxWidth: 900,
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            p: 4,
            position: 'relative',
            border: '1px solid #2a2a2a',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <X size={24} weight="bold" />
          </IconButton>

          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700, mb: 1 }}>
              Schedule a Tour
            </Typography>
            <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
              {listingAddress}
            </Typography>
            <Typography variant="body2" sx={{ color: '#808080', mt: 0.5 }}>
              with {agentName}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Calendar Section */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  p: 2,
                  '& .MuiDateCalendar-root': {
                    width: '100%',
                    maxHeight: 'none',
                    color: '#ffffff',
                  },
                  '& .MuiPickersCalendarHeader-root': {
                    color: '#ffffff',
                  },
                  '& .MuiPickersCalendarHeader-label': {
                    color: '#ffffff',
                  },
                  '& .MuiIconButton-root': {
                    color: '#ffffff',
                  },
                  '& .MuiDayCalendar-weekDayLabel': {
                    color: '#b0b0b0',
                  },
                  '& .MuiPickersDay-root': {
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#d4af37',
                      color: '#0a0a0a',
                      fontWeight: 700,
                      '&:hover': {
                        backgroundColor: '#c49d2f',
                      },
                    },
                  },
                }}
              >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateCalendar
                    value={selectedDate}
                    onChange={(newDate) => setSelectedDate(newDate)}
                    disablePast
                  />
                </LocalizationProvider>
              </Box>
            </Grid>

            {/* Time Slots and Contact Info */}
            <Grid item xs={12} md={6}>
              {/* Time Selection */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Clock size={24} weight="duotone" color="#d4af37" />
                  <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600 }}>
                    Select Time
                  </Typography>
                </Box>

                <Grid container spacing={1.5}>
                  {timeSlots.map((time) => (
                    <Grid item xs={6} key={time}>
                      <Button
                        fullWidth
                        variant={selectedTime === time ? 'contained' : 'outlined'}
                        onClick={() => setSelectedTime(time)}
                        sx={{
                          borderColor: selectedTime === time ? '#d4af37' : '#2a2a2a',
                          backgroundColor: selectedTime === time ? '#d4af37' : '#1a1a1a',
                          color: selectedTime === time ? '#0a0a0a' : '#ffffff',
                          py: 1.5,
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: '8px',
                          '&:hover': {
                            borderColor: '#d4af37',
                            backgroundColor: selectedTime === time ? '#c49d2f' : 'rgba(212, 175, 55, 0.1)',
                          },
                        }}
                      >
                        {time}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Contact Information */}
              <Box>
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600, mb: 2 }}>
                  Your Information
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#1a1a1a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        '& fieldset': {
                          borderColor: '#2a2a2a',
                        },
                        '&:hover fieldset': {
                          borderColor: '#d4af37',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#d4af37',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#b0b0b0',
                        '&.Mui-focused': {
                          color: '#d4af37',
                        },
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#1a1a1a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        '& fieldset': {
                          borderColor: '#2a2a2a',
                        },
                        '&:hover fieldset': {
                          borderColor: '#d4af37',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#d4af37',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#b0b0b0',
                        '&.Mui-focused': {
                          color: '#d4af37',
                        },
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#1a1a1a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        '& fieldset': {
                          borderColor: '#2a2a2a',
                        },
                        '&:hover fieldset': {
                          borderColor: '#d4af37',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#d4af37',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#b0b0b0',
                        '&.Mui-focused': {
                          color: '#d4af37',
                        },
                      },
                    }}
                  />
                </Box>

                {/* Schedule Button */}
                <Box sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSchedule}
                    disabled={loading || !selectedDate || !selectedTime || !name || !email || !phone}
                    sx={{
                      backgroundColor: '#d4af37',
                      color: '#0a0a0a',
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: '#c49d2f',
                      },
                      '&:disabled': {
                        backgroundColor: '#2a2a2a',
                        color: '#666666',
                      },
                    }}
                  >
                    {loading ? 'Scheduling...' : 'Confirm Tour'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: '#0a0a0a',
            borderRadius: '16px',
            maxWidth: 500,
            width: '90%',
            p: 4,
            border: '1px solid #2a2a2a',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <CalendarBlank size={32} weight="duotone" color="#d4af37" />
          </Box>

          <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 700, mb: 2 }}>
            Tour Scheduled!
          </Typography>

          <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 4 }}>
            Your tour has been scheduled successfully. The agent will contact you shortly to confirm the details.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={() => setSuccessModalOpen(false)}
            sx={{
              backgroundColor: '#d4af37',
              color: '#0a0a0a',
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#c49d2f',
              },
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>

      {/* Error Modal */}
      <Modal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: '#0a0a0a',
            borderRadius: '16px',
            maxWidth: 500,
            width: '90%',
            p: 4,
            border: '1px solid #2a2a2a',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 82, 82, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <X size={32} weight="bold" color="#ff5252" />
          </Box>

          <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 700, mb: 2 }}>
            Error
          </Typography>

          <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 4 }}>
            {errorMessage}
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={() => setErrorModalOpen(false)}
            sx={{
              backgroundColor: '#d4af37',
              color: '#0a0a0a',
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#c49d2f',
              },
            }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </>
  );
}
