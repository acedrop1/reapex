'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Avatar,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  Alert,
  LinearProgress,
  IconButton,
  InputAdornment,
  Autocomplete,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  InstagramLogo,
  FacebookLogo,
  LinkedinLogo,
  XLogo,
  GlobeHemisphereWest,
  CreditCard,
  CheckCircle,
  Upload,
  X as CloseIcon,
  CloudArrowUp,
  Image as ImageIcon,
  CheckFat,
} from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AGENT_SPECIALTIES } from '@/lib/constants';
import PaymentMethodManager from '@/components/stripe/PaymentMethodManager';


interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface FormData {
  // Step 0: Welcome screen (no data)

  // Step 1: Profile Picture
  headshot_url: string | null;
  avatarFile: File | null;

  // Step 2: Bio
  bio: string;
  specialties: string[];
  years_experience: number;
  languages: string[];

  // Step 3: Contact Info
  phone: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  x: string;
  tiktok: string;
  website: string;
  phone_visible: boolean;

  // Step 4: Plan Selection
  selected_plan: 'launch' | 'growth' | 'pro' | '';

  // Step 5: Payment Info
  payment_method_id?: string;
}

const TOTAL_STEPS = 6; // 0-5: Welcome, Profile, Bio, Contact, Plan, Payment

const stepTitles = [
  'Welcome',
  'Profile Picture',
  'Bio',
  'Contact Info',
  'Choose Plan',
  'Payment Info',
];

