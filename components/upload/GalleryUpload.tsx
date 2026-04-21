'use client';

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  TextField,
} from '@mui/material';
import {
  CloudArrowUp,
  X as CloseIcon,
  Image as ImageIcon,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

export interface GalleryImage {
  url: string;
  caption: string;
}

interface GalleryUploadProps {
  onUpdate: (images: GalleryImage[]) => void;
  currentImages?: GalleryImage[];
  bucket: string;
  folder?: string;
  label?: string;
  maxImages?: number;
  maxSizeMB?: number;
}

export default function GalleryUpload({
  onUpdate,
  currentImages = [],
  bucket,
  folder = '',
  label = 'Upload Gallery Images',
  maxImages = 10,
  maxSizeMB = 10,
}: GalleryUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GalleryImage[]>(currentImages);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Sync currentImages prop with internal state
  useEffect(() => {
    setImages(currentImages);
  }, [currentImages]);

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
    handleFiles(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  };

  const handleFiles = async (files: File[]) => {
    setError(null);

    // Check max images limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        continue;
      }
      if (file.size > maxSizeBytes) {
        setError(`File ${file.name} is larger than ${maxSizeMB}MB`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Upload files
    await uploadFiles(validFiles);
  };

  const uploadFiles = async (files: File[]) => {
    try {
      setUploading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload images');
      }

      const uploadPromises = files.map(async (file) => {
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedUrls.map(url => ({ url, caption: '' }))];
      setImages(newImages);
      onUpdate(newImages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onUpdate(newImages);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], caption };
    setImages(newImages);
    onUpdate(newImages);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop reordering for gallery images
  const handleImageDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
    onUpdate(images);
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ mb: 2, display: 'block', color: '#808080' }}>
        {images.length}/{maxImages} images • Drag images to reorder
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {images.map((image, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box>
              <Box
                draggable
                onDragStart={(e) => handleImageDragStart(e, index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDragEnd={handleImageDragEnd}
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '75%', // 4:3 aspect ratio
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '2px solid #2A2A2A',
                  cursor: 'grab',
                  '&:active': {
                    cursor: 'grabbing',
                  },
                }}
              >
                <img
                  src={image.url}
                  alt={image.caption || `Gallery ${index + 1}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <IconButton
                  onClick={() => handleRemove(index)}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.8)',
                    },
                  }}
                  size="small"
                >
                  <CloseIcon size={14} />
                </IconButton>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    padding: 0.5,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption">{index + 1}</Typography>
                </Box>
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="Add caption..."
                value={image.caption}
                onChange={(e) => handleCaptionChange(index, e.target.value)}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
        ))}

        {images.length < maxImages && (
          <Grid item xs={6} sm={4} md={3}>
            <Box
              onClick={handleClick}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '100%', // 1:1 aspect ratio
                border: `2px dashed ${isDragging ? '#E2C05A' : '#2A2A2A'}`,
                borderRadius: 1,
                cursor: 'pointer',
                backgroundColor: isDragging ? '#1A1A1A' : '#121212',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#E2C05A',
                  backgroundColor: '#1A1A1A',
                },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {uploading ? (
                  <CircularProgress size={32} />
                ) : isDragging ? (
                  <ImageIcon size={32} color="#E2C05A" weight="duotone" />
                ) : (
                  <>
                    <CloudArrowUp size={32} color="#B0B0B0" weight="duotone" />
                    <Typography variant="caption" sx={{ mt: 1, color: '#B0B0B0', textAlign: 'center', px: 1 }}>
                      Add Image
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </Box>
  );
}
