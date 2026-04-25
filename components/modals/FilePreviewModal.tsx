'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import { X, DownloadSimple } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { ModalErrorBoundary } from '@/components/modals/ModalErrorBoundary';

interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  selectedFile: any | null;
}

const getFileType = (fileName: string) => {
  if (!fileName) return 'other';
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
  if (['doc', 'docx'].includes(ext || '')) return 'doc';
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'excel';
  if (['ppt', 'pptx'].includes(ext || '')) return 'powerpoint';
  return 'other';
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Templates': '#4CAF50',
    'Compliance': '#E2C05A',
    'Listing Forms': '#4CAF50',
    'Buyer Forms': '#E2C05A',
    'Transaction Forms': '#FF9800',
    'Compliance Forms': '#F44336',
    'Brokerage Operations': '#c49d2f',
    'Misc': '#607D8B',
  };
  return colors[category] || '#757575';
};

function FilePreviewModalContent({ open, onClose, selectedFile }: FilePreviewModalProps) {
  const supabase = createClient();
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // Generate signed URL when file changes
  useEffect(() => {
    if (selectedFile?.url) {
      console.log('[FilePreviewModal] Attempting to generate signed URL for file:', {
        fileName: selectedFile.file_name,
        fileId: selectedFile.id,
        fileUrl: selectedFile.url,
        category: selectedFile.category,
        timestamp: new Date().toISOString()
      });

      setIsLoadingUrl(true);
      setSelectedFileUrl(null);

      const fetchPublicUrl = async () => {
        try {
          // Use signed URL for authenticated access (documents bucket requires authentication)
          const { data, error } = await supabase.storage
            .from('documents')
            .createSignedUrl(selectedFile.url, 3600); // 1 hour expiry

          if (error) {
            console.error('[FilePreviewModal] Error creating signed URL:', {
              error,
              fileName: selectedFile.file_name,
              fileUrl: selectedFile.url,
              errorMessage: error.message,
              timestamp: new Date().toISOString()
            });
            return;
          }

          if (data?.signedUrl) {
            console.log('[FilePreviewModal] Successfully generated signed URL:', {
              fileName: selectedFile.file_name,
              signedUrlLength: data.signedUrl.length,
              timestamp: new Date().toISOString()
            });
            setSelectedFileUrl(data.signedUrl);
          } else {
            console.warn('[FilePreviewModal] No signed URL returned from storage API:', {
              fileName: selectedFile.file_name,
              fileUrl: selectedFile.url,
              data,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('[FilePreviewModal] Exception generating signed URL:', {
            error,
            fileName: selectedFile.file_name,
            fileUrl: selectedFile.url,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });
        } finally {
          setIsLoadingUrl(false);
        }
      };

      fetchPublicUrl();
    } else {
      console.warn('[FilePreviewModal] No file URL available:', {
        selectedFile,
        hasUrl: !!selectedFile?.url,
        timestamp: new Date().toISOString()
      });
    }
  }, [selectedFile, supabase]);

  const handleDownload = async () => {
    if (!selectedFile) {
      console.warn('[FilePreviewModal] Download attempted with no selected file');
      return;
    }

    console.log('[FilePreviewModal] Starting download for file:', {
      fileName: selectedFile.file_name,
      fileId: selectedFile.id,
      fileUrl: selectedFile.url,
      timestamp: new Date().toISOString()
    });

    try {
      // Log download action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('document_access_logs').insert({
          document_id: selectedFile.id,
          user_id: user.id,
          action_type: 'download',
          ip_address: null,
          user_agent: navigator.userAgent,
        });
        console.log('[FilePreviewModal] Download action logged for user:', user.id);
      }

      // Generate download URL
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(selectedFile.url, 60); // 1 minute expiry

      if (error) {
        console.error('[FilePreviewModal] Download URL generation error:', {
          error,
          fileName: selectedFile.file_name,
          fileUrl: selectedFile.url,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (data?.signedUrl) {
        console.log('[FilePreviewModal] Opening download URL:', {
          fileName: selectedFile.file_name,
          timestamp: new Date().toISOString()
        });
        window.open(data.signedUrl, '_blank');
      } else {
        console.warn('[FilePreviewModal] No download URL generated:', {
          fileName: selectedFile.file_name,
          data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('[FilePreviewModal] Download exception:', {
        error,
        fileName: selectedFile.file_name,
        fileUrl: selectedFile.url,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleClose = () => {
    setSelectedFileUrl(null);
    setIsLoadingUrl(false);
    onClose();
  };

  if (!selectedFile) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#121212',
          backgroundImage: 'none',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          minHeight: '80vh',
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header with Close Button */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #2A2A2A',
          backgroundColor: '#0D0D0D',
          pb: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
              {selectedFile.title}
            </Typography>
            <Chip
              label={selectedFile.category}
              size="small"
              sx={{
                backgroundColor: `${getCategoryColor(selectedFile.category)}20`,
                color: getCategoryColor(selectedFile.category),
                border: `1px solid ${getCategoryColor(selectedFile.category)}40`,
                fontWeight: 600,
              }}
            />
          </Box>
          {selectedFile.description && (
            <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 2 }}>
              {selectedFile.description}
            </Typography>
          )}

          {/* Download Button */}
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadSimple size={16} weight="duotone" />}
            onClick={handleDownload}
            sx={{
              backgroundColor: '#E2C05A',
              color: '#FFFFFF',
              '&:hover': { backgroundColor: '#C4A43B' },
              textTransform: 'none',
            }}
          >
            Download
          </Button>
        </Box>

        {/* Close Button */}
        <IconButton
          onClick={handleClose}
          sx={{
            color: '#B0B0B0',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
            },
          }}
          aria-label="close"
        >
          <X size={24} weight="bold" />
        </IconButton>
      </DialogTitle>

      {/* Preview Content */}
      <DialogContent
        sx={{
          p: 0,
          backgroundColor: '#0D0D0D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {isLoadingUrl || !selectedFileUrl ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <CircularProgress size={40} sx={{ color: '#E2C05A' }} />
          </Box>
        ) : (
          <>
            {getFileType(selectedFile.file_name) === 'pdf' ? (
              <iframe
                src={selectedFileUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '70vh',
                  border: 'none',
                }}
                title={selectedFile.title}
              />
            ) : getFileType(selectedFile.file_name) === 'image' ? (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  minHeight: '70vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                }}
              >
                <img
                  src={selectedFileUrl}
                  alt={selectedFile.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            ) : ['doc', 'excel', 'powerpoint'].includes(getFileType(selectedFile.file_name)) ? (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedFileUrl)}&embedded=true`}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '70vh',
                  border: 'none',
                }}
                title={selectedFile.title}
              />
            ) : (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="body1" sx={{ color: '#B0B0B0', mb: 3 }}>
                  Preview not available for this file type.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadSimple size={20} weight="duotone" />}
                  onClick={handleDownload}
                  sx={{
                    backgroundColor: '#E2C05A',
                    color: '#FFFFFF',
                    '&:hover': { backgroundColor: '#C4A43B' },
                    textTransform: 'none',
                  }}
                >
                  Download File
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function FilePreviewModal(props: FilePreviewModalProps) {
  return (
    <ModalErrorBoundary>
      <FilePreviewModalContent {...props} />
    </ModalErrorBoundary>
  );
}
