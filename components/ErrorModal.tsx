'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Warning, Error as ErrorIcon, Info, CheckCircle } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface ErrorModalProps {
  open: boolean;
  onClose: () => void;
  error: {
    title?: string;
    message: string;
    severity?: 'error' | 'warning' | 'info' | 'success';
    action?: {
      label: string;
      href?: string;
      onClick?: () => void;
    };
  } | null;
}

export function ErrorModal({ open, onClose, error }: ErrorModalProps) {
  const router = useRouter();

  if (!error) return null;

  const severity = error.severity || 'error';
  const Icon =
    severity === 'error' ? ErrorIcon :
    severity === 'warning' ? Warning :
    severity === 'success' ? CheckCircle :
    Info;

  const handleAction = () => {
    if (error.action?.onClick) {
      error.action.onClick();
    } else if (error.action?.href) {
      router.push(error.action.href);
    }
    onClose();
  };

  const severityColors = {
    error: '#EF4444',
    warning: '#FBBF24',
    info: '#E2C05A',
    success: '#22C55E',
  };

  const iconColor = severityColors[severity];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#121212',
          border: `1px solid ${iconColor}`,
          borderRadius: '12px',
          boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.8), 0 0 0 1px ${iconColor}40`,
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      <DialogTitle sx={{
        color: '#FFFFFF',
        borderBottom: '1px solid #2A2A2A',
        pb: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '10px',
              backgroundColor: `${iconColor}20`,
              border: `1px solid ${iconColor}40`,
            }}
          >
            <Icon sx={{ color: iconColor, fontSize: 24 }} />
          </Box>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {error.title || 'Error'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Box
          sx={{
            backgroundColor: `${iconColor}10`,
            border: `1px solid ${iconColor}30`,
            borderRadius: '8px',
            p: 2,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: '#FFFFFF',
              fontSize: '0.95rem',
              lineHeight: 1.6,
            }}
          >
            {error.message}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        {error.action && (
          <Button
            variant="contained"
            onClick={handleAction}
            sx={{
              backgroundColor: `${iconColor}20`,
              border: `1px solid ${iconColor}40`,
              color: iconColor,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)',
              transition: 'all 200ms ease',
              '&:hover': {
                backgroundColor: `${iconColor}30`,
                borderColor: `${iconColor}60`,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px 0 ${iconColor}40`,
              },
            }}
          >
            {error.action.label}
          </Button>
        )}
        <Button
          onClick={onClose}
          sx={{
            backgroundColor: 'rgba(176, 176, 176, 0.1)',
            border: '1px solid rgba(176, 176, 176, 0.2)',
            color: '#B0B0B0',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '8px',
            backdropFilter: 'blur(8px)',
            transition: 'all 200ms ease',
            '&:hover': {
              backgroundColor: 'rgba(176, 176, 176, 0.2)',
              borderColor: 'rgba(176, 176, 176, 0.3)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
