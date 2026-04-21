'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { PaperPlaneRight } from '@phosphor-icons/react';

interface AgentContactFormProps {
  agentId: string;
  agentName: string;
}

export default function AgentContactForm({ agentId, agentName }: AgentContactFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/agent-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          source: 'agent_website',
          contact_type: 'lead',
          status: 'new',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      setSuccess(true);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        message: '',
      });

      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '32px',
      }}
    >
      <Typography
        variant="h5"
        sx={{
          color: '#d4af37',
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '8px',
        }}
      >
        Get in Touch
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: '#ffffff',
          fontSize: '14px',
          marginBottom: '24px',
        }}
      >
        Reach out to {agentName} and they'll get back to you soon.
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Message sent successfully! {agentName} will contact you soon.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          name="first_name"
          label="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
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
              color: '#999999',
              '&.Mui-focused': {
                color: '#d4af37',
              },
            },
          }}
        />
        <TextField
          name="last_name"
          label="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
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
              color: '#999999',
              '&.Mui-focused': {
                color: '#d4af37',
              },
            },
          }}
        />
      </Box>

      <TextField
        name="email"
        label="Email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
        fullWidth
        variant="outlined"
        size="small"
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
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
            color: '#999999',
            '&.Mui-focused': {
              color: '#d4af37',
            },
          },
        }}
      />

      <TextField
        name="phone"
        label="Phone (Optional)"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        fullWidth
        variant="outlined"
        size="small"
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
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
            color: '#999999',
            '&.Mui-focused': {
              color: '#d4af37',
            },
          },
        }}
      />

      <TextField
        name="message"
        label="Message"
        multiline
        rows={4}
        value={formData.message}
        onChange={handleChange}
        required
        fullWidth
        variant="outlined"
        placeholder="Tell us about your real estate needs..."
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
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
            color: '#999999',
            '&.Mui-focused': {
              color: '#d4af37',
            },
          },
          '& .MuiOutlinedInput-input::placeholder': {
            color: '#666666',
            opacity: 1,
          },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} sx={{ color: '#0a0a0a' }} /> : <PaperPlaneRight size={20} weight="fill" />}
        sx={{
          backgroundColor: '#d4af37',
          color: '#0a0a0a',
          fontWeight: 600,
          textTransform: 'none',
          py: 1.5,
          '&:hover': {
            backgroundColor: '#c49d2f',
          },
          '&:disabled': {
            backgroundColor: '#2a2a2a',
            color: '#666666',
          },
        }}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </Button>
    </Box>
  );
}
