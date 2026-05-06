'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { isAdmin as checkIsAdmin } from '@/lib/utils/auth';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  CardMedia,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import ResourceGrid from '@/components/shared/ResourceGrid';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import {
  Video,
  FileText,
  FilePdf,
  FileDoc,
  FilePpt,
  Play,
  DownloadSimple,
  Plus,
  UploadSimple,
  CheckCircle,
  XCircle,
  Tag as TagIcon,
  FileXls,
  File as FileIcon,
  Trash,
} from '@phosphor-icons/react';

export default function TrainingPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    resource_type: 'document' as 'video' | 'document' | 'pdf' | 'slides' | 'spreadsheet',
    video_url: '',
    tags: [] as string[],
    thumbnail_url: null as string | null,
    preview_url: null as string | null,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<any>(null);
  const [manageResourcesTab, setManageResourcesTab] = useState(0);

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

      return data;
    },
  });

  const { data: resources, isLoading } = useQuery({
    queryKey: ['training-resources'],
    queryFn: async () => {
      const { data } = await supabase
        .from('training_resources')
        .select('*')
        .order('created_at', { ascending: false });
      return data;
    },
  });

  // Fetch external links categorized under Training & Knowledge
  const { data: externalLinks = [] } = useQuery({
    queryKey: ['external-links-training'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_links')
        .select('*')
        .eq('is_active', true)
        .eq('category', 'Training & Knowledge')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []).map((link: any) => ({
        id: link.id,
        title: link.title,
        description: link.description,
        type: 'link' as const,
        url: link.url,
        thumbnail_url: link.icon_url || link.logo_url || null,
        color: link.color_hex || link.color,
        created_at: link.created_at,
      }));
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resource: any) => {
      if (!currentUser) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('training_resources')
        .insert([resource])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-resources'] });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      setUploadError(error.message || 'Failed to create resource');
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const { error } = await supabase
        .from('training_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-resources'] });
    },
  });

  // Generate thumbnail from file
  const generateThumbnail = async (file: File, resourceType: string): Promise<Blob | null> => {
    try {
      if (resourceType === 'pdf') {
        // For PDFs, create a simple thumbnail with first page indicator
        return await createPDFThumbnail(file);
      } else {
        // For other documents, create a generic thumbnail
        return await createGenericThumbnail(file, resourceType);
      }
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return null;
    }
  };

  const createPDFThumbnail = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 300;

      if (ctx) {
        // Create PDF thumbnail background
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add PDF icon representation
        ctx.fillStyle = '#F44336';
        ctx.fillRect(100, 50, 200, 200);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PDF', 200, 160);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create PDF thumbnail'));
        }, 'image/jpeg', 0.8);
      } else {
        reject(new Error('Canvas context not available'));
      }
    });
  };

  const createGenericThumbnail = async (file: File, resourceType: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 300;

      if (ctx) {
        // Create generic thumbnail
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Different colors for different types
        const colors: Record<string, string> = {
          'slides': '#FF6F00',
          'spreadsheet': '#1B5E20',
          'document': '#C4A43B',
        };

        ctx.fillStyle = colors[resourceType] || '#757575';
        ctx.fillRect(100, 50, 200, 200);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(resourceType.toUpperCase(), 200, 160);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create thumbnail'));
        }, 'image/jpeg', 0.8);
      } else {
        reject(new Error('Canvas context not available'));
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size must be less than 50MB');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Detect file type
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let resourceType: 'document' | 'pdf' | 'slides' | 'spreadsheet' = 'document';

      if (fileExt === 'pdf') resourceType = 'pdf';
      else if (['ppt', 'pptx'].includes(fileExt || '')) resourceType = 'slides';
      else if (['xls', 'xlsx', 'csv'].includes(fileExt || '')) resourceType = 'spreadsheet';

      // Create unique filename
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `training/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('training-resources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('training-resources')
        .getPublicUrl(filePath);

      // Generate and upload thumbnail
      let thumbnailUrl = null;
      const thumbnailBlob = await generateThumbnail(file, resourceType);
      if (thumbnailBlob) {
        const thumbnailFileName = `${Date.now()}-thumb-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.jpg`;
        const thumbnailPath = `training/thumbnails/${thumbnailFileName}`;

        const { error: thumbError } = await supabase.storage
          .from('training-resources')
          .upload(thumbnailPath, thumbnailBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (!thumbError) {
          const { data: { publicUrl: thumbUrl } } = supabase.storage
            .from('training-resources')
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbUrl;
        }
      }

      // Auto-extract information from filename if title is empty
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const cleanFileName = fileNameWithoutExt.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();

      // Capitalize first letter of each word
      const titleFromFile = cleanFileName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      setUploadedFile(file);
      setFormData({
        ...formData,
        title: formData.title || titleFromFile, // Auto-fill title if empty
        document_url: publicUrl,
        resource_type: resourceType,
        thumbnail_url: thumbnailUrl,
        preview_url: thumbnailUrl
      } as any);
      setUploadSuccess(true);

      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      setUploadError('Title is required');
      return;
    }

    if (formData.resource_type === 'video' && !formData.video_url.trim()) {
      setUploadError('YouTube URL is required for videos');
      return;
    }

    if (formData.resource_type !== 'video' && !(formData as any).document_url) {
      setUploadError('Please upload a file');
      return;
    }

    // For videos, generate and set thumbnail from YouTube
    if (formData.resource_type === 'video' && formData.video_url) {
      const youtubeThumbnail = getYouTubeThumbnail(formData.video_url);
      if (youtubeThumbnail) {
        formData.thumbnail_url = youtubeThumbnail;
        formData.preview_url = youtubeThumbnail;
      }
    }

    createResourceMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      resource_type: 'document',
      video_url: '',
      tags: [],
      thumbnail_url: null,
      preview_url: null,
    });
    setUploadedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const isAdmin = checkIsAdmin(currentUser?.role);

  // Get file icon based on type
  const getFileIcon = (type: string, size = 48) => {
    const iconProps = { size, weight: 'duotone' as const };

    switch (type) {
      case 'video':
        return <Video {...iconProps} color="#E53935" />;
      case 'pdf':
        return <FilePdf {...iconProps} color="#F44336" />;
      case 'slides':
        return <FilePpt {...iconProps} color="#FF6F00" />;
      case 'spreadsheet':
        return <FileXls {...iconProps} color="#1B5E20" />;
      case 'document':
        return <FileDoc {...iconProps} color="#C4A43B" />;
      default:
        return <FileIcon {...iconProps} color="#757575" />;
    }
  };

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  // Handle download
  const handleDownload = async (resource: any) => {
    if (resource.resource_type === 'video') return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('resource_access_logs').insert({
          resource_id: resource.id,
          user_id: user.id,
          action_type: 'download',
          ip_address: null,
          user_agent: navigator.userAgent,
        });
      }

      let path = resource.file_url;
      // If it's a full URL (e.g. storage public URL), use it directly?
      // Usually file_url is the path in bucket.
      // If it starts with http, open it.
      if (path && path.startsWith('http')) {
        window.open(path, '_blank');
        return;
      }

      if (path) {
        const { data } = await supabase.storage
          .from('training-resources')
          .createSignedUrl(path, 60);

        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Get tag color
  const getTagColor = (index: number) => {
    const colors = [
      { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#E2C05A' },
      { bg: 'rgba(226, 192, 90, 0.15)', border: 'rgba(226, 192, 90, 0.3)', text: '#EDD48A' },
      { bg: 'rgba(156, 39, 176, 0.15)', border: 'rgba(156, 39, 176, 0.3)', text: '#BA68C8' },
      { bg: 'rgba(255, 152, 0, 0.15)', border: 'rgba(255, 152, 0, 0.3)', text: '#FFB74D' },
      { bg: 'rgba(244, 67, 54, 0.15)', border: 'rgba(244, 67, 54, 0.3)', text: '#EF5350' },
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000000' }}>
      {/* Resource Grid */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, p: 3, pt: 4 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ResourceGrid
            items={[
              ...(resources || []).map((resource: any) => ({
                id: resource.id,
                title: resource.title,
                description: resource.description,
                category: resource.category,
                type: resource.resource_type || 'document',
                url: resource.url || resource.video_url || resource.file_url,
                video_url: resource.video_url,
                thumbnail_url: resource.thumbnail_url,
                created_at: resource.created_at,
              })),
              ...externalLinks,
            ]}
            onItemClick={(item) => {
              const url = item.url || item.video_url || '';
              // External links (YouTube, courses, etc.) — open in new tab
              if (url.startsWith('http://') || url.startsWith('https://')) {
                window.open(url, '_blank', 'noopener,noreferrer');
              } else if (url) {
                // Storage file — download it
                const resourceObj = resources?.find((r: any) => r.id === item.id);
                if (resourceObj) handleDownload(resourceObj);
              }
            }}
            isAdmin={isAdmin}
            onDelete={(item) => {
              setResourceToDelete({ id: item.id, title: item.title } as any);
              setDeleteDialogOpen(true);
            }}
          />
        )}

        {!isLoading && (!resources || resources.length === 0) && externalLinks.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              backgroundColor: '#000000',
              borderRadius: '16px',
              border: '1px solid rgba(226, 192, 90, 0.08)',
            }}
          >
            <Typography variant="h6" sx={{ color: '#aaaaaa', mb: 1 }}>
              No resources found
            </Typography>
            <Typography variant="body2" sx={{ color: '#808080' }}>
              Add your first resource to get started
            </Typography>
          </Box>
        )}
      </Box>

      {/* Add Resource Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: '#111111',
            borderRadius: '12px',
            border: '1px solid rgba(226, 192, 90, 0.08)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
          Add New Resource
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {uploadError && (
            <Alert
              severity="error"
              onClose={() => setUploadError(null)}
              sx={{ mb: 2, borderRadius: '8px' }}
              icon={<XCircle size={20} weight="fill" />}
            >
              {uploadError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#aaaaaa' }}>Resource Type</InputLabel>
              <Select
                value={formData.resource_type}
                label="Resource Type"
                onChange={(e) => {
                  setFormData({ ...formData, resource_type: e.target.value as any });
                  setUploadedFile(null);
                  setUploadError(null);
                }}
                sx={{
                  ...dashboardStyles.textField,
                  '& .MuiSelect-select': { color: '#FFFFFF' },
                }}
              >
                <MenuItem value="video">Video (YouTube)</MenuItem>
                <MenuItem value="pdf">PDF Document</MenuItem>
                <MenuItem value="slides">Presentation (PowerPoint)</MenuItem>
                <MenuItem value="spreadsheet">Spreadsheet (Excel)</MenuItem>
                <MenuItem value="document">Document (Word, Text)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Title"
              fullWidth
              required
              size="small"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={dashboardStyles.textField}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              size="small"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={dashboardStyles.textField}
            />

            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#aaaaaa' }}>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                sx={{
                  ...dashboardStyles.textField,
                  '& .MuiSelect-select': { color: '#FFFFFF' },
                }}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Training">Training</MenuItem>
                <MenuItem value="Knowledge">Knowledge</MenuItem>
                <MenuItem value="Misc">Misc</MenuItem>
              </Select>
            </FormControl>

            {/* Tags Input */}
            <Box>
              <TextField
                label="Add Tags"
                fullWidth
                size="small"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                sx={dashboardStyles.textField}
                placeholder="Type and press Enter or click suggestions below"
                InputProps={{
                  endAdornment: (
                    <Button onClick={handleAddTag} size="small" sx={{ color: '#EDD48A' }}>
                      Add
                    </Button>
                  ),
                }}
              />

              {/* Suggested Tags */}
              <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#aaaaaa', width: '100%', mb: 0.5 }}>
                  Suggested Tags:
                </Typography>
                {['New Hire', 'Policy', 'Procedure', 'Best Practice', 'Reference', 'Tutorial', 'Guide', 'Template'].map((suggestedTag) => (
                  !formData.tags.includes(suggestedTag) && (
                    <Chip
                      key={suggestedTag}
                      label={suggestedTag}
                      size="small"
                      onClick={() => {
                        if (!formData.tags.includes(suggestedTag)) {
                          setFormData({ ...formData, tags: [...formData.tags, suggestedTag] });
                        }
                      }}
                      sx={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid rgba(226, 192, 90, 0.08)',
                        color: '#aaaaaa',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#2A2A2A',
                          borderColor: '#EDD48A',
                          color: '#EDD48A',
                        },
                      }}
                    />
                  )
                ))}
              </Box>

              {/* Current Tags */}
              {formData.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#aaaaaa', width: '100%', mb: 0.5 }}>
                    Current Tags:
                  </Typography>
                  {formData.tags.map((tag, index) => {
                    const tagColor = getTagColor(index);
                    return (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        size="small"
                        sx={{
                          backgroundColor: tagColor.bg,
                          border: `1px solid ${tagColor.border}`,
                          color: tagColor.text,
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </Box>

            {formData.resource_type === 'video' && (
              <TextField
                label="YouTube URL"
                fullWidth
                required
                size="small"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                sx={dashboardStyles.textField}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            )}

            {formData.resource_type !== 'video' && (
              <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                sx={{
                  border: `2px dashed ${isDragging ? '#E2C05A' : '#2A2A2A'}`,
                  borderRadius: '12px',
                  padding: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragging ? 'rgba(226, 192, 90, 0.08)' : '#0D0D0D',
                  transition: 'all 0.2s ease',
                  minHeight: 150,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />

                {isUploading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress sx={{ color: '#E2C05A' }} />
                    <Typography sx={{ color: '#FFFFFF' }}>Uploading...</Typography>
                  </Box>
                ) : uploadedFile ? (
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                      {getFileIcon(formData.resource_type, 32)}
                      <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                        {uploadedFile.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#aaaaaa', display: 'block' }}>
                      {uploadSuccess ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: '#E2C05A' }}>
                          <CheckCircle size={16} weight="fill" />
                          Upload successful! Click to replace
                        </Box>
                      ) : (
                        'Click or drag to replace'
                      )}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <UploadSimple size={48} weight="duotone" style={{ color: '#E2C05A' }} />
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      Drag and drop your file here
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                      or click to browse
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                      (Max 50MB - PDF, Word, Excel, PowerPoint, or Text files)
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(226, 192, 90, 0.08)' }}>
          <Button
            onClick={() => {
              setOpenDialog(false);
              resetForm();
            }}
            sx={{
              color: '#aaaaaa',
              '&:hover': { backgroundColor: '#1A1A1A' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createResourceMutation.isPending || isUploading}
            sx={dashboardStyles.buttonContained}
          >
            {createResourceMutation.isPending ? 'Adding...' : 'Add Resource'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setResourceToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#111111',
            border: '1px solid rgba(226, 192, 90, 0.08)',
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Trash size={24} color="#EF5350" weight="duotone" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Delete Resource
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#FFFFFF', mb: 2 }}>
            Are you sure you want to delete "{resourceToDelete?.title}"?
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaaaaa' }}>
            This action cannot be undone. The resource will be permanently removed from the training library.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(226, 192, 90, 0.08)' }}>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setResourceToDelete(null);
            }}
            sx={{
              color: '#aaaaaa',
              '&:hover': { backgroundColor: '#1A1A1A' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (resourceToDelete) {
                deleteResourceMutation.mutate(resourceToDelete.id);
                setDeleteDialogOpen(false);
                setResourceToDelete(null);
              }
            }}
            variant="contained"
            disabled={deleteResourceMutation.isPending}
            sx={{
              backgroundColor: '#EF5350',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#E53935',
              },
              '&:disabled': {
                backgroundColor: 'rgba(244, 67, 54, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            {deleteResourceMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
