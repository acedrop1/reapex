'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Plus,
  PencilSimple,
  Trash,
  Image as ImageIcon,
  Link as LinkIcon,
  ArrowUp,
  ArrowDown,
} from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

interface ExternalLink {
  id: string;
  title: string;
  description: string | null;
  url: string;
  logo_url: string | null;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminExternalLinksPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ExternalLink | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    color: '#E2C05A',
    is_active: true,
  });

  // Fetch all external links
  const { data: links = [], isLoading } = useQuery({
    queryKey: ['admin-external-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_links')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ExternalLink[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        let logoPath = editingLink?.logo_url || null;

        // Upload logo if selected
        if (selectedLogo) {
          const fileExt = selectedLogo.name.split('.').pop();
          const fileName = `logos/${Date.now()}.${fileExt}`;

          // Delete old logo if updating
          if (editingLink?.logo_url) {
            await supabase.storage
              .from('documents')
              .remove([editingLink.logo_url]);
          }

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, selectedLogo);

          if (uploadError) throw uploadError;
          logoPath = uploadData.path;
        }

        const payload = {
          title: formData.title,
          description: formData.description || null,
          url: formData.url,
          logo_url: logoPath,
          color: formData.color,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        };

        if (editingLink) {
          // Update existing
          const { error: updateError } = await supabase
            .from('external_links')
            .update(payload)
            .eq('id', editingLink.id);

          if (updateError) throw updateError;
        } else {
          // Create new
          const { error: insertError } = await supabase
            .from('external_links')
            .insert({
              ...payload,
              created_by: user.id,
              display_order: links.length + 1,
            });

          if (insertError) throw insertError;
        }
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-external-links'] });
      handleCloseDialog();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to save external link');
      setUploading(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (link: ExternalLink) => {
      // Delete logo from storage if exists
      if (link.logo_url) {
        await supabase.storage
          .from('documents')
          .remove([link.logo_url]);
      }

      const { error } = await supabase
        .from('external_links')
        .delete()
        .eq('id', link.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-external-links'] });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('external_links')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-external-links'] });
    },
  });

  const handleOpenDialog = (link?: ExternalLink) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        title: link.title,
        description: link.description || '',
        url: link.url,
        color: link.color,
        is_active: link.is_active,
      });

      // Set logo preview if exists
      if (link.logo_url) {
        const { data } = supabase.storage
          .from('documents')
          .getPublicUrl(link.logo_url);
        setLogoPreview(data.publicUrl);
      }
    } else {
      setEditingLink(null);
      setFormData({
        title: '',
        description: '',
        url: '',
        color: '#E2C05A',
        is_active: true,
      });
      setLogoPreview(null);
    }
    setSelectedLogo(null);
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLink(null);
    setSelectedLogo(null);
    setLogoPreview(null);
    setError(null);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleReorder = (link: ExternalLink, direction: 'up' | 'down') => {
    const currentIndex = links.findIndex(l => l.id === link.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= links.length) return;

    const targetLink = links[targetIndex];

    // Swap orders
    reorderMutation.mutate({ id: link.id, newOrder: targetLink.display_order });
    reorderMutation.mutate({ id: targetLink.id, newOrder: link.display_order });
  };

  return (
    <Box sx={{ minHeight: '100%', backgroundColor: '#0D0D0D', py: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1 }}>
              Manage External Links
            </Typography>
            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
              Add and manage external resource links with logos and descriptions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={20} weight="bold" />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: '#E2C05A',
              '&:hover': { backgroundColor: '#C4A43B' },
            }}
          >
            Add Link
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {links.map((link, index) => (
              <Grid item xs={12} sm={6} md={4} key={link.id}>
                <Card
                  sx={{
                    backgroundColor: '#121212',
                    border: '1px solid #2A2A2A',
                    borderRadius: '12px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    {link.logo_url ? (
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '12px',
                          backgroundColor: `${link.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={supabase.storage.from('documents').getPublicUrl(link.logo_url).data.publicUrl}
                          alt={link.title}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '12px',
                          backgroundColor: `${link.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <LinkIcon size={32} color={link.color} weight="duotone" />
                      </Box>
                    )}

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#FFFFFF' }}>
                      {link.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 2 }}>
                      {link.description || 'No description'}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      {link.url}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={link.is_active}
                          onChange={async (e) => {
                            await supabase
                              .from('external_links')
                              .update({ is_active: e.target.checked })
                              .eq('id', link.id);
                            queryClient.invalidateQueries({ queryKey: ['admin-external-links'] });
                          }}
                          size="small"
                        />
                      }
                      label={<Typography variant="caption">Active</Typography>}
                      sx={{ mr: 'auto' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleReorder(link, 'up')}
                      disabled={index === 0}
                      sx={{ color: '#E2C05A' }}
                    >
                      <ArrowUp size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleReorder(link, 'down')}
                      disabled={index === links.length - 1}
                      sx={{ color: '#E2C05A' }}
                    >
                      <ArrowDown size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(link)}
                      sx={{ color: '#E2C05A' }}
                    >
                      <PencilSimple size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this link?')) {
                          deleteMutation.mutate(link);
                        }
                      }}
                      sx={{ color: '#F44336' }}
                    >
                      <Trash size={18} />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#121212',
              border: '1px solid #2A2A2A',
              borderRadius: '12px',
            },
          }}
        >
          <DialogTitle sx={{ color: '#FFFFFF' }}>
            {editingLink ? 'Edit External Link' : 'Add External Link'}
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              sx={{ mt: 2, mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="URL"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
              placeholder="https://example.com"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Accent Color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              type="color"
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                Logo Image (optional)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon size={18} />}
                sx={{ mb: 2 }}
              >
                Upload Logo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoSelect}
                />
              </Button>
              {logoPreview && (
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '8px',
                    backgroundColor: '#1A1A1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </Box>
              )}
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog} sx={{ color: '#B0B0B0' }}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              variant="contained"
              disabled={uploading || !formData.title || !formData.url}
              sx={{
                backgroundColor: '#E2C05A',
                '&:hover': { backgroundColor: '#C4A43B' },
              }}
            >
              {uploading ? <CircularProgress size={20} /> : editingLink ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
