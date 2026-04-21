'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CloudArrowUp,
  X as CloseIcon,
  Image as ImageIcon,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string | null;
  bucket: string;
  folder?: string;
  label?: string;
  maxSizeMB?: number;
  targetUserId?: string;
}

export default function ImageUpload({
  onUpload,
  currentImage,
  bucket,
  folder = '',
  label = 'Upload Image',
  maxSizeMB = 10,
  targetUserId,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      // Use targetUserId if provided (for admin uploading for other users), otherwise use logged-in user's ID
      const uploadUserId = targetUserId || user.id;

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uploadUserId}/${folder ? folder + '/' : ''}${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onUpload(publicUrl);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
        {label}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {preview ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 200,
            borderRadius: 1,
            overflow: 'hidden',
            border: '2px solid #2A2A2A',
          }}
        >
          <img
            src={preview}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {!uploading && (
            <IconButton
              onClick={handleRemove}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.8)',
                },
              }}
              size="small"
            >
              <CloseIcon size={16} />
            </IconButton>
          )}
          {uploading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress sx={{ color: '#fff' }} />
            </Box>
          )}
        </Box>
      ) : (
        <Box
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            width: '100%',
            height: 200,
            border: `2px dashed ${isDragging ? '#E2C05A' : '#2A2A2A'}`,
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging ? '#1A1A1A' : '#121212',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: '#E2C05A',
              backgroundColor: '#1A1A1A',
            },
          }}
        >
          {uploading ? (
            <CircularProgress />
          ) : (
            <>
              {isDragging ? (
                <ImageIcon size={48} color="#E2C05A" weight="duotone" />
              ) : (
                <CloudArrowUp size={48} color="#B0B0B0" weight="duotone" />
              )}
              <Typography variant="body1" sx={{ mt: 2, fontWeight: 500, color: '#B0B0B0' }}>
                {isDragging ? 'Drop image here' : 'Click or drag image here'}
              </Typography>
              <Typography variant="caption" sx={{ mt: 0.5, color: '#808080' }}>
                Maximum file size: {maxSizeMB}MB
              </Typography>
            </>
          )}
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </Box>
  );
}
