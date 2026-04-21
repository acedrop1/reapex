'use client';

import { useState, useRef, DragEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Paper,
  CircularProgress,
} from '@mui/material';
import { UploadSimple, X, Image as ImageIcon } from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';

interface PhotoUploaderProps {
  coverImage: string | null;
  galleryImages: string[];
  onCoverImageChange: (url: string | null) => void;
  onGalleryImagesChange: (urls: string[]) => void;
  listingId?: string;
}

export default function PhotoUploader({
  coverImage,
  galleryImages,
  onCoverImageChange,
  onGalleryImagesChange,
  listingId,
}: PhotoUploaderProps) {
  const supabase = createClient();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [coverDragging, setCoverDragging] = useState(false);
  const [galleryDragging, setGalleryDragging] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return null;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return null;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${listingId || 'temp'}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert(`Upload failed: ${uploadError.message}`);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('listing-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`Upload error: ${error.message}`);
      return null;
    }
  };

  const handleCoverUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingCover(true);
    const url = await uploadImage(files[0]);
    if (url) {
      onCoverImageChange(url);
    }
    setUploadingCover(false);
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(files[i]);
      if (url) urls.push(url);
    }

    if (urls.length > 0) {
      onGalleryImagesChange([...galleryImages, ...urls]);
    }
    setUploadingGallery(false);
  };

  const handleCoverDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setCoverDragging(false);
    handleCoverUpload(e.dataTransfer.files);
  };

  const handleGalleryDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setGalleryDragging(false);
    handleGalleryUpload(e.dataTransfer.files);
  };

  const removeGalleryImage = (index: number) => {
    const newImages = [...galleryImages];
    newImages.splice(index, 1);
    onGalleryImagesChange(newImages);
  };

  return (
    <>
      {/* Cover Image */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Cover Image
        </Typography>
        <Typography variant="body2" sx={{ color: '#666666', mb: 2 }}>
          This image will be the main photo displayed for your listing
        </Typography>

        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setCoverDragging(true);
          }}
          onDragLeave={() => setCoverDragging(false)}
          onDrop={handleCoverDrop}
          sx={{
            border: '2px dashed',
            borderColor: coverDragging ? '#000000' : '#E0E0E0',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            backgroundColor: coverDragging ? '#F5F5F5' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: '#000000',
              backgroundColor: '#F9F9F9',
            },
          }}
          onClick={() => coverInputRef.current?.click()}
        >
          {uploadingCover ? (
            <CircularProgress size={40} />
          ) : coverImage ? (
            <Box sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={coverImage}
                alt="Cover"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 1,
                  objectFit: 'contain',
                }}
              />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onCoverImageChange(null);
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                  },
                }}
              >
                <X size={20} />
              </IconButton>
            </Box>
          ) : (
            <Box>
              <UploadSimple size={48} color="#666666" weight="duotone" />
              <Typography variant="body1" sx={{ mt: 2, color: '#000000' }}>
                Drop cover image here or click to upload
              </Typography>
              <Typography variant="caption" sx={{ color: '#666666' }}>
                Recommended: 1200x800px, max 10MB
              </Typography>
            </Box>
          )}
        </Box>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleCoverUpload(e.target.files)}
        />
      </Grid>

      {/* Gallery Images */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Gallery Images
        </Typography>
        <Typography variant="body2" sx={{ color: '#666666', mb: 2 }}>
          Upload additional photos to showcase your property
        </Typography>

        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setGalleryDragging(true);
          }}
          onDragLeave={() => setGalleryDragging(false)}
          onDrop={handleGalleryDrop}
          sx={{
            border: '2px dashed',
            borderColor: galleryDragging ? '#000000' : '#E0E0E0',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            backgroundColor: galleryDragging ? '#F5F5F5' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: '#000000',
              backgroundColor: '#F9F9F9',
            },
            mb: 2,
          }}
          onClick={() => galleryInputRef.current?.click()}
        >
          {uploadingGallery ? (
            <CircularProgress size={40} />
          ) : (
            <Box>
              <ImageIcon size={48} color="#666666" weight="duotone" />
              <Typography variant="body1" sx={{ mt: 2, color: '#000000' }}>
                Drop gallery images here or click to upload
              </Typography>
              <Typography variant="caption" sx={{ color: '#666666' }}>
                You can upload multiple images at once
              </Typography>
            </Box>
          )}
        </Box>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleGalleryUpload(e.target.files)}
        />

        {galleryImages.length > 0 && (
          <Grid container spacing={2}>
            {galleryImages.map((image, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Paper
                  sx={{
                    position: 'relative',
                    paddingTop: '75%',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <IconButton
                    onClick={() => removeGalleryImage(index)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#FFFFFF',
                      padding: '4px',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                      },
                    }}
                    size="small"
                  >
                    <X size={16} />
                  </IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Grid>
    </>
  );
}
