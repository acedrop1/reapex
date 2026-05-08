'use client';

import { useState, useRef } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { PencilSimple, Trash, Plus, ArrowSquareOut, CloudArrowUp, FilePdf, FileImage } from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { createClient } from '@/lib/supabase/client';

interface CanvaTemplate {
  id: string;
  name: string;
  description: string | null;
  category: 'business_card' | 'property_flyer' | 'social_media' | 'yard_sign' | 'document' | 'other';
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
  category: 'business_card' | 'property_flyer' | 'social_media' | 'yard_sign' | 'document' | 'other';
  template_id: string;
  preview_image_url: string;
  canva_url: string;
  is_active: boolean;
  display_order: number;
}

const categoryLabels: Record<string, string> = {
  business_card: 'Business Card',
  property_flyer: 'Property Flyer',
  social_media: 'Social Media',
  yard_sign: 'Yard Sign',
  document: 'Document / PDF',
  other: 'Other',
};

const inputSx = {
  '& .MuiInputLabel-root': { color: '#B0B0B0' },
  '& .MuiOutlinedInput-root': {
    color: '#FFFFFF',
    '& fieldset': { borderColor: '#2A2A2A' },
    '&:hover fieldset': { borderColor: '#E2C05A' },
  },
};

const selectSx = {
  color: '#FFFFFF',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E2C05A' },
  '& .MuiSvgIcon-root': { color: '#B0B0B0' },
};

const menuSx = {
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
};

