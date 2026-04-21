'use client';

import { useState } from 'react';
import { Box, Grid, Card, CardMedia, IconButton, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { Delete, Upload, Star, StarBorder } from '@mui/icons-material';
import { createClient } from '@/lib/supabase/client';

interface PropertyImageGalleryProps {
  images: string[];
  coverImage?: string | null;
  listingId: string;
  onImagesChange: (images: string[]) => void;
  onCoverImageChange: (coverImage: string) => void;
}

export function PropertyImageGallery({
  images,
  coverImage,
  listingId,
  onImagesChange,
  onCoverImageChange,
}: PropertyImageGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      const files = event.target.files;
      if (!files || files.length === 0) return;

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${listingId}/${Date.now()}-${i}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('property-listings')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-listings')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Update images array
      const newImages = [...images, ...uploadedUrls];
      onImagesChange(newImages);

      // If no cover image, set the first uploaded image as cover
      if (!coverImage && uploadedUrls.length > 0) {
        onCoverImageChange(uploadedUrls[0]);
      }
    } catch (err: any) {
      console.error('Error uploading images:', err);
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts.slice(-2).join('/'); // Get "listingId/filename.ext"

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('property-listings')
        .remove([fileName]);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from images array
      const newImages = images.filter(img => img !== imageUrl);
      onImagesChange(newImages);

      // If deleted image was cover, set new cover
      if (coverImage === imageUrl && newImages.length > 0) {
        onCoverImageChange(newImages[0]);
      } else if (coverImage === imageUrl) {
        onCoverImageChange('');
      }
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setError(err.message || 'Failed to delete image');
    }
  };

  const handleSetCoverImage = (imageUrl: string) => {
    onCoverImageChange(imageUrl);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Property Images</Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <Upload />}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Images'}
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={handleFileUpload}
          />
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click the star icon to set an image as the cover photo
      </Typography>

      {images.length === 0 ? (
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
            border: '2px dashed #cccccc',
          }}
        >
          <Upload sx={{ fontSize: 48, color: '#999999', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            No images uploaded yet. Click "Upload Images" to add photos.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {images.map((imageUrl, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card
                sx={{
                  position: 'relative',
                  border: coverImage === imageUrl ? '3px solid #C4A43B' : 'none',
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={imageUrl}
                  alt={`Property image ${index + 1}`}
                  sx={{ objectFit: 'cover' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    left: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 1,
                    background: 'linear-gradient(rgba(0,0,0,0.5), transparent)',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleSetCoverImage(imageUrl)}
                    sx={{
                      color: coverImage === imageUrl ? '#ffd700' : '#ffffff',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.5)',
                      },
                    }}
                  >
                    {coverImage === imageUrl ? <Star /> : <StarBorder />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteImage(imageUrl)}
                    sx={{
                      color: '#ffffff',
                      backgroundColor: 'rgba(255,0,0,0.6)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,0,0,0.8)',
                      },
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
                {coverImage === imageUrl && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: '#C4A43B',
                      color: '#ffffff',
                      textAlign: 'center',
                      py: 0.5,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Cover Photo
                    </Typography>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
