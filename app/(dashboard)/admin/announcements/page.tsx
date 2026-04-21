'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { Plus, Paperclip, X, Download, FilePdf, FileImage, PencilSimple, Archive } from '@phosphor-icons/react';
import { isAdmin as checkIsAdmin } from '@/lib/utils/auth';

export default function AnnouncementsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    relatedUrl: '',
    relatedCtaText: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Archive Dialog State
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [announcementToArchive, setAnnouncementToArchive] = useState<string | null>(null);

  // Get current user and role
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('users')
        .select('id, role, full_name')
        .eq('id', user.id)
        .single();

      console.log('Announcements - Current user role:', data?.role);
      return data;
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('announcements')
        .select('*, users(full_name)')
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .eq('archived', false)
        .order('published_at', { ascending: false });

      return data || [];
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/announcements/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        return await response.json();
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...results]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcement: typeof formData) => {
      if (!currentUser) throw new Error('Not authenticated');

      const fileUrls = uploadedFiles.map((file) => file.url);
      const attachmentNames = uploadedFiles.map((file) => file.name);

      const payload: any = {
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        file_urls: fileUrls.length > 0 ? fileUrls : null,
        attachment_names: attachmentNames.length > 0 ? attachmentNames : null,
        related_url: announcement.relatedUrl || null,
        related_cta_text: announcement.relatedCtaText || null,
        updated_at: new Date().toISOString(),
      };

      if (!editingId) {
        payload.author_id = currentUser.id;
        payload.published_at = new Date().toISOString();
        payload.archived = false;
      }

      if (editingId) {
        // Update existing announcement
        const { data, error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new announcement
        const { data, error } = await supabase
          .from('announcements')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      resetDialog();
    },
    onError: (error: any) => {
      setError(error.message || `Failed to ${editingId ? 'update' : 'create'} announcement`);
    },
  });

  const archiveAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase
        .from('announcements')
        .update({ archived: true })
        .eq('id', announcementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setArchiveDialogOpen(false);
      setAnnouncementToArchive(null);
    },
    onError: (error: any) => {
      console.error('Failed to archive announcement:', error);
    },
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    createAnnouncementMutation.mutate(formData);
  };

  const isAdmin = checkIsAdmin(currentUser?.role);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return <FilePdf size={20} weight="fill" />;
    }
    return <FileImage size={20} weight="fill" />;
  };

  const handleEdit = (announcement: any) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      relatedUrl: announcement.related_url || '',
      relatedCtaText: announcement.related_cta_text || '',
    });
    if (announcement.file_urls && announcement.attachment_names) {
      const files = announcement.file_urls.map((url: string, index: number) => ({
        url,
        name: announcement.attachment_names[index] || `File ${index + 1}`,
      }));
      setUploadedFiles(files);
    }
    setOpenDialog(true);
  };

  const handleArchiveClick = (id: string) => {
    setAnnouncementToArchive(id);
    setArchiveDialogOpen(true);
  };

  const confirmArchive = () => {
    if (announcementToArchive) {
      archiveAnnouncementMutation.mutate(announcementToArchive);
    }
  };

  const resetDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setError(null);
    setFormData({ title: '', content: '', priority: 'medium', relatedUrl: '', relatedCtaText: '' });
    setUploadedFiles([]);
  };

  return (
    <Container maxWidth="lg" sx={dashboardStyles.container}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#000000' }}>
              Announcements
            </Typography>
            <Typography variant="body1" sx={{ color: '#000000' }}>
              Stay updated with company news and updates
            </Typography>
          </Box>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<Plus size={20} weight="bold" />}
              onClick={() => setOpenDialog(true)}
              sx={dashboardStyles.buttonContained}
            >
              Create Announcement
            </Button>
          )}
        </Box>
      </Box>

      {/* Create Announcement Dialog */}
      <Dialog
        open={openDialog}
        onClose={resetDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            borderRadius: '12px',
            border: '1px solid #2A2A2A',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A' }}>
          {editingId ? 'Edit Announcement' : 'Create New Announcement'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mb: 2, borderRadius: 0 }}
            >
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{
                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                '& .MuiInputBase-input': { color: '#FFFFFF' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
              }}
            />
            <TextField
              label="Content"
              fullWidth
              required
              multiline
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              sx={{
                '& .MuiInputLabel-root': { color: '#B0B0B0' },
                '& .MuiInputBase-input': { color: '#FFFFFF' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
              }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#B0B0B0' }}>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                sx={{
                  color: '#FFFFFF',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                  '& .MuiSelect-select': { color: '#FFFFFF' },
                }}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <input
                accept="image/jpeg,image/png,image/webp,application/pdf"
                style={{ display: 'none' }}
                id="announcement-file-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <label htmlFor="announcement-file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={isUploading ? <CircularProgress size={20} /> : <Paperclip size={20} />}
                  disabled={isUploading}
                  sx={{
                    color: '#FFFFFF',
                    borderColor: '#2A2A2A',
                    '&:hover': {
                      borderColor: '#E2C05A',
                      backgroundColor: 'rgba(226, 192, 90, 0.08)',
                    },
                  }}
                >
                  {isUploading ? 'Uploading...' : 'Attach Files'}
                </Button>
              </label>
              {uploadedFiles.length > 0 && (
                <List dense sx={{ mt: 2 }}>
                  {uploadedFiles.map((file, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid #2A2A2A',
                        borderRadius: '8px',
                        mb: 1,
                        backgroundColor: '#1A1A1A',
                      }}
                    >
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: '#FFFFFF' }}>
                        {getFileIcon(file.name)}
                      </Box>
                      <ListItemText
                        primary={file.name}
                        sx={{ '& .MuiTypography-root': { color: '#FFFFFF' } }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveFile(index)}
                          size="small"
                          sx={{ color: '#B0B0B0', '&:hover': { color: '#FFFFFF' } }}
                        >
                          <X size={20} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Typography variant="subtitle1" sx={{ color: '#FFFFFF', mt: 1 }}>
              Related Link (Optional)
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Link URL"
                fullWidth
                value={formData.relatedUrl}
                onChange={(e) => setFormData({ ...formData, relatedUrl: e.target.value })}
                placeholder="https://example.com"
                sx={{
                  '& .MuiInputLabel-root': { color: '#B0B0B0' },
                  '& .MuiInputBase-input': { color: '#FFFFFF' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              />
              <TextField
                label="Button Text (CTA)"
                fullWidth
                value={formData.relatedCtaText}
                onChange={(e) => setFormData({ ...formData, relatedCtaText: e.target.value })}
                placeholder="Learn More"
                sx={{
                  '& .MuiInputLabel-root': { color: '#B0B0B0' },
                  '& .MuiInputBase-input': { color: '#FFFFFF' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              />
            </Box>

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #2A2A2A' }}>
          <Button onClick={resetDialog} sx={{ color: '#B0B0B0' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createAnnouncementMutation.isPending}
            sx={{
              backgroundColor: '#E2C05A',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#C4A43B',
              },
            }}
          >
            {createAnnouncementMutation.isPending
              ? (editingId ? 'Updating...' : 'Creating...')
              : (editingId ? 'Update Announcement' : 'Create Announcement')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog
        open={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1E1E1E',
            color: '#fff',
            border: '1px solid #333'
          }
        }}
      >
        <DialogTitle>Confirm Archive</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to archive this announcement?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)} sx={{ color: '#888' }}>Cancel</Button>
          <Button
            onClick={confirmArchive}
            variant="contained"
            color="error"
          >
            Archive
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {announcements && announcements.length > 0 ? (
          announcements.map((announcement: any) => (
            <Card key={announcement.id} elevation={2} sx={dashboardStyles.card}>
              <CardContent sx={dashboardStyles.card}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {announcement.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                      <Typography variant="caption" sx={dashboardStyles.typography.secondary}>
                        {new Date(announcement.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                      {announcement.users && (
                        <Typography variant="caption" sx={dashboardStyles.typography.secondary}>
                          • By {announcement.users.full_name}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Chip
                      label={announcement.priority}
                      color={getPriorityColor(announcement.priority) as any}
                      size="small"
                      sx={dashboardStyles.chip}
                    />
                    {isAdmin && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(announcement)}
                          sx={{
                            color: '#E2C05A',
                            '&:hover': {
                              backgroundColor: 'rgba(226, 192, 90, 0.08)',
                            },
                          }}
                        >
                          <PencilSimple size={20} weight="bold" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleArchiveClick(announcement.id)}
                          sx={{
                            color: '#FF9800',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 152, 0, 0.08)',
                            },
                          }}
                        >
                          <Archive size={20} weight="bold" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {announcement.content}
                </Typography>

                {/* Display Related Link if exists */}
                {announcement.related_url && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      href={announcement.related_url}
                      target="_blank"
                      sx={{
                        color: '#E2C05A',
                        borderColor: '#E2C05A',
                        '&:hover': {
                          backgroundColor: 'rgba(226, 192, 90, 0.1)',
                          borderColor: '#E2C05A'
                        }
                      }}
                    >
                      {announcement.related_cta_text || 'View Link'}
                    </Button>
                  </Box>
                )}

                {announcement.file_urls && announcement.file_urls.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: '#000000', fontWeight: 600 }}
                    >
                      Attachments
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {announcement.file_urls.map((url: string, index: number) => {
                        const fileName = announcement.attachment_names?.[index] || `File ${index + 1}`;
                        return (
                          <Button
                            key={index}
                            variant="outlined"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={getFileIcon(fileName)}
                            endIcon={<Download size={16} />}
                            sx={{
                              ...dashboardStyles.button,
                              justifyContent: 'flex-start',
                              textTransform: 'none',
                              borderColor: '#e0e0e0',
                              '&:hover': {
                                borderColor: '#000000',
                                backgroundColor: '#f5f5f5',
                              },
                            }}
                          >
                            {fileName}
                          </Button>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card sx={dashboardStyles.card}>
            <CardContent sx={dashboardStyles.card}>
              <Typography variant="body1" sx={{ ...dashboardStyles.typography.secondary, py: 4 }} align="center">
                No announcements available
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container >
  );
}
