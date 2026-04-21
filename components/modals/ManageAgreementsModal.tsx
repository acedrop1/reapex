'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  X as XIcon,
  CloudArrowUp,
  FilePdf,
  FileDoc,
  File as FileIcon,
  Trash,
  DownloadSimple,
  Eye,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const DOCUMENT_TYPES = [
  'ICA Agreement',
  'Company Policies',
  'Non-Disclosure Agreement',
  'Tax Forms (W-9, etc.)',
  'Other',
];

interface ManageAgreementsModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
}

interface Agreement {
  id: string;
  agent_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  notes: string | null;
  is_required: boolean;
  expires_at: string | null;
  status: string;
  uploader?: {
    full_name: string;
  };
}

export default function ManageAgreementsModal({
  open,
  onClose,
  agentId,
  agentName,
}: ManageAgreementsModalProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentType, setDocumentType] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewAgreement, setPreviewAgreement] = useState<Agreement | null>(null);

  // Get current user (admin)
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('users')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single();

      return data;
    },
  });

  // Fetch agreements for this agent
  const { data: agreements, isLoading } = useQuery({
    queryKey: ['agent-agreements', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_agreements')
        .select(`
          *,
          uploader:uploaded_by(full_name)
        `)
        .eq('agent_id', agentId)
        .eq('status', 'active')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!agentId,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !documentType || !currentUser?.id) {
        throw new Error('Missing required fields');
      }

      if (documentType === 'Other' && !customLabel.trim()) {
        throw new Error('Please enter a custom label for Other document type');
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        throw new Error('File size must be less than 50MB');
      }

      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${agentId}/agreements/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agent-agreements')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('agent_agreements')
        .insert({
          agent_id: agentId,
          document_type: documentType,
          file_name: documentType === 'Other' && customLabel.trim() ? customLabel.trim() : selectedFile.name,
          file_url: uploadData.path,
          file_size: selectedFile.size,
          uploaded_by: currentUser.id,
          notes: notes.trim() || null,
          is_required: isRequired,
          expires_at: expiresAt || null,
        });

      if (dbError) throw dbError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-agreements'] });
      setSuccess('Document uploaded successfully');
      setSelectedFile(null);
      setDocumentType('');
      setCustomLabel('');
      setNotes('');
      setIsRequired(false);
      setExpiresAt('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to upload document');
      setTimeout(() => setError(null), 5000);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (agreement: Agreement) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('agent-agreements')
        .remove([agreement.file_url]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('agent_agreements')
        .delete()
        .eq('id', agreement.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-agreements'] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  const handleDelete = (agreement: Agreement) => {
    if (confirm(`Are you sure you want to delete "${agreement.file_name}"?`)) {
      deleteMutation.mutate(agreement);
    }
  };

  const handlePreview = async (agreement: Agreement) => {
    setPreviewAgreement(agreement);

    // Get signed URL
    const { data } = await supabase.storage
      .from('agent-agreements')
      .createSignedUrl(agreement.file_url, 3600);

    if (data?.signedUrl) {
      setPreviewUrl(data.signedUrl);
      setShowPreview(true);
    }
  };

  const handleDownload = async (agreement: Agreement) => {
    const { data } = await supabase.storage
      .from('agent-agreements')
      .createSignedUrl(agreement.file_url, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdf size={24} color="#E2C05A" weight="duotone" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileDoc size={24} color="#E2C05A" weight="duotone" />;
    return <FileIcon size={24} color="#E2C05A" weight="duotone" />;
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    return 'other';
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            color: '#FFFFFF',
            borderBottom: '1px solid #2A2A2A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Manage Agreements - {agentName}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <XIcon size={24} color="#B0B0B0" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Upload Section */}
          <Box sx={{ mb: 4, p: 3, backgroundColor: '#0D0D0D', borderRadius: 2, border: '1px solid #2A2A2A' }}>
            <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 3 }}>
              Upload New Agreement
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                label="Document Type"
                sx={{
                  backgroundColor: '#1A1A1A',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#2A2A2A',
                  },
                }}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {documentType === 'Other' && (
              <TextField
                fullWidth
                label="Custom Document Label"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Enter document type"
                sx={{
                  mb: 2,
                  '& .MuiInputBase-root': { backgroundColor: '#1A1A1A' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              />
            )}

            <TextField
              fullWidth
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              placeholder="Add any notes about this document"
              sx={{
                mb: 2,
                '& .MuiInputBase-root': { backgroundColor: '#1A1A1A' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    sx={{ color: '#B0B0B0' }}
                  />
                }
                label="Mark as Required"
                sx={{ color: '#B0B0B0' }}
              />

              <TextField
                type="date"
                label="Expiration Date (Optional)"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  flex: 1,
                  '& .MuiInputBase-root': { backgroundColor: '#1A1A1A' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2A2A2A' },
                }}
              />
            </Box>

            {selectedFile ? (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 1,
                  border: '2px solid #2A2A2A',
                  backgroundColor: '#1A1A1A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                }}
              >
                {getFileIcon(selectedFile.name)}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#808080' }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSelectedFile(null)}
                  sx={{
                    borderColor: '#2A2A2A',
                    color: '#B0B0B0',
                    '&:hover': { borderColor: '#333333', backgroundColor: '#121212' },
                  }}
                >
                  Remove
                </Button>
              </Box>
            ) : (
              <Box
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  width: '100%',
                  height: 120,
                  border: `2px dashed ${isDragging ? '#E2C05A' : '#2A2A2A'}`,
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragging ? '#1A1A1A' : '#121212',
                  transition: 'all 0.2s',
                  mb: 2,
                  '&:hover': { borderColor: '#E2C05A', backgroundColor: '#1A1A1A' },
                }}
              >
                <CloudArrowUp size={40} color="#B0B0B0" weight="duotone" />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: '#B0B0B0' }}>
                  {isDragging ? 'Drop document here' : 'Click or drag document here'}
                </Typography>
                <Typography variant="caption" sx={{ mt: 0.5, color: '#808080' }}>
                  Maximum file size: 50MB
                </Typography>
              </Box>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !selectedFile || !documentType}
              sx={{
                backgroundColor: '#E2C05A',
                color: '#FFFFFF',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#C4A43B' },
                '&:disabled': { backgroundColor: '#2A2A2A', color: '#808080' },
              }}
            >
              {uploadMutation.isPending ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: '#FFFFFF' }} />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </Box>

          {/* Documents List */}
          <Box>
            <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
              Agent Agreements
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : agreements && agreements.length > 0 ? (
              <TableContainer sx={{ backgroundColor: '#0D0D0D', borderRadius: 2, border: '1px solid #2A2A2A' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>Document</TableCell>
                      <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>Type</TableCell>
                      <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>Uploaded By</TableCell>
                      <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>Date</TableCell>
                      <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {agreements.map((agreement: any) => (
                      <TableRow key={agreement.id}>
                        <TableCell sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getFileIcon(agreement.file_name)}
                            <Box>
                              <Typography variant="body2">{agreement.file_name}</Typography>
                              {agreement.is_required && (
                                <Chip label="Required" size="small" color="error" sx={{ mt: 0.5, height: 18 }} />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem' }}>
                          {agreement.document_type}
                        </TableCell>
                        <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem' }}>
                          {agreement.uploader?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A', fontSize: '0.75rem' }}>
                          {format(new Date(agreement.uploaded_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                          <Tooltip title="Preview">
                            <IconButton size="small" onClick={() => handlePreview(agreement)}>
                              <Eye size={18} color="#E2C05A" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton size="small" onClick={() => handleDownload(agreement)}>
                              <DownloadSimple size={18} color="#E2C05A" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(agreement)}>
                              <Trash size={18} color="#F44336" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, color: '#808080' }}>
                <Typography variant="body2">No agreements uploaded yet.</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ borderTop: '1px solid #2A2A2A', p: 2 }}>
          <Button onClick={onClose} sx={{ color: '#B0B0B0' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#121212',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A' }}>
          {previewAgreement?.file_name}
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: '#0D0D0D' }}>
          {previewUrl && previewAgreement && (
            <Box sx={{ width: '100%', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getFileType(previewAgreement.file_name) === 'pdf' ? (
                <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={previewAgreement.file_name} />
              ) : getFileType(previewAgreement.file_name) === 'image' ? (
                <img src={previewUrl} alt={previewAgreement.file_name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography variant="body1" sx={{ color: '#B0B0B0', mb: 3 }}>
                    Preview not available for this file type.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadSimple size={20} weight="duotone" />}
                    onClick={() => previewAgreement && handleDownload(previewAgreement)}
                    sx={{ backgroundColor: '#E2C05A', '&:hover': { backgroundColor: '#C4A43B' } }}
                  >
                    Download File
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #2A2A2A', p: 2 }}>
          <Button onClick={() => setShowPreview(false)} sx={{ color: '#B0B0B0' }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadSimple size={16} weight="duotone" />}
            onClick={() => previewAgreement && handleDownload(previewAgreement)}
            sx={{ backgroundColor: '#E2C05A', '&:hover': { backgroundColor: '#C4A43B' } }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
