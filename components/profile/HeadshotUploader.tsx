'use client';

import { useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { UploadSimple, CheckCircle, XCircle } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

interface HeadshotUploaderProps {
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  disabled?: boolean;
}

export function HeadshotUploader({ currentUrl, onUploadComplete, disabled }: HeadshotUploaderProps) {
  const supabase = createClient();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      setSuccess(false);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create unique filename with user folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('agent-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('agent-photos')
        .getPublicUrl(filePath);

      // Update preview
      setPreviewUrl(publicUrl);
      setSuccess(true);
      onUploadComplete(publicUrl);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }, []);

  return (
    <Box>
      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        sx={{
          border: `2px dashed ${isDragging ? '#000000' : '#cccccc'}`,
          borderRadius: 0,
          padding: 3,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: isDragging ? '#f5f5f5' : '#ffffff',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.5 : 1,
          position: 'relative',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => !disabled && document.getElementById('headshot-upload-input')?.click()}
      >
        <input
          id="headshot-upload-input"
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          disabled={disabled}
          style={{ display: 'none' }}
        />

        {isUploading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress sx={{ color: '#000000' }} />
            <Typography sx={{ color: '#000000' }}>Uploading...</Typography>
          </Box>
        ) : previewUrl ? (
          <Box sx={{ width: '100%' }}>
            <Box
              component="img"
              src={previewUrl}
              alt="Headshot preview"
              sx={{
                maxWidth: '100%',
                maxHeight: 150,
                objectFit: 'contain',
                mb: 2,
              }}
            />
            <Typography variant="caption" sx={{ color: '#000000', display: 'block' }}>
              {success ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: '#2e7d32' }}>
                  <CheckCircle size={16} weight="fill" />
                  Upload successful!
                </Box>
              ) : (
                'Click or drag to replace'
              )}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <UploadSimple size={48} weight="duotone" style={{ color: '#000000' }} />
            <Typography variant="body2" sx={{ color: '#000000' }}>
              Drag and drop your headshot here
            </Typography>
            <Typography variant="caption" sx={{ color: '#666666' }}>
              or click to browse
            </Typography>
            <Typography variant="caption" sx={{ color: '#666666' }}>
              (Max 5MB, JPG, PNG, or WebP)
            </Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mt: 2,
            backgroundColor: '#ffffff',
            border: '1px solid #d32f2f',
            borderRadius: 0,
            color: '#000000',
            '& .MuiAlert-icon': {
              color: '#d32f2f'
            }
          }}
          onClose={() => setError(null)}
          icon={<XCircle size={20} weight="fill" />}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}
