'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Add,
  Visibility,
  Delete,
} from '@mui/icons-material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

export default function ReviewsManagementPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    agent_id: '',
    reviewer_name: '',
    reviewer_email: '',
    rating: 5,
    review_text: '',
    is_approved: false,
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState('all'); // all, approved, pending

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('agent_reviews')
        .select(`
          *,
          users:agent_id (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Fetch all approved agents for the dropdown
      const { data: agentsData, error: agentsError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'agent')
        .eq('account_status', 'approved')
        .order('full_name');

      if (agentsError) throw agentsError;
      setAgents(agentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      agent_id: '',
      reviewer_name: '',
      reviewer_email: '',
      rating: 5,
      review_text: '',
      is_approved: false,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleViewReview = (review: any) => {
    setSelectedReview(review);
    setViewDialog(true);
  };

  const handleSubmitReview = async () => {
    try {
      const { error } = await supabase
        .from('agent_reviews')
        .insert([formData]);

      if (error) throw error;

      await fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating review:', error);
      alert('Error creating review');
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('agent_reviews')
        .update({ is_approved: true })
        .eq('id', reviewId);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Error approving review');
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('agent_reviews')
        .update({ is_approved: false })
        .eq('id', reviewId);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Error rejecting review');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('agent_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error deleting review');
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (filterStatus === 'approved') return review.is_approved;
    if (filterStatus === 'pending') return !review.is_approved;
    return true;
  });

  if (loading) {
    return (
      <Box sx={{ padding: '32px' }}>
        <Typography sx={{ color: '#FFFFFF' }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
          Agent Reviews
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: '#1E1E1E',
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: '#B0B0B0' }}>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Filter by Status"
            sx={{
              color: '#FFFFFF',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2A2A2A',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#333333',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E2C05A',
              },
            }}
          >
            <MenuItem value="all">All Reviews</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
          sx={dashboardStyles.buttonContained}
        >
          Add Review
        </Button>
      </Paper>

      {/* Reviews Table */}
      <TableContainer component={Paper} sx={{ backgroundColor: '#1E1E1E', borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Agent</TableCell>
              <TableCell>Reviewer</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Review</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                    {review.users?.full_name || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#808080' }}>
                    {review.users?.email || ''}
                  </Typography>
                </TableCell>
                <TableCell sx={{}}>
                  <Typography sx={{ color: '#FFFFFF' }}>
                    {review.reviewer_name}
                  </Typography>
                  {review.reviewer_email && (
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      {review.reviewer_email}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{}}>
                  <Rating
                    value={review.rating}
                    readOnly
                    size="small"
                    sx={{
                      '& .MuiRating-iconFilled': {
                        color: '#FFB74D',
                      },
                    }}
                  />
                </TableCell>
                <TableCell sx={{}}>
                  <Typography
                    sx={{
                      color: '#E0E0E0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      maxWidth: '300px',
                    }}
                  >
                    {review.review_text}
                  </Typography>
                </TableCell>
                <TableCell sx={{}}>
                  {review.is_approved ? (
                    <Chip
                      label="Approved"
                      size="small"
                      sx={dashboardStyles.chipSuccess}
                    />
                  ) : (
                    <Chip
                      label="Pending"
                      size="small"
                      sx={dashboardStyles.chipWarning}
                    />
                  )}
                </TableCell>
                <TableCell sx={{}}>
                  <Typography sx={{ color: '#B0B0B0', fontSize: '14px' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell sx={{}}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Full Review">
                      <IconButton
                        size="small"
                        onClick={() => handleViewReview(review)}
                        sx={{ color: '#E2C05A' }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!review.is_approved && (
                      <Tooltip title="Approve">
                        <IconButton
                          size="small"
                          onClick={() => handleApprove(review.id)}
                          sx={{ color: '#4CAF50' }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {review.is_approved && (
                      <Tooltip title="Unapprove">
                        <IconButton
                          size="small"
                          onClick={() => handleReject(review.id)}
                          sx={{ color: '#FF9800' }}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(review.id)}
                        sx={{ color: '#F44336' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredReviews.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography sx={{ color: '#808080' }}>
                    No reviews found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Review Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700 }}>
          Add New Review
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#B0B0B0' }}>Agent</InputLabel>
              <Select
                value={formData.agent_id}
                onChange={(e) =>
                  setFormData({ ...formData, agent_id: e.target.value })
                }
                label="Agent"
                sx={{
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2A2A2A',
                  },
                }}
              >
                {agents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Reviewer Name"
              value={formData.reviewer_name}
              onChange={(e) =>
                setFormData({ ...formData, reviewer_name: e.target.value })
              }
              fullWidth
              sx={dashboardStyles.textField}
            />

            <TextField
              label="Reviewer Email (Optional)"
              value={formData.reviewer_email}
              onChange={(e) =>
                setFormData({ ...formData, reviewer_email: e.target.value })
              }
              fullWidth
              type="email"
              sx={dashboardStyles.textField}
            />

            <Box>
              <Typography sx={{ color: '#B0B0B0', mb: 1 }}>Rating</Typography>
              <Rating
                value={formData.rating}
                onChange={(e, newValue) =>
                  setFormData({ ...formData, rating: newValue || 5 })
                }
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: '#FFB74D',
                  },
                  '& .MuiRating-iconEmpty': {
                    color: '#2A2A2A',
                  },
                }}
              />
            </Box>

            <TextField
              label="Review Text"
              value={formData.review_text}
              onChange={(e) =>
                setFormData({ ...formData, review_text: e.target.value })
              }
              fullWidth
              multiline
              rows={4}
              sx={dashboardStyles.textField}
            />

            <FormControl>
              <InputLabel sx={{ color: '#B0B0B0' }}>Status</InputLabel>
              <Select
                value={formData.is_approved ? 'approved' : 'pending'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_approved: e.target.value === 'approved',
                  })
                }
                label="Status"
                sx={{
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2A2A2A',
                  },
                }}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#B0B0B0' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            sx={dashboardStyles.buttonContained}
            disabled={
              !formData.agent_id ||
              !formData.reviewer_name ||
              !formData.review_text
            }
          >
            Add Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Review Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700 }}>
          Review Details
        </DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <Box>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 0.5 }}>
                  Agent
                </Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '16px' }}>
                  {selectedReview.users?.full_name || 'Unknown'}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 0.5 }}>
                  Reviewer
                </Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '16px' }}>
                  {selectedReview.reviewer_name}
                </Typography>
                {selectedReview.reviewer_email && (
                  <Typography sx={{ color: '#808080', fontSize: '14px' }}>
                    {selectedReview.reviewer_email}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 1 }}>
                  Rating
                </Typography>
                <Rating
                  value={selectedReview.rating}
                  readOnly
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: '#FFB74D',
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 1 }}>
                  Review
                </Typography>
                <Typography
                  sx={{
                    color: '#E0E0E0',
                    fontSize: '16px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedReview.review_text}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 0.5 }}>
                  Status
                </Typography>
                {selectedReview.is_approved ? (
                  <Chip
                    label="Approved"
                    size="small"
                    sx={dashboardStyles.chipSuccess}
                  />
                ) : (
                  <Chip
                    label="Pending"
                    size="small"
                    sx={dashboardStyles.chipWarning}
                  />
                )}
              </Box>

              <Box>
                <Typography sx={{ color: '#B0B0B0', fontSize: '12px', mb: 0.5 }}>
                  Created At
                </Typography>
                <Typography sx={{ color: '#FFFFFF', fontSize: '14px' }}>
                  {new Date(selectedReview.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={() => setViewDialog(false)} sx={{ color: '#B0B0B0' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
