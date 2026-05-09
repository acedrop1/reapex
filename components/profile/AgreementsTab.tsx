'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  FilePdf,
  FileDoc,
  File as FileIcon,
  DownloadSimple,
  Eye,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

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

export default function AgreementsTab() {
  const supabase = createClient();

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewAgreement, setPreviewAgreement] = useState<Agreement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get current user
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

  // Fetch agreements
  const { data: agreements, isLoading } = useQuery({
    queryKey: ['agent-agreements', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];

      const { data, error } = await supabase
        .from('agent_agreements')
        .select(`
          *,
          uploader:uploaded_by(full_name)
        `)
        .eq('agent_id', currentUser.id)
        .eq('status', 'active')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  const handlePreview = async (agreement: Agreement) => {
    setPreviewAgreement(agreement);

    // Get signed URL
    const { data } = await supabase.storage
      .from('agent-agreements')
      .createSignedUrl(agreement.file_url, 3600);

    if (data?.signedUrl) {
      setPreviewUrl(data.signedUrl);
      setPreviewDialogOpen(true);
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
    <Box sx={{ p: 3 }}>
      {/* Documents List */}
      <Box>
        <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
          My ICA
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : agreements && agreements.length > 0 ? (
          <TableContainer sx={{ backgroundColor: '#121212', borderRadius: 2, border: '1px solid #2A2A2A' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>Document</TableCell>
                  <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>Type</TableCell>
                  <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>Uploaded By</TableCell>
                  <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>Date</TableCell>
                  <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>Size</TableCell>
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
                            <Chip label="Required" size="small" color="error" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>
                      {agreement.document_type}
                    </TableCell>
                    <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>
                      {agreement.uploader?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>
                      {format(new Date(agreement.uploaded_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>
                      {(agreement.file_size / 1024 / 1024).toFixed(2)} MB
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid #2A2A2A' }}>
                      <Tooltip title="Preview">
                        <IconButton size="small" onClick={() => handlePreview(agreement)}>
                          <Eye size={20} color="#E2C05A" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={() => handleDownload(agreement)}>
                          <DownloadSimple size={20} color="#E2C05A" />
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
            <Typography variant="body2">No documents available yet.</Typography>
          </Box>
        )}
      </Box>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
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
                    onClick={() => handleDownload(previewAgreement)}
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
          <Button onClick={() => setPreviewDialogOpen(false)} sx={{ color: '#B0B0B0' }}>
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
    </Box>
  );
}
