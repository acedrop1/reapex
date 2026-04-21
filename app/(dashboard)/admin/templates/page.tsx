'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
} from '@mui/material';
import { PencilSimple, Trash, Plus, ArrowSquareOut } from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

interface CanvaTemplate {
  id: string;
  name: string;
  description: string | null;
  category: 'business_card' | 'property_flyer' | 'social_media';
  template_id: string;
  preview_image_url: string | null;
  canva_url: string;
  field_mappings: Record<string, string>;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: 'business_card' | 'property_flyer' | 'social_media';
  template_id: string;
  preview_image_url: string;
  canva_url: string;
  is_active: boolean;
  display_order: number;
}

const categoryLabels = {
  business_card: 'Business Card',
  property_flyer: 'Property Flyer',
  social_media: 'Social Media',
};

export default function AdminTemplatesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CanvaTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'business_card',
    template_id: '',
    preview_image_url: '',
    canva_url: '',
    is_active: true,
    display_order: 0,
  });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates?includeInactive=true');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      return data.data as CanvaTemplate[];
    },
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      handleCloseDialog();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateFormData> }) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update template');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      handleCloseDialog();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleOpenDialog = (template?: CanvaTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        template_id: template.template_id,
        preview_image_url: template.preview_image_url || '',
        canva_url: template.canva_url,
        is_active: template.is_active,
        display_order: template.display_order,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        category: 'business_card',
        template_id: '',
        preview_image_url: '',
        canva_url: '',
        is_active: true,
        display_order: 0,
      });
    }
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (template: CanvaTemplate) => {
    updateMutation.mutate({
      id: template.id,
      data: { is_active: !template.is_active },
    });
  };

  return (
    <Container maxWidth="xl" sx={dashboardStyles.container}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#FFFFFF' }}>
            Canva Templates
          </Typography>
          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>
            Manage Canva marketing templates for agents
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} weight="bold" />}
          onClick={() => handleOpenDialog()}
          sx={{
            backgroundColor: '#E2C05A',
            color: '#FFFFFF',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            '&:hover': {
              backgroundColor: '#D4B04A',
            },
          }}
        >
          Add Template
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #2A2A2A' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(226, 192, 90, 0.08)' }}>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Template ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Display Order</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: '1px solid #2A2A2A', color: '#808080' }}>
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: '1px solid #2A2A2A', color: '#808080' }}>
                  No templates found. Click "Add Template" to create one.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow
                  key={template.id}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(226, 192, 90, 0.04)' },
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
                      {template.name}
                    </Typography>
                    {template.description && (
                      <Typography variant="body2" sx={{ color: '#808080', mt: 0.5 }}>
                        {template.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                    <Chip
                      label={categoryLabels[template.category]}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(226, 192, 90, 0.15)',
                        border: '1px solid rgba(226, 192, 90, 0.3)',
                        color: '#EDD48A',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A', color: '#FFFFFF' }}>
                    {template.template_id}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={template.is_active}
                          onChange={() => handleToggleActive(template)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#E2C05A',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#E2C05A',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: template.is_active ? '#4CAF50' : '#808080' }}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Typography>
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #2A2A2A', color: '#FFFFFF' }}>
                    {template.display_order}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #2A2A2A' }}>
                    <IconButton
                      size="small"
                      onClick={() => window.open(template.canva_url, '_blank')}
                      sx={{ color: '#E2C05A', mr: 1 }}
                      title="Open in Canva"
                    >
                      <ArrowSquareOut size={20} weight="bold" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(template)}
                      sx={{ color: '#E2C05A', mr: 1 }}
                      title="Edit"
                    >
                      <PencilSimple size={20} weight="bold" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(template.id, template.name)}
                      sx={{ color: '#E57373' }}
                      title="Delete"
                    >
                      <Trash size={20} weight="bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600 }}>
          {editingTemplate ? 'Edit Template' : 'Add Template'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              sx={{
                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: '#2A2A2A' },
                  '&:hover fieldset': { borderColor: '#E2C05A' },
                },
              }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              sx={{
                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: '#2A2A2A' },
                  '&:hover fieldset': { borderColor: '#E2C05A' },
                },
              }}
            />
            <FormControl fullWidth required>
              <InputLabel sx={{ color: '#B0B0B0' }}>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                label="Category"
                sx={{
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E2C05A' },
                  '& .MuiSvgIcon-root': { color: '#B0B0B0' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #2A2A2A',
                      '& .MuiMenuItem-root': {
                        color: '#FFFFFF',
                        '&:hover': { backgroundColor: 'rgba(226, 192, 90, 0.08)' },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="business_card">Business Card</MenuItem>
                <MenuItem value="property_flyer">Property Flyer</MenuItem>
                <MenuItem value="social_media">Social Media</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Canva Template ID"
              value={formData.template_id}
              onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
              fullWidth
              required
              placeholder="e.g., DAFxxxxx"
              sx={{
                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: '#2A2A2A' },
                  '&:hover fieldset': { borderColor: '#E2C05A' },
                },
              }}
            />
            <TextField
              label="Canva URL"
              value={formData.canva_url}
              onChange={(e) => setFormData({ ...formData, canva_url: e.target.value })}
              fullWidth
              required
              placeholder="https://www.canva.com/design/..."
              sx={{
                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: '#2A2A2A' },
                  '&:hover fieldset': { borderColor: '#E2C05A' },
                },
              }}
            />
            <TextField
              label="Preview Image URL (optional)"
              value={formData.preview_image_url}
              onChange={(e) => setFormData({ ...formData, preview_image_url: e.target.value })}
              fullWidth
              placeholder="https://example.com/preview.png"
              sx={{
                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: '#2A2A2A' },
                  '&:hover fieldset': { borderColor: '#E2C05A' },
                },
              }}
            />
            <TextField
              label="Display Order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              fullWidth
              sx={{
                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                '& .MuiOutlinedInput-root': {
                  color: '#FFFFFF',
                  '& fieldset': { borderColor: '#2A2A2A' },
                  '&:hover fieldset': { borderColor: '#E2C05A' },
                },
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#E2C05A',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#E2C05A',
                    },
                  }}
                />
              }
              label={<Typography sx={{ color: '#FFFFFF' }}>Active</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: '#B0B0B0',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.category || !formData.template_id || !formData.canva_url}
            sx={{
              backgroundColor: '#E2C05A',
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#D4B04A' },
              '&:disabled': { backgroundColor: '#2A2A2A', color: '#808080' },
            }}
          >
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
