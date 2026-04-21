'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Switch,
    FormControlLabel,
    Paper,
    InputAdornment,
    Avatar,
    CircularProgress,
    Autocomplete,
    Chip,
} from '@mui/material';
import {
    FacebookLogo,
    InstagramLogo,
    LinkedinLogo,
    TiktokLogo,
    XLogo,
    UploadSimple,
    UserCircle,
} from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import ImageCropModal from '@/components/modals/ImageCropModal';

interface AgentInfoTabProps {
    userProfile: any;
}

export default function AgentInfoTab({ userProfile }: AgentInfoTabProps) {
    const supabase = createClient();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        full_name: userProfile?.full_name || '',
        email: userProfile?.email || '',
        phone: userProfile?.phone || '',
        bio: userProfile?.bio || '',
        phone_visible: userProfile?.phone_visible || false,
        years_experience: userProfile?.years_experience || '',
        specialties: userProfile?.specialties || [],
        social_facebook: userProfile?.social_facebook || '',
        social_instagram: userProfile?.social_instagram || '',
        social_linkedin: userProfile?.social_linkedin || '',
        social_tiktok: userProfile?.social_tiktok || '',
        social_x: userProfile?.social_x || '',
        headshot_url: userProfile?.headshot_url || '',
    });

    const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');

    // Handle file selection - show crop modal
    const handleHeadshotUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Create object URL for cropping
        const imageUrl = URL.createObjectURL(file);
        setImageToCrop(imageUrl);
        setSelectedFileName(file.name);
        setCropModalOpen(true);
    };

    // Handle cropped image upload
    const handleCroppedImageUpload = async (croppedFile: File) => {
        setUploadingHeadshot(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const fileExt = selectedFileName.split('.').pop() || 'jpg';
            const fileName = `headshot-${Date.now()}.${fileExt}`;
            // RLS policy requires folder structure: {user_id}/{filename}
            const filePath = `${user.id}/${fileName}`;

            // Upload to Supabase storage
            const { error: uploadError } = await supabase.storage
                .from('agent-photos')
                .upload(filePath, croppedFile, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('agent-photos')
                .getPublicUrl(filePath);

            // Update form data
            setFormData({ ...formData, headshot_url: publicUrl });

            // Update database
            const { error: updateError } = await supabase
                .from('users')
                .update({ headshot_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            alert('Profile picture uploaded successfully!');
        } catch (error: any) {
            alert(`Failed to upload image: ${error.message}`);
        } finally {
            setUploadingHeadshot(false);
            // Clean up object URL
            if (imageToCrop) {
                URL.revokeObjectURL(imageToCrop);
                setImageToCrop(null);
            }
        }
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleHeadshotUpload(file);
    };

    const updateProfileMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('users')
                .update({
                    full_name: data.full_name,
                    phone: data.phone,
                    bio: data.bio,
                    headshot_url: data.headshot_url,
                    years_experience: data.years_experience ? parseInt(data.years_experience) : null,
                    specialties: data.specialties,
                    social_facebook: data.social_facebook,
                    social_instagram: data.social_instagram,
                    social_linkedin: data.social_linkedin,
                    social_tiktok: data.social_tiktok,
                    social_x: data.social_x,
                    phone_visible: data.phone_visible,
                })
                .eq('id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            alert('Profile updated successfully!');
        },
        onError: (error: any) => {
            alert(`Failed to update profile: ${error.message}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    return (
        <Box>
            <Paper sx={{ backgroundColor: '#121212', border: '1px solid #2A2A2A', borderRadius: '12px', p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Profile Picture Upload */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
                                Profile Picture
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                {/* Avatar Preview */}
                                <Avatar
                                    src={formData.headshot_url}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        border: '2px solid #2A2A2A',
                                    }}
                                >
                                    <UserCircle size={80} color="#B0B0B0" weight="duotone" />
                                </Avatar>

                                {/* Upload Area */}
                                <Box sx={{ flex: 1 }}>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="headshot-upload"
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleHeadshotUpload(file);
                                        }}
                                    />
                                    <label htmlFor="headshot-upload">
                                        <Box
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            sx={{
                                                border: `2px dashed ${isDragging ? '#E2C05A' : '#2A2A2A'}`,
                                                borderRadius: '12px',
                                                p: 3,
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 200ms ease',
                                                backgroundColor: isDragging ? 'rgba(226, 192, 90, 0.08)' : 'transparent',
                                                '&:hover': {
                                                    borderColor: '#E2C05A',
                                                    backgroundColor: 'rgba(226, 192, 90, 0.05)',
                                                },
                                            }}
                                        >
                                            {uploadingHeadshot ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                    <CircularProgress size={32} sx={{ color: '#E2C05A' }} />
                                                    <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                                                        Uploading...
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                    <UploadSimple size={32} color="#E2C05A" weight="duotone" />
                                                    <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                                                        Drag & drop or click to upload
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#808080' }}>
                                                        PNG, JPG or GIF (max. 5MB)
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </label>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                                sx={dashboardStyles.textField}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                disabled
                                helperText="Email cannot be changed"
                                sx={dashboardStyles.textField}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    sx={dashboardStyles.textField}
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
                                    label={
                                        <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
                                            Make phone number visible to clients
                                        </Typography>
                                    }
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                        </Grid>

                        {/* Professional Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2, mt: 2 }}>
                                Professional Information
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Years of Experience"
                                type="number"
                                value={formData.years_experience}
                                onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                                placeholder="e.g., 5"
                                helperText="Number of years in real estate"
                                sx={dashboardStyles.textField}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Autocomplete
                                multiple
                                freeSolo
                                options={[
                                    'Residential',
                                    'Commercial',
                                    'Luxury',
                                    'First-Time Buyers',
                                    'Investment Properties',
                                    'New Construction',
                                    'Short Sales',
                                    'Foreclosures',
                                    'Relocation',
                                    'Military',
                                ]}
                                value={formData.specialties}
                                onChange={(_, newValue) => setFormData({ ...formData, specialties: newValue })}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            variant="outlined"
                                            label={option}
                                            {...getTagProps({ index })}
                                            key={index}
                                            sx={{
                                                borderColor: '#2A2A2A',
                                                color: '#FFFFFF',
                                                '& .MuiChip-deleteIcon': {
                                                    color: '#B0B0B0',
                                                    '&:hover': {
                                                        color: '#FFFFFF',
                                                    },
                                                },
                                            }}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Specialties"
                                        placeholder="Add specialty"
                                        helperText="Select or type to add custom specialties"
                                        sx={dashboardStyles.textField}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                multiline
                                rows={4}
                                placeholder="Tell clients about yourself..."
                                sx={dashboardStyles.textField}
                            />
                        </Grid>

                        {/* Social Media Section */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2, mt: 2 }}>
                                Social Media
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Facebook"
                                value={formData.social_facebook}
                                onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                                placeholder="https://facebook.com/yourprofile"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FacebookLogo size={20} color="#B0B0B0" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={dashboardStyles.textField}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Instagram"
                                value={formData.social_instagram}
                                onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                                placeholder="https://instagram.com/yourprofile"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <InstagramLogo size={20} color="#B0B0B0" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={dashboardStyles.textField}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="LinkedIn"
                                value={formData.social_linkedin}
                                onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
                                placeholder="https://linkedin.com/in/yourprofile"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LinkedinLogo size={20} color="#B0B0B0" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={dashboardStyles.textField}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="TikTok"
                                value={formData.social_tiktok}
                                onChange={(e) => setFormData({ ...formData, social_tiktok: e.target.value })}
                                placeholder="https://tiktok.com/@yourprofile"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <TiktokLogo size={20} color="#B0B0B0" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={dashboardStyles.textField}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="X (Twitter)"
                                value={formData.social_x}
                                onChange={(e) => setFormData({ ...formData, social_x: e.target.value })}
                                placeholder="https://x.com/yourprofile"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <XLogo size={20} color="#B0B0B0" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={dashboardStyles.textField}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={updateProfileMutation.isPending}
                                sx={dashboardStyles.buttonContained}
                            >
                                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            {/* Image Crop Modal */}
            {imageToCrop && (
                <ImageCropModal
                    open={cropModalOpen}
                    onClose={() => {
                        setCropModalOpen(false);
                        if (imageToCrop) {
                            URL.revokeObjectURL(imageToCrop);
                            setImageToCrop(null);
                        }
                    }}
                    imageSrc={imageToCrop}
                    onCropComplete={handleCroppedImageUpload}
                    fileName={selectedFileName}
                />
            )}
        </Box>
    );
}
