'use client';

import { useState } from 'react';
import { Button } from '@mui/material';
import { Email, CheckCircle } from '@mui/icons-material';

interface CopyEmailButtonProps {
  email: string;
}

export default function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Button
      variant="outlined"
      fullWidth
      size="large"
      onClick={handleCopy}
      sx={{
        borderColor: copied ? '#22c55e' : '#2a2a2a',
        color: copied ? '#22c55e' : '#ffffff',
        py: 1.5,
        fontWeight: 600,
        textTransform: 'none',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: copied ? '#22c55e' : '#d4af37',
          backgroundColor: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(212, 175, 55, 0.1)',
        },
      }}
      startIcon={copied ? <CheckCircle /> : <Email />}
    >
      {copied ? 'Email Copied!' : 'Send Email'}
    </Button>
  );
}
