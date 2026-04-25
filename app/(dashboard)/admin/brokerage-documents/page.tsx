'use client';

import { useState } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Plus,
  Eye,
  Trash,
  Download,
  PencilSimple,
  CloudArrowUp,
  File as FileIcon,
  FilePdf,
  FileDoc,
  MagnifyingGlass as SearchIcon,
  ClockCounterClockwise,
} from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

interface BrokerageDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

interface DocumentAccessLog {
  id: string;
  document_id: string;
  user_id: string;
  action_type: 'view' | 'download';
  ip_address: string | null;
  user_agent: string | null;
  accessed_at: string;
  users: {
    full_name: string;
    email: string;
  };
}

const CATEGORIES = [
  'Templates',
  'Compliance',
];

export default function BrokerageDocumentsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [auditLogDialogOpen, setAuditLogDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<BrokerageDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Templates',
    is_visible: true,
  });

  // Fetch brokerage documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['brokerage-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokerage_documents')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BrokerageDocument[];
    },
  });

  // Fetch audit logs for selected document
  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['document-audit-logs', selectedDocument?.id],
    queryFn: async () => {
      if (!selectedDocument) return [];

      const { data, error } = await supabase
        .from('document_access_logs')
        .select(`
          *,
          users!document_access_logs_user_id_fkey(full_name, email)
        `)
        .eq('document_id', selectedDocument.id)
        .order('accessed_at', { ascending: false });

      if (error) throw error;
      return data as DocumentAccessLog[];
    },
    enabled: !!selectedDocument && auditLogDialogOpen,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/brokerage/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Insert document metadata
      const { error: dbError } = await supabase
        .from('brokerage_documents')
        .insert({
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          file_url: uploadData.path,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          uploaded_by: user.id,
          is_visible: formData.is_visible,
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokerage-documents'] });
      handleCloseUploadDialog();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (doc: BrokerageDocument) => {
      const { error } = await supabase
        .from('brokerage_documents')
        .update({
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          is_visible: formData.is_visible,
        })
        .eq('id', doc.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokerage-documents'] });
      handleCloseEditDialog();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (doc: BrokerageDocument) => {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_url]);

      if (storageError) console.error('Storage delete error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('brokerage_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokerage-documents'] });
    },
  });

  const handleOpenUploadDialog = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Training',
      is_visible: true,
    });
    setSelectedFile(null);
    setError(null);
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      category: 'Training',
      is_visible: true,
    });
    setSelectedFile(null);
    setError(null);
  };

  const handleOpenEditDialog = (doc: BrokerageDocument) => {
    setSelectedDocument(doc);
    setFormData({
      title: doc.title,
      description: doc.description || '',
      category: doc.category,
      is_visible: doc.is_visible,
    });
    setError(null);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedDocument(null);
    setFormData({
      title: '',
      description: '',
      category: 'Training',
      is_visible: true,
    });
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await uploadMutation.mutateAsync();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDocument) return;
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setError(null);
      await updateMutation.mutateAsync(selectedDocument);
    } catch (err: any) {
      setError(err.message || 'Failed to update document');
    }
  };

  const handleDelete = async (doc: BrokerageDocument) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;

    try {
      await deleteMutation.mutateAsync(doc);
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const handleDownload = async (doc: BrokerageDocument) => {
    // Log the download action
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('document_access_logs').insert({
        document_id: doc.id,
        user_id: user.id,
        action_type: 'download',
        ip_address: null, // Could be populated with server-side API
        user_agent: navigator.userAgent,
      });
    }

    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_url, 60);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  const handleOpenAuditLog = (doc: BrokerageDocument) => {
    setSelectedDocument(doc);
    setAuditLogDialogOpen(true);
  };

  const handleCloseAuditLog = () => {
    setAuditLogDialogOpen(false);
    setSelectedDocument(null);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdf size={24} color="#E2C05A" weight="duotone" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileDoc size={24} color="#E2C05A" weight="duotone" />;
    return <FileIcon size={24} color="#E2C05A" weight="duotone" />;
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = searchTerm === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0D' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      {/* Search/Filter Bar - Sticky */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        p: 2,
        backgroundColor: '#121212',
        borderBottom: '1px solid #2A2A2A',
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        flexShrink: 0
      }}>
        <TextField
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: '250px', ...dashboardStyles.textField }}
          InputProps={{
            startAdornment: <SearchIcon size={20} color="#B0B0B0" style={{ marginRight: 8 }} />,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<Plus size={20} weight="bold" />}
          onClick={handleOpenUploadDialog}
          sx={{ ...dashboardStyles.buttonContained, whiteSpace: 'nowrap' }}
        >
          Upload Document
        </Button>
      </Box>

      <TableContainer sx={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#121212',
        minHeight: 0,
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#0D0D0D',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#2A2A2A',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
      }}>
        <Table stickyHeader sx={{ ...dashboardStyles.table, minWidth: 800 }}>
          <TableHead sx={dashboardStyles.table}>
            <TableRow sx={dashboardStyles.table}>
              <TableCell sx={dashboardStyles.table}>Title</TableCell>
              <TableCell sx={dashboardStyles.table}>Category</TableCell>
              <TableCell sx={dashboardStyles.table}>File</TableCell>
              <TableCell sx={dashboardStyles.table}>Size</TableCell>
              <TableCell sx={dashboardStyles.table}>Visible</TableCell>
              <TableCell sx={dashboardStyles.table}>Uploaded</TableCell>
              <TableCell sx={dashboardStyles.table}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={dashboardStyles.table}>
            {filteredDocuments.length === 0 ? (
              <TableRow sx={dashboardStyles.table}>
                <TableCell colSpan={7} align="center" sx={{ ...dashboardStyles.table, py: 4 }}>
                  <Typography variant="body1" sx={{ color: '#808080' }}>
                    {searchTerm || categoryFilter !== 'all' ? 'No documents match your filters' : 'No documents yet. Click "Upload Document" to add one.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow
                  key={doc.id}
                  sx={{
                    ...dashboardStyles.table,
                    '&:hover': {
                      backgroundColor: 'rgba(226, 192, 90, 0.04)',
                    },
                  }}
                >
                  <TableCell sx={dashboardStyles.table}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getFileIcon(doc.file_name)}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
                          {doc.title}
                        </Typography>
                        {doc.description && (
                          <Typography variant="caption" sx={{ color: '#808080' }}>
                            {doc.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Chip label={doc.category} size="small" sx={dashboardStyles.chipInfo} />
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    {doc.file_name}
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Chip
                      label={doc.is_visible ? 'Visible' : 'Hidden'}
                      size="small"
                      sx={doc.is_visible ? dashboardStyles.chipSuccess : dashboardStyles.chip}
                    />
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    {format(new Date(doc.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenAuditLog(doc)}
                        sx={{
                          color: '#c49d2f',
                          '&:hover': {
                            backgroundColor: 'rgba(196, 157, 47, 0.08)',
                          },
                        }}
                        title="View Audit Log"
                      >
                        <ClockCounterClockwise size={20} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(doc)}
                        sx={{
                          color: '#E2C05A',
                          '&:hover': {
                            backgroundColor: 'rgba(226, 192, 90, 0.08)',
                          },
                        }}
                      >
                        <Download size={20} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog(doc)}
                        sx={{
                          color: '#FFA726',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 167, 38, 0.08)',
                          },
                        }}
                      >
                        <PencilSimple size={20} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(doc)}
                        sx={{
                          color: '#E57373',
                          '&:hover': {
                            backgroundColor: 'rgba(229, 115, 115, 0.08)',
                          },
                        }}
                      >
                        <Trash size={20} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Upload Brokerage Document
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
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
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              label="Category"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_visible}
                onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
              />
            }
            label="Visible to agents"
            sx={{ mt: 2, mb: 2 }}
          />

          <Box
            sx={{
              border: `2px dashed ${selectedFile ? '#E2C05A' : '#2A2A2A'}`,
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: selectedFile ? 'rgba(16, 185, 129, 0.05)' : '#121212',
              '&:hover': {
                borderColor: '#E2C05A',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
              },
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {selectedFile ? (
              <Box>
                <FileIcon size={48} color="#E2C05A" weight="duotone" />
                <Typography variant="body1" sx={{ mt: 2, fontWeight: 500 }}>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#808080' }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            ) : (
              <Box>
                <CloudArrowUp size={48} color="#B0B0B0" weight="duotone" />
                <Typography variant="body1" sx={{ mt: 2, fontWeight: 500 }}>
                  Click to select file
                </Typography>
                <Typography variant="caption" sx={{ color: '#808080' }}>
                  PDF, DOC, DOCX, or other document types
                </Typography>
              </Box>
            )}
          </Box>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setSelectedFile(file);

              // Auto-populate title from filename
              if (file) {
                const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                const cleanFileName = fileNameWithoutExt.replace(/[_-]/g, ' ').trim();
                const titleFromFile = cleanFileName
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');

                setFormData({ ...formData, title: titleFromFile });
              }
            }}
            style={{ display: 'none' }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', px: 3, py: 2 }}>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            sx={dashboardStyles.buttonContained}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Edit Document
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
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
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              label="Category"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_visible}
                onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
              />
            }
            label="Visible to agents"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', px: 3, py: 2 }}>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
            sx={dashboardStyles.buttonContained}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={auditLogDialogOpen} onClose={handleCloseAuditLog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Document Access Log
          </Typography>
          {selectedDocument && (
            <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
              {selectedDocument.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {logsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : auditLogs.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 4 }}>
              No access logs found for this document.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date/Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>User Agent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {log.users.full_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {log.users.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action_type}
                          size="small"
                          sx={{
                            backgroundColor: log.action_type === 'download' ? '#E2C05A' : '#FFA726',
                            color: '#FFFFFF',
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(log.accessed_at), 'MMM d, yyyy')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {format(new Date(log.accessed_at), 'h:mm a')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {log.user_agent ? log.user_agent.substring(0, 50) + '...' : 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e0e0e0', px: 3, py: 2 }}>
          <Button onClick={handleCloseAuditLog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