export default function AdminTemplatesPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CanvaTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resourceType, setResourceType] = useState<'canva' | 'url' | 'file'>('canva');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<File | null>(null);

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

  // Upload file to Supabase storage
  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { data, error } = await supabase.storage.from('documents').upload(fileName, file);
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

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
        throw new Error(error.error || 'Failed to create resource');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      handleCloseDialog();
      setError(null);
    },
    onError: (error: Error) => setError(error.message),
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
        throw new Error(error.error || 'Failed to update resource');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      handleCloseDialog();
      setError(null);
    },
    onError: (error: Error) => setError(error.message),
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete resource');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      setError(null);
    },
    onError: (error: Error) => setError(error.message),
  });

  const handleOpenDialog = (template?: CanvaTemplate) => {
    if (template) {
      setEditingTemplate(template);
      // Detect resource type from existing data
      const isCanva = template.canva_url?.includes('canva.com');
      const isFile = template.canva_url?.includes('supabase') || template.canva_url?.includes('/storage/');
      setResourceType(isCanva ? 'canva' : isFile ? 'file' : 'url');
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
      setResourceType('canva');
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
    setSelectedFile(null);
    setSelectedPreview(null);
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setSelectedFile(null);
    setSelectedPreview(null);
    setError(null);
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      let finalData = { ...formData };

      // If file upload type, upload the file first
      if (resourceType === 'file' && selectedFile) {
        const fileUrl = await uploadFile(selectedFile, 'marketing-assets');
        finalData.canva_url = fileUrl;
        finalData.template_id = selectedFile.name;
      } else if (resourceType === 'url') {
        finalData.template_id = finalData.template_id || 'external-link';
      }

      // Upload preview image if selected
      if (selectedPreview) {
        const previewUrl = await uploadFile(selectedPreview, 'marketing-previews');
        finalData.preview_image_url = previewUrl;
      }

      if (editingTemplate) {
        updateMutation.mutate({ id: editingTemplate.id, data: finalData });
      } else {
        createMutation.mutate(finalData);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (template: CanvaTemplate) => {
    updateMutation.mutate({ id: template.id, data: { is_active: !template.is_active } });
  };

  const isSubmitDisabled = () => {
    if (!formData.name || !formData.category) return true;
    if (resourceType === 'canva' && (!formData.template_id || !formData.canva_url)) return true;
    if (resourceType === 'url' && !formData.canva_url) return true;
    if (resourceType === 'file' && !selectedFile && !editingTemplate) return true;
    return false;
  };

  const getResourceIcon = (template: CanvaTemplate) => {
    const url = template.canva_url || '';
    if (url.endsWith('.pdf') || url.includes('.pdf')) return <FilePdf size={16} />;
    if (url.match(/\.(png|jpg|jpeg|gif|webp)/i)) return <FileImage size={16} />;
    return <ArrowSquareOut size={16} />;
  };

  return (
    <Container maxWidth="xl" sx={dashboardStyles.container}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#FFFFFF' }}>
            Marketing Assets
          </Typography>
          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>
            Manage Canva templates, files, PDFs, and links for agents
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
            '&:hover': { backgroundColor: '#D4B04A' },
          }}
        >
          Add Resource
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
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }}>Order</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#FFFFFF' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: '1px solid #2A2A2A', color: '#808080' }}>
                  <CircularProgress size={24} sx={{ color: '#E2C05A' }} />
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: '1px solid #2A2A2A', color: '#808080' }}>
                  No resources found. Click &quot;Add Resource&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => {
                const isCanva = template.canva_url?.includes('canva.com');
                const isFile = template.canva_url?.includes('supabase') || template.canva_url?.includes('/storage/');
                const typeLabel = isCanva ? 'Canva' : isFile ? 'File' : 'Link';

                return (
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
                        label={categoryLabels[template.category] || template.category}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(226, 192, 90, 0.15)',
                          border: '1px solid rgba(226, 192, 90, 0.3)',
                          color: '#EDD48A',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                      <Chip
                        label={typeLabel}
                        size="small"
                        icon={getResourceIcon(template)}
                        sx={{
                          backgroundColor: isCanva ? 'rgba(138, 43, 226, 0.15)' : isFile ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: isCanva ? '#B794F4' : isFile ? '#86EFAC' : '#93C5FD',
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={template.is_active}
                            onChange={() => handleToggleActive(template)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: '#E2C05A' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E2C05A' },
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
                        title="Open"
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
                );
              })
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
          {editingTemplate ? 'Edit Resource' : 'Add Marketing Resource'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* Resource Type Selector */}
            {!editingTemplate && (
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#B0B0B0' }}>Resource Type</InputLabel>
                <Select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value as any)}
                  label="Resource Type"
                  sx={selectSx}
                  MenuProps={menuSx}
                >
                  <MenuItem value="canva">Canva Template</MenuItem>
                  <MenuItem value="url">External Link (any URL)</MenuItem>
                  <MenuItem value="file">File Upload (PDF, PNG, etc.)</MenuItem>
                </Select>
              </FormControl>
            )}

            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              sx={inputSx}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              sx={inputSx}
            />
            <FormControl fullWidth required>
              <InputLabel sx={{ color: '#B0B0B0' }}>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                label="Category"
                sx={selectSx}
                MenuProps={menuSx}
              >
                <MenuItem value="business_card">Business Card</MenuItem>
                <MenuItem value="property_flyer">Property Flyer</MenuItem>
                <MenuItem value="social_media">Social Media</MenuItem>
                <MenuItem value="yard_sign">Yard Sign</MenuItem>
                <MenuItem value="document">Document / PDF</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            {/* Canva-specific fields */}
            {resourceType === 'canva' && (
              <>
                <TextField
                  label="Canva Template ID"
                  value={formData.template_id}
                  onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                  fullWidth
                  required
                  placeholder="e.g., DAFxxxxx"
                  sx={inputSx}
                />
                <TextField
                  label="Canva URL"
                  value={formData.canva_url}
                  onChange={(e) => setFormData({ ...formData, canva_url: e.target.value })}
                  fullWidth
                  required
                  placeholder="https://www.canva.com/design/..."
                  sx={inputSx}
                />
              </>
            )}

            {/* URL-specific field */}
            {resourceType === 'url' && (
              <TextField
                label="URL"
                value={formData.canva_url}
                onChange={(e) => setFormData({ ...formData, canva_url: e.target.value })}
                fullWidth
                required
                placeholder="https://example.com/resource or https://amazon.com/product/..."
                sx={inputSx}
              />
            )}

            {/* File upload */}
            {resourceType === 'file' && (
              <Box>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.svg,.doc,.docx,.pptx,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setFormData({ ...formData, name: formData.name || file.name.replace(/\.[^/.]+$/, '') });
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<CloudArrowUp size={20} />}
                  onClick={() => fileInputRef.current?.click()}
                  fullWidth
                  sx={{
                    color: '#E2C05A',
                    borderColor: '#2A2A2A',
                    py: 2,
                    '&:hover': { borderColor: '#E2C05A', backgroundColor: 'rgba(226, 192, 90, 0.08)' },
                  }}
                >
                  {selectedFile ? selectedFile.name : 'Choose File (PDF, PNG, DOCX, etc.)'}
                </Button>
                {selectedFile && (
                  <Typography variant="caption" sx={{ color: '#808080', mt: 1, display: 'block' }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                )}
                {editingTemplate && !selectedFile && (
                  <Typography variant="caption" sx={{ color: '#4CAF50', mt: 1, display: 'block' }}>
                    Current file: {editingTemplate.template_id}
                  </Typography>
                )}
              </Box>
            )}

            {/* Preview image (for all types) */}
            <Box>
              <input
                type="file"
                ref={previewInputRef}
                style={{ display: 'none' }}
                accept=".png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedPreview(file);
                }}
              />
              <TextField
                label="Preview Image URL (optional)"
                value={selectedPreview ? selectedPreview.name : formData.preview_image_url}
                onChange={(e) => {
                  if (!selectedPreview) setFormData({ ...formData, preview_image_url: e.target.value });
                }}
                fullWidth
                placeholder="Paste URL or click upload"
                disabled={!!selectedPreview}
                sx={inputSx}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => previewInputRef.current?.click()} sx={{ color: '#E2C05A' }}>
                      <CloudArrowUp size={20} />
                    </IconButton>
                  ),
                }}
              />
              {selectedPreview && (
                <Button size="small" onClick={() => setSelectedPreview(null)} sx={{ color: '#E57373', mt: 0.5 }}>
                  Remove uploaded preview
                </Button>
              )}
            </Box>

            <TextField
              label="Display Order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              fullWidth
              sx={inputSx}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#E2C05A' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E2C05A' },
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
            disabled={isSubmitDisabled() || uploading}
            startIcon={uploading ? <CircularProgress size={16} sx={{ color: '#808080' }} /> : undefined}
            sx={{
              backgroundColor: '#E2C05A',
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#D4B04A' },
              '&:disabled': { backgroundColor: '#2A2A2A', color: '#808080' },
            }}
          >
            {uploading ? 'Uploading...' : editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