export default function OnboardingWizard({ open, onClose, onComplete }: OnboardingWizardProps) {
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    headshot_url: null,
    avatarFile: null,
    bio: '',
    specialties: [],
    years_experience: 0,
    languages: [],
    phone: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    x: '',
    tiktok: '',
    website: '',
    phone_visible: true,
    selected_plan: '',
    payment_method_id: '',
  });
  const [stripeClientSecret, setStripeClientSecret] = useState('');
  const [stripePromise] = useState(() => loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Initialize clientSecret when reaching payment step
  if (currentStep === 5 && !clientSecret) {
    const fetchClientSecret = async () => {
      try {
        const res = await fetch('/api/stripe/create-setup-intent', { method: 'POST' });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        console.error('Failed to fetch client secret', err);
      }
    };
    fetchClientSecret();
  }

  // Phone formatting
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const formatted = !match[2]
        ? match[1]
        : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
      return formatted;
    }
    return value;
  };

  // Card number formatting
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/(\d{1,4})/g);
    return match ? match.join(' ').substring(0, 19) : '';
  };

  // Expiry date formatting
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  // Detect card type
  const getCardType = (number: string): string => {
    const cleaned = number.replace(/\D/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    return 'unknown';
  };

  const handleAvatarChange = (file: File) => {
    setFormData({ ...formData, avatarFile: file });
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarChange(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleAvatarChange(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setFormData({ ...formData, avatarFile: null, headshot_url: null });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        // Welcome screen - no validation
        break;
      case 1:
        if (!formData.avatarFile && !formData.headshot_url) {
          newErrors.avatar = 'Please upload a profile picture';
        }
        break;
      case 2:
        // Bio is optional - no validation required
        break;
      case 3:
        // Contact info - all fields are optional
        // No validation required for social media and contact fields
        break;
      case 4:
        if (!formData.selected_plan) {
          newErrors.plan = 'Please select a plan';
        }
        break;
      case 5:
        // Payment validation handled by Stripe Elements
        if (formData.selected_plan !== 'launch' && !formData.payment_method_id) {
          // We can't easily validate specific fields here, but we will validate on "Next/Submit"
          // Actually, for the last step (submit), we rely on stripe.confirmSetup
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep + 1 === 5) { // If moving TO the payment step (index 5)
        // Fetch Client Secret
        fetch('/api/stripe/create-setup-intent', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.clientSecret) setStripeClientSecret(data.clientSecret);
          });
      }
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    console.log('Submitting onboarding data:', formData);

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: {
            ...formData,
            specialties: formData.specialties,
            years_experience: formData.years_experience,
            languages: formData.languages,
            payment_method_id: formData.payment_method_id
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user && formData.avatarFile) {
        // Use 'agent-photos' bucket as per migration 015
        const fileExt = formData.avatarFile.name.split('.').pop();
        // Path should include user ID folder as per RLS: (storage.foldername(name))[1] = auth.uid()
        const fileName = `${user.id}/headshot-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('agent-photos')
          .upload(fileName, formData.avatarFile, {
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('agent-photos')
            .getPublicUrl(fileName);

          await supabase.from('users').update({ headshot_url: publicUrl }).eq('id', user.id);
        } else {
          console.error('Avatar upload failed:', uploadError);
        }
      }

      console.log('Onboarding complete successful');
      onComplete();
    } catch (error: any) {
      console.error('Onboarding submission error:', error);
      setErrors({ submit: error.message });
      // Fallback alert to ensure user sees the error
      window.alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };




  const progressPercentage = ((currentStep + 1) / TOTAL_STEPS) * 100;
  // const cardType = getCardType(formData.card_number); // Unused


  // Constants for languages
  const LANGUAGES = [
    'English', 'Spanish', 'French', 'Mandarin', 'Cantonese',
    'Tagalog', 'Vietnamese', 'Korean', 'German', 'Arabic',
    'Russian', 'Portuguese', 'Hindi', 'Urdu', 'Japanese',
    'Italian', 'Persian', 'Polish', 'Gujarati', 'Hebrew'
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Welcome Screen
        return (
          <Box sx={{
            textAlign: 'center',
            py: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Box sx={{
              width: 200,
              height: 200,
              position: 'relative',
              mb: 4,
              filter: 'brightness(1.1)',
            }}>
              <Image
                src="/logos/logo.svg"
                alt="Reapex Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#E2C05A',
                mb: 2,
                letterSpacing: '-0.02em',
              }}
            >
              Welcome to Reapex
            </Typography>
            <Typography variant="h6" sx={{ color: '#B0B0B0', maxWidth: 500 }}>
              Let's set up your profile in just a few steps
            </Typography>
          </Box>
        );

      case 1:
        // Profile Picture with Drag & Drop
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Upload Your Profile Picture
            </Typography>

            {avatarPreview ? (
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  src={avatarPreview}
                  sx={{
                    width: 200,
                    height: 200,
                    mx: 'auto',
                    border: '4px solid #2A2A2A',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                />
                <IconButton
                  onClick={handleRemoveAvatar}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: '#EF5350',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#D32F2F',
                    },
                  }}
                  size="small"
                >
                  <CloseIcon size={20} />
                </IconButton>
              </Box>
            ) : (
              <Box
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById('avatar-upload')?.click()}
                sx={{
                  width: 300,
                  height: 300,
                  mx: 'auto',
                  border: `3px dashed ${isDragging ? '#E2C05A' : '#2A2A2A'}`,
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragging ? '#1A1A1A' : '#121212',
                  transition: 'all 0.3s ease',
                  mb: 2,
                  '&:hover': {
                    borderColor: '#E2C05A',
                    backgroundColor: '#1A1A1A',
                    transform: 'scale(1.02)',
                  },
                }}
              >
                {isDragging ? (
                  <ImageIcon size={80} color="#E2C05A" weight="duotone" />
                ) : (
                  <CloudArrowUp size={80} color="#B0B0B0" weight="duotone" />
                )}
                <Typography variant="h6" sx={{ mt: 3, fontWeight: 500, color: '#B0B0B0' }}>
                  {isDragging ? 'Drop image here' : 'Click or drag image here'}
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, color: '#808080' }}>
                  Maximum file size: 10MB
                </Typography>
              </Box>
            )}

            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleFileSelect}
            />

            {errors.avatar && (
              <Typography color="error" variant="caption" display="block" sx={{ mt: 2 }}>
                {errors.avatar}
              </Typography>
            )}
          </Box>
        );

      case 2:
        // Bio & Experience
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Professional Profile
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  error={!!errors.bio}
                  helperText={errors.bio || "Tell us a bit about yourself"}
                  sx={dashboardStyles.textField}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Years of Experience"
                  value={formData.years_experience || ''}
                  onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
                  sx={dashboardStyles.textField}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0' }}>
                  Languages Spoken
                </Typography>
                <Autocomplete
                  multiple
                  freeSolo
                  options={LANGUAGES}
                  value={formData.languages || []}
                  onChange={(_, newValue) => setFormData({ ...formData, languages: newValue })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                        sx={{
                          backgroundColor: 'rgba(76, 175, 80, 0.2)', // Green tint
                          border: '1px solid rgba(76, 175, 80, 0.3)',
                          color: '#81C784',
                          fontWeight: 500,
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select or type..."
                      sx={dashboardStyles.textField}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#B0B0B0' }}>
                  Specialties
                </Typography>
                <Autocomplete
                  multiple
                  freeSolo
                  options={AGENT_SPECIALTIES}
                  value={formData.specialties}
                  onChange={(_, newValue) => setFormData({ ...formData, specialties: newValue })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                        sx={{
                          backgroundColor: 'rgba(226, 192, 90, 0.2)',
                          border: '1px solid rgba(226, 192, 90, 0.3)',
                          color: '#EDD48A',
                          fontWeight: 500,
                          '& .MuiChip-deleteIcon': {
                            color: '#F5E6A3',
                            '&:hover': {
                              color: '#EF5350',
                            },
                          },
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select or type..."
                      sx={dashboardStyles.textField}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        // Contact Info (unchanged structure, just ensuring it renders)
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Contact Information
            </Typography>

            <Grid container spacing={3}>
              {/* Phone Number */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    phone: formatPhoneNumber(e.target.value)
                  })}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  placeholder="(123) 456-7890"
                  InputProps={{
                    startAdornment: <Phone size={20} style={{ marginRight: 8, color: '#B0B0B0' }} />,
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#1A1A1A',
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.phone_visible}
                      onChange={(e) => setFormData({ ...formData, phone_visible: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#E2C05A',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#E2C05A',
                        },
                      }}
                    />
                  }
                  label="Make phone visible to clients"
                  sx={{ mt: 1, color: '#B0B0B0' }}
                />
              </Grid>

              {/* Instagram & Facebook */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@username"
                  InputProps={{
                    startAdornment: <InstagramLogo size={20} style={{ marginRight: 8, color: '#E1306C' }} />,
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#1A1A1A',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Facebook"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="Profile URL"
                  InputProps={{
                    startAdornment: <FacebookLogo size={20} style={{ marginRight: 8, color: '#1877F2' }} />,
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#1A1A1A',
                    },
                  }}
                />
              </Grid>

              {/* LinkedIn & X (Twitter) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="LinkedIn"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="Profile URL"
                  InputProps={{
                    startAdornment: <LinkedinLogo size={20} style={{ marginRight: 8, color: '#0A66C2' }} />,
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#1A1A1A',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="X (Twitter)"
                  value={formData.x}
                  onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                  placeholder="@username"
                  InputProps={{
                    startAdornment: <XLogo size={20} style={{ marginRight: 8, color: '#B0B0B0' }} />,
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#1A1A1A',
                    },
                  }}
                />
              </Grid>

              {/* TikTok & Website */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="TikTok"
                  value={formData.tiktok}
                  onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                  placeholder="@username"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: '#B0B0B0', display: 'flex', alignItems: 'center' }}>
                        TT
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#1A1A1A',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  InputProps={{
                    startAdornment: <GlobeHemisphereWest size={20} style={{ marginRight: 8, color: '#B0B0B0' }} />,
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: '#1A1A1A',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        // Plan Selection
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Choose Your Plan
            </Typography>
            <RadioGroup
              value={formData.selected_plan}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => setFormData({ ...formData, selected_plan: e.target.value as any })}
            >
              <Card
                sx={{
                  mb: 2,
                  backgroundColor: '#121212',
                  border: formData.selected_plan === 'launch' ? '2px solid #E2C05A' : '1px solid #2A2A2A',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#E2C05A',
                  },
                }}
                onClick={() => setFormData({ ...formData, selected_plan: 'launch' })}
              >
                <CardContent>
                  <FormControlLabel
                    value="launch"
                    control={<Radio sx={{ color: '#E2C05A' }} />}
                    label={
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Reapex Launch</Typography>
                        <Typography variant="body2" color="text.secondary">
                          $0/month - 80/20 Commission Split, $21,000 Annual Commission Cap
                        </Typography>
                      </Box>
                    }
                  />
                </CardContent>
              </Card>

              <Card
                sx={{
                  mb: 2,
                  backgroundColor: '#121212',
                  border: formData.selected_plan === 'growth' ? '2px solid #E2C05A' : '1px solid #2A2A2A',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#E2C05A',
                  },
                }}
                onClick={() => setFormData({ ...formData, selected_plan: 'growth' })}
              >
                <CardContent>
                  <FormControlLabel
                    value="growth"
                    control={<Radio sx={{ color: '#E2C05A' }} />}
                    label={
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Reapex Growth</Typography>
                        <Typography variant="body2" color="text.secondary">
                          $175/month - 90/10 Commission Split, $18,000 Annual Commission Cap
                        </Typography>
                      </Box>
                    }
                  />
                </CardContent>
              </Card>

              <Card
                sx={{
                  backgroundColor: '#121212',
                  border: formData.selected_plan === 'pro' ? '2px solid #E2C05A' : '1px solid #2A2A2A',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#E2C05A',
                  },
                }}
                onClick={() => setFormData({ ...formData, selected_plan: 'pro' })}
              >
                <CardContent>
                  <FormControlLabel
                    value="pro"
                    control={<Radio sx={{ color: '#E2C05A' }} />}
                    label={
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Reapex Pro</Typography>
                        <Typography variant="body2" color="text.secondary">
                          $450/month - 100% Commission, No Commission Cap
                        </Typography>
                      </Box>
                    }
                  />
                </CardContent>
              </Card>
            </RadioGroup>
            {errors.plan && (
              <Typography color="error" variant="caption" display="block" sx={{ mt: 2 }}>
                {errors.plan}
              </Typography>
            )}
          </Box>
        );

      case 5:
        // Payment Info
        // Options for Element appearance
        // Options for Element appearance - UNUSED now that we use PaymentMethodManager
        // const options = { ... }


        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Payment Information
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: '#B0B0B0' }}>
              Please enter your payment details securely below. This card will be used for your monthly subscription.
            </Typography>

            {clientSecret ? (
              <PaymentMethodManager
                clientSecret={clientSecret}
                onSelect={(paymentMethodId) => {
                  setFormData(prev => ({ ...prev, payment_method_id: paymentMethodId }));
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={32} sx={{ color: '#E2C05A' }} />
              </Box>
            )}

            {
              errors.submit && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errors.submit}
                </Alert>
              )
            }
          </Box >
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          backgroundColor: '#0A0A0A',
          borderRadius: '16px',
          border: '1px solid #2A2A2A',
          boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
          overflow: 'hidden',
        },
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      {/* Progress Bar */}
      <Box sx={{ position: 'relative' }}>
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{
            height: 6,
            backgroundColor: '#2A2A2A',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#E2C05A',
              transition: 'transform 0.4s ease',
            },
          }}
        />
      </Box>

      <DialogContent sx={{ p: 4 }}>
        {/* Step Title (except welcome screen) */}
        {currentStep > 0 && (
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="overline" sx={{ color: '#E2C05A', fontWeight: 600, letterSpacing: '0.1em' }}>
              Step {currentStep} of {TOTAL_STEPS - 1}
            </Typography>
          </Box>
        )}

        {/* Step Content */}
        <Box sx={{ minHeight: 450, mb: 3 }}>
          {renderStepContent()}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
          <Button
            disabled={currentStep === 0 || submitting}
            onClick={handleBack}
            startIcon={<ArrowLeft size={20} />}
            sx={{ color: '#B0B0B0', '&:hover': { color: '#FFFFFF', backgroundColor: 'transparent' } }}
          >
            Back
          </Button>

          {currentStep === TOTAL_STEPS - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || (currentStep === 5 && !formData.payment_method_id)}
              endIcon={!submitting && <CheckCircle size={20} weight="fill" />}
              sx={{
                borderRadius: '8px',
                px: 4,
                py: 1.5,
                backgroundColor: formData.payment_method_id ? '#4CAF50' : '#E2C05A',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(226, 192, 90, 0.4)',
                '&:hover': {
                  backgroundColor: formData.payment_method_id ? '#43A047' : '#D4B04A',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(226, 192, 90, 0.5)',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#1A1A1A',
                  color: '#666',
                },
                transition: 'all 0.2s',
              }}
            >
              {submitting ? 'Completing...' : 'Complete Onboarding'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowRight size={20} />}
              sx={{
                borderRadius: '8px',
                px: 4,
                py: 1.5,
                backgroundColor: '#E2C05A',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(226, 192, 90, 0.4)',
                '&:hover': {
                  backgroundColor: '#D4B04A',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(226, 192, 90, 0.5)',
                },
                transition: 'all 0.2s',
              }}
            >
              Continue
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
