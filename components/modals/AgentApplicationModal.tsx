'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  LinearProgress,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';
import {
  X as XIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  User as UserIcon,
  Phone as PhoneIcon,
  Envelope as EnvelopeIcon,
  IdentificationBadge as IdentificationBadgeIcon,
  ChartBar as ChartBarIcon,
  CurrencyDollar as CurrencyDollarIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
} from '@phosphor-icons/react';

interface AgentApplicationModalProps {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  licenseNumber: string;
  transactions12Months: '0_5' | '6_12' | '13_plus' | '';
  salesVolumeRange: 'under_2m' | '2m_8m' | 'over_8m' | '';
  photoIdFile: File | null;
}

const TOTAL_STEPS = 5;

const stepLabels = [
  'Personal Info',
  'License',
  'Experience',
  'Sales Volume',
  'Documents',
];

export default function AgentApplicationModal({ open, onClose, initialEmail }: AgentApplicationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    licenseNumber: '',
    transactions12Months: '',
    salesVolumeRange: '',
    photoIdFile: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Prefill email if initialEmail is provided
  useEffect(() => {
    if (initialEmail && open) {
      setFormData(prev => ({ ...prev, email: initialEmail }));
    }
  }, [initialEmail, open]);

  const handleClose = () => {
    if (!submitting) {
      setCurrentStep(0);
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        licenseNumber: '',
        transactions12Months: '',
        salesVolumeRange: '',
        photoIdFile: null,
      });
      setErrors({});
      setSubmitSuccess(false);
      onClose();
    }
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleChange = (field: keyof FormData, value: any) => {
    if (field === 'phoneNumber') {
      value = formatPhoneNumber(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
        else if (formData.phoneNumber.replace(/\D/g, '').length !== 10)
          newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
          newErrors.email = 'Please enter a valid email address';
        break;
      case 1:
        if (!formData.licenseNumber.trim())
          newErrors.licenseNumber = 'License number is required';
        break;
      case 2:
        if (!formData.transactions12Months)
          newErrors.transactions12Months = 'Please select a transaction volume range';
        break;
      case 3:
        if (!formData.salesVolumeRange)
          newErrors.salesVolumeRange = 'Please select a sales volume range';
        break;
      case 4:
        if (!formData.photoIdFile) newErrors.photoIdFile = 'Photo ID is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors({ photoIdFile: 'Please upload a JPG, PNG, or PDF file' });
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ photoIdFile: 'File size must be less than 10MB' });
        return;
      }
      handleChange('photoIdFile', file);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    try {
      // Upload file to Supabase storage
      let photoIdUrl = '';
      if (formData.photoIdFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.photoIdFile);

        const uploadResponse = await fetch('/api/applications/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const { url } = await uploadResponse.json();
        photoIdUrl = url;
      }

      // Submit application
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          licenseNumber: formData.licenseNumber,
          transactions12Months: formData.transactions12Months,
          salesVolumeRange: formData.salesVolumeRange,
          photoIdUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ submit: 'Failed to submit application. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (submitSuccess) {
      return (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircleIcon size={80} weight="duotone" color="#d4af37" />
          <Typography variant="h5" sx={{ mt: 3, mb: 2, fontWeight: 600, color: '#ffffff' }}>
            Application Submitted!
          </Typography>
          <Typography variant="body1" sx={{ color: '#999999' }}>
            Thank you for your interest in joining Reapex. We'll review your application and be in
            touch soon.
          </Typography>
        </Box>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff' }}>
              Personal Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  required
                  InputProps={{
                    startAdornment: (
                      <UserIcon size={20} style={{ marginRight: 8, color: '#999' }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a1a1a',
                      color: '#ffffff',
                      '& fieldset': {
                        borderColor: '#ffffff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d4af37',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d4af37',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#999999',
                      '&.Mui-focused': {
                        color: '#d4af37',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#999999',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  required
                  InputProps={{
                    startAdornment: (
                      <UserIcon size={20} style={{ marginRight: 8, color: '#999' }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a1a1a',
                      color: '#ffffff',
                      '& fieldset': {
                        borderColor: '#ffffff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d4af37',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d4af37',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#999999',
                      '&.Mui-focused': {
                        color: '#d4af37',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#999999',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber}
                  required
                  placeholder="(555) 555-5555"
                  InputProps={{
                    startAdornment: (
                      <PhoneIcon size={20} style={{ marginRight: 8, color: '#999' }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a1a1a',
                      color: '#ffffff',
                      '& fieldset': {
                        borderColor: '#ffffff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d4af37',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d4af37',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#999999',
                      '&.Mui-focused': {
                        color: '#d4af37',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#999999',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                  InputProps={{
                    startAdornment: (
                      <EnvelopeIcon size={20} style={{ marginRight: 8, color: '#999' }} />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1a1a1a',
                      color: '#ffffff',
                      '& fieldset': {
                        borderColor: '#ffffff',
                      },
                      '&:hover fieldset': {
                        borderColor: '#d4af37',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#d4af37',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#999999',
                      '&.Mui-focused': {
                        color: '#d4af37',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: '#999999',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff' }}>
              License Information
            </Typography>
            <TextField
              fullWidth
              label="NJ Real Estate License Number"
              value={formData.licenseNumber}
              onChange={(e) => handleChange('licenseNumber', e.target.value)}
              error={!!errors.licenseNumber}
              helperText={errors.licenseNumber}
              required
              InputProps={{
                startAdornment: (
                  <IdentificationBadgeIcon size={20} style={{ marginRight: 8, color: '#999' }} />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  '& fieldset': {
                    borderColor: '#ffffff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#d4af37',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#d4af37',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#999999',
                  '&.Mui-focused': {
                    color: '#d4af37',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#999999',
                },
              }}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff' }}>
              Transaction Volume (Last 12 Months)
            </Typography>
            <FormControl component="fieldset" error={!!errors.transactions12Months} fullWidth>
              <RadioGroup
                value={formData.transactions12Months}
                onChange={(e) => handleChange('transactions12Months', e.target.value)}
              >
                <Card
                  sx={{
                    mb: 2,
                    border: formData.transactions12Months === '0_5' ? '2px solid #d4af37' : '1px solid #ffffff',
                    cursor: 'pointer',
                    backgroundColor: '#1a1a1a',
                  }}
                  onClick={() => handleChange('transactions12Months', '0_5')}
                >
                  <CardContent>
                    <FormControlLabel
                      value="0_5"
                      control={<Radio sx={{ color: '#999999', '&.Mui-checked': { color: '#d4af37' } }} />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ChartBarIcon size={24} style={{ marginRight: 12, color: '#999999' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
                            0-5 Transactions
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
                <Card
                  sx={{
                    mb: 2,
                    border: formData.transactions12Months === '6_12' ? '2px solid #d4af37' : '1px solid #ffffff',
                    cursor: 'pointer',
                    backgroundColor: '#1a1a1a',
                  }}
                  onClick={() => handleChange('transactions12Months', '6_12')}
                >
                  <CardContent>
                    <FormControlLabel
                      value="6_12"
                      control={<Radio sx={{ color: '#999999', '&.Mui-checked': { color: '#d4af37' } }} />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ChartBarIcon size={24} style={{ marginRight: 12, color: '#999999' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
                            6-12 Transactions
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
                <Card
                  sx={{
                    border: formData.transactions12Months === '13_plus' ? '2px solid #d4af37' : '1px solid #ffffff',
                    cursor: 'pointer',
                    backgroundColor: '#1a1a1a',
                  }}
                  onClick={() => handleChange('transactions12Months', '13_plus')}
                >
                  <CardContent>
                    <FormControlLabel
                      value="13_plus"
                      control={<Radio sx={{ color: '#999999', '&.Mui-checked': { color: '#d4af37' } }} />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ChartBarIcon size={24} style={{ marginRight: 12, color: '#999999' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
                            13+ Transactions
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              </RadioGroup>
              {errors.transactions12Months && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.transactions12Months}
                </Typography>
              )}
            </FormControl>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff' }}>
              Sales Volume
            </Typography>
            <FormControl component="fieldset" error={!!errors.salesVolumeRange} fullWidth>
              <RadioGroup
                value={formData.salesVolumeRange}
                onChange={(e) => handleChange('salesVolumeRange', e.target.value)}
              >
                <Card
                  sx={{
                    mb: 2,
                    border: formData.salesVolumeRange === 'under_2m' ? '2px solid #d4af37' : '1px solid #ffffff',
                    cursor: 'pointer',
                    backgroundColor: '#1a1a1a',
                  }}
                  onClick={() => handleChange('salesVolumeRange', 'under_2m')}
                >
                  <CardContent>
                    <FormControlLabel
                      value="under_2m"
                      control={<Radio sx={{ color: '#999999', '&.Mui-checked': { color: '#d4af37' } }} />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CurrencyDollarIcon size={24} style={{ marginRight: 12, color: '#999999' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
                            Less than $2,000,000
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
                <Card
                  sx={{
                    mb: 2,
                    border: formData.salesVolumeRange === '2m_8m' ? '2px solid #d4af37' : '1px solid #ffffff',
                    cursor: 'pointer',
                    backgroundColor: '#1a1a1a',
                  }}
                  onClick={() => handleChange('salesVolumeRange', '2m_8m')}
                >
                  <CardContent>
                    <FormControlLabel
                      value="2m_8m"
                      control={<Radio sx={{ color: '#999999', '&.Mui-checked': { color: '#d4af37' } }} />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CurrencyDollarIcon size={24} style={{ marginRight: 12, color: '#999999' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
                            $2,000,000 - $8,000,000
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
                <Card
                  sx={{
                    border: formData.salesVolumeRange === 'over_8m' ? '2px solid #d4af37' : '1px solid #ffffff',
                    cursor: 'pointer',
                    backgroundColor: '#1a1a1a',
                  }}
                  onClick={() => handleChange('salesVolumeRange', 'over_8m')}
                >
                  <CardContent>
                    <FormControlLabel
                      value="over_8m"
                      control={<Radio sx={{ color: '#999999', '&.Mui-checked': { color: '#d4af37' } }} />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CurrencyDollarIcon size={24} style={{ marginRight: 12, color: '#999999' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#ffffff' }}>
                            $8,000,000 or more
                          </Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              </RadioGroup>
              {errors.salesVolumeRange && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.salesVolumeRange}
                </Typography>
              )}
            </FormControl>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#ffffff' }}>
              Document Upload
            </Typography>
            <Box
              sx={{
                border: '2px dashed #ffffff',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                backgroundColor: '#1a1a1a',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#d4af37',
                  backgroundColor: '#2a2a2a',
                },
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <UploadIcon size={48} color="#999999" weight="duotone" />
              <Typography variant="body1" sx={{ mt: 2, mb: 1, fontWeight: 500, color: '#ffffff' }}>
                {formData.photoIdFile
                  ? formData.photoIdFile.name
                  : 'Upload Photo ID (Driver\'s License or Passport)'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#999999' }}>
                JPG, PNG, or PDF • Max 10MB
              </Typography>
              {formData.photoIdFile && (
                <Box sx={{ mt: 2 }}>
                  <CheckCircleIcon size={24} color="#d4af37" weight="duotone" />
                  <Typography variant="body2" sx={{ mt: 1, color: '#d4af37' }}>
                    File ready to upload
                  </Typography>
                </Box>
              )}
            </Box>
            {errors.photoIdFile && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.photoIdFile}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
          backgroundColor: '#0a0a0a !important',
          backgroundImage: 'none !important',
          border: '1px solid rgba(226, 192, 90, 0.15)',
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
          color: '#ffffff',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' }, color: '#ffffff' }}>
            Agent Application
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, display: { xs: 'block', sm: 'none' }, color: '#ffffff' }}>
            {stepLabels[currentStep]}
          </Typography>
          <Typography variant="caption" sx={{ color: '#999999', display: { xs: 'block', sm: 'none' } }}>
            Step {currentStep + 1} of {TOTAL_STEPS}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={submitting} sx={{ color: '#ffffff' }}>
          <XIcon size={24} />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #2A2A2A', display: { xs: 'none', sm: 'block' } }}>
        <Stepper
          activeStep={currentStep}
          alternativeLabel
          sx={{
            '& .MuiStepLabel-label': {
              color: '#999999',
              '&.Mui-active': {
                color: '#ffffff',
              },
              '&.Mui-completed': {
                color: '#999999',
              },
            },
            '& .MuiStepIcon-root': {
              color: '#2A2A2A',
              '&.Mui-active': {
                color: '#d4af37',
              },
              '&.Mui-completed': {
                color: '#d4af37',
              },
            },
            '& .MuiStepIcon-text': {
              fill: '#ffffff',
            },
          }}
        >
          {stepLabels.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ pt: 4, pb: 3 }}>
        {submitting && (
          <LinearProgress
            sx={{
              mb: 3,
              backgroundColor: '#2a2a2a',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#d4af37',
              },
            }}
          />
        )}
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.submit}
          </Alert>
        )}
        {renderStepContent()}
      </DialogContent>

      {!submitSuccess && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 3,
            borderTop: '1px solid #2A2A2A',
          }}
        >
          <Button
            onClick={handleBack}
            disabled={currentStep === 0 || submitting}
            startIcon={<ArrowLeftIcon size={20} />}
            sx={{ textTransform: 'none', color: '#ffffff' }}
          >
            Back
          </Button>
          {currentStep === TOTAL_STEPS - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                backgroundColor: '#d4af37',
                color: '#0a0a0a',
                px: 4,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#c49d2f',
                },
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={submitting}
              endIcon={<ArrowRightIcon size={20} />}
              sx={{
                backgroundColor: '#d4af37',
                color: '#0a0a0a',
                px: 4,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#c49d2f',
                },
              }}
            >
              Next
            </Button>
          )}
        </Box>
      )}
    </Dialog>
  );
}
