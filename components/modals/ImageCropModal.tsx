'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { X, MagnifyingGlassPlus, MagnifyingGlassMinus } from '@phosphor-icons/react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/utils/cropImage';
import { useError } from '@/contexts/ErrorContext';
import { parseError } from '@/lib/utils/errorHandler';
import { ModalErrorBoundary } from './ModalErrorBoundary';

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageFile: File) => void;
  fileName?: string;
}

function ImageCropModalContent({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  fileName = 'cropped-image.jpg',
}: ImageCropModalProps) {
  const { showError } = useError();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaChange = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSaveCrop = async () => {
    try {
      setIsCropping(true);
      const croppedImageFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        fileName
      );
      onCropComplete(croppedImageFile);
      onClose();
    } catch (error) {
      showError({
        ...parseError(error),
        title: 'Failed to Crop Image',
        message: 'Unable to crop the image. Please try again.',
      });
    } finally {
      setIsCropping(false);
    }
  };

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#121212',
          border: '1px solid #2A2A2A',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #2A2A2A',
          pb: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
          Adjust Profile Picture
        </Typography>
        <IconButton onClick={handleCancel} sx={{ color: '#B0B0B0' }}>
          <X size={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative', height: 500 }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropAreaChange}
          style={{
            containerStyle: {
              backgroundColor: '#0D0D0D',
            },
            cropAreaStyle: {
              border: '2px solid #E2C05A',
            },
          }}
        />
      </DialogContent>

      <DialogActions
        sx={{
          flexDirection: 'column',
          gap: 2,
          p: 3,
          borderTop: '1px solid #2A2A2A',
        }}
      >
        {/* Zoom Controls */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <MagnifyingGlassMinus size={20} color="#B0B0B0" />
            <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
              Zoom
            </Typography>
            <MagnifyingGlassPlus size={20} color="#B0B0B0" />
          </Box>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, value) => setZoom(value as number)}
            sx={{
              color: '#E2C05A',
              '& .MuiSlider-thumb': {
                backgroundColor: '#E2C05A',
              },
              '& .MuiSlider-track': {
                backgroundColor: '#E2C05A',
              },
              '& .MuiSlider-rail': {
                backgroundColor: '#2A2A2A',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: '#808080', textAlign: 'center', display: 'block', mt: 1 }}
          >
            Drag the image to reposition, use the slider to zoom
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCancel}
            disabled={isCropping}
            sx={{
              borderColor: '#2A2A2A',
              color: '#FFFFFF',
              '&:hover': {
                borderColor: '#B0B0B0',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveCrop}
            disabled={isCropping}
            sx={{
              backgroundColor: '#E2C05A',
              '&:hover': {
                backgroundColor: '#C4A43B',
              },
            }}
          >
            {isCropping ? 'Processing...' : 'Save & Upload'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// Wrap with ModalErrorBoundary for error handling
export default function ImageCropModal(props: ImageCropModalProps) {
  return (
    <ModalErrorBoundary>
      <ImageCropModalContent {...props} />
    </ModalErrorBoundary>
  );
}
