'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  FilePdf,
  FileDoc,
  File as FileIcon,
  Download,
  Trash,
  Folder,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface Document {
  id: string;
  listing_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  uploader_name?: string;
}

interface TransactionDocumentLibraryProps {
  listingId?: string;
  transactionId?: string;
  onDocumentsChange?: () => void;
}

export default function TransactionDocumentLibrary({
  listingId,
  transactionId,
  onDocumentsChange,
}: TransactionDocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, [listingId, transactionId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query based on which ID is provided
      let query = supabase
        .from('transaction_documents')
        .select(`
          *,
          uploader:uploaded_by (
            full_name
          )
        `);

      if (transactionId) {
        query = query.eq('transaction_id', transactionId);
      } else if (listingId) {
        query = query.eq('listing_id', listingId);
      } else {
        throw new Error('Either listingId or transactionId must be provided');
      }

      const { data, error: fetchError } = await query.order('uploaded_at', { ascending: false });

      if (fetchError) throw fetchError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const documentsWithUploader = data?.map((doc: any) => ({
        ...doc,
        uploader_name: doc.uploader?.full_name || 'Unknown User',
      })) || [];

      setDocuments(documentsWithUploader);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      setDeleting(true);

      // Delete from storage (file_url is now the storage path)
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([documentToDelete.file_url]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('transaction_documents')
        .delete()
        .eq('id', documentToDelete.id);

      if (dbError) throw dbError;

      // Refresh documents list
      await fetchDocuments();

      // Notify parent
      if (onDocumentsChange) {
        onDocumentsChange();
      }

      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      // Generate a signed URL for the document (valid for 60 seconds)
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.file_url, 60);

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download document');
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdf size={24} color="#E2C05A" weight="duotone" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileDoc size={24} color="#E2C05A" weight="duotone" />;
    return <FileIcon size={24} color="#E2C05A" weight="duotone" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (documents.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          p: 4,
          border: '2px dashed #2A2A2A',
          borderRadius: 1,
          backgroundColor: '#121212',
        }}
      >
        <Folder size={48} color="#808080" weight="duotone" />
        <Typography variant="body1" sx={{ mt: 2, color: '#B0B0B0' }}>
          No documents uploaded yet
        </Typography>
        <Typography variant="caption" sx={{ color: '#808080' }}>
          Upload your first document using the form above
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {Object.entries(documentsByType).map(([type, docs]) => (
        <Box key={type} sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1.5,
            }}
          >
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontSize: '16px', fontWeight: 600 }}>
              {type}
            </Typography>
            <Chip
              label={docs.length}
              size="small"
              sx={{
                backgroundColor: '#E2C05A',
                color: '#000000',
                fontWeight: 600,
                fontSize: '12px',
              }}
            />
          </Box>

          {docs.map((doc) => (
            <Card
              key={doc.id}
              sx={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                mb: 1.5,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                '&:hover': {
                  borderColor: '#333333',
                  backgroundColor: '#1F1F1F',
                },
              }}
            >
              {getFileIcon(doc.file_name)}

              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500, mb: 0.5 }}>
                  {doc.file_name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#808080' }}>
                  {formatFileSize(doc.file_size)} · Uploaded by {doc.uploader_name} · {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={() => handleDownload(doc)}
                  sx={{
                    color: '#E2C05A',
                    '&:hover': {
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    },
                  }}
                  size="small"
                >
                  <Download size={20} />
                </IconButton>

                <IconButton
                  onClick={() => {
                    setDocumentToDelete(doc);
                    setDeleteDialogOpen(true);
                  }}
                  sx={{
                    color: '#F44336',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                    },
                  }}
                  size="small"
                >
                  <Trash size={20} />
                </IconButton>
              </Box>
            </Card>
          ))}
        </Box>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF' }}>Delete Document</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#B0B0B0' }}>
            Are you sure you want to delete "{documentToDelete?.file_name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{
              color: '#B0B0B0',
              '&:hover': {
                backgroundColor: '#2A2A2A',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              color: '#F44336',
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.08)',
              },
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
