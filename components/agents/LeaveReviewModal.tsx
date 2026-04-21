'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Star } from '@mui/icons-material';

interface LeaveReviewModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
}

export default function LeaveReviewModal({
  open,
  onClose,
  agentId,
  agentName,
}: LeaveReviewModalProps) {
  const [formData, setFormData] = useState({
    reviewer_name: '',
    reviewer_email: '',
    rating: 0,
    review_text: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.reviewer_name || !formData.rating || !formData.review_text) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (formData.rating < 1) {
        setError('Please select a rating');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/agent-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      reviewer_name: '',
      reviewer_email: '',
      rating: 0,
      review_text: '',
    });
    setError(null);
    setSuccess(false);
    setLoading(false);
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
          borderRadius: '12px',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#000000',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        Leave a Review for {agentName}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Thank you! Your review has been submitted and is pending approval.
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Rating */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, color: '#000000', fontWeight: 600 }}
              >
                Rating *
              </Typography>
              <Rating
                name="rating"
                value={formData.rating}
                onChange={(_, newValue) =>
                  setFormData({ ...formData, rating: newValue || 0 })
                }
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: '#FFB74D',
                  },
                  '& .MuiRating-iconEmpty': {
                    color: '#E0E0E0',
                  },
                }}
              />
            </Box>

            {/* Name */}
            <TextField
              label="Your Name"
              required
              fullWidth
              value={formData.reviewer_name}
              onChange={(e) =>
                setFormData({ ...formData, reviewer_name: e.target.value })
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />

            {/* Email (optional) */}
            <TextField
              label="Your Email (Optional)"
              type="email"
              fullWidth
              value={formData.reviewer_email}
              onChange={(e) =>
                setFormData({ ...formData, reviewer_email: e.target.value })
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />

            {/* Review Text */}
            <TextField
              label="Your Review"
              required
              fullWidth
              multiline
              rows={4}
              value={formData.review_text}
              onChange={(e) =>
                setFormData({ ...formData, review_text: e.target.value })
              }
              placeholder="Share your experience working with this agent..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />

            <Typography variant="caption" sx={{ color: '#999999' }}>
              Your review will be reviewed by our team before being published.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            borderTop: '1px solid #E0E0E0',
            gap: 1,
          }}
        >
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              color: '#666666',
              '&:hover': {
                backgroundColor: '#F5F5F5',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || success}
            sx={{
              backgroundColor: '#E2C05A',
              color: '#FFFFFF',
              px: 3,
              '&:hover': {
                backgroundColor: '#059669',
              },
              '&:disabled': {
                backgroundColor: '#E0E0E0',
                color: '#999999',
              },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
