'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
    Box,
    Typography,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    IconButton,
    LinearProgress,
    CircularProgress,
    InputAdornment,
    FormControlLabel,
    Switch,
    Chip,
} from '@mui/material';
import { Plus, CloudArrowDown, X, CheckCircle, Upload, Trash } from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { useError } from '@/contexts/ErrorContext';
import AddressAutocomplete from '@/components/listings/AddressAutocomplete';

interface CreateListingModalProps {
    open: boolean;
    onClose: () => void;
    isAdmin: boolean;
    agents: any[];
    currentUserId: string;
}

export default function CreateListingModal({
    open,
    onClose,
    isAdmin,
    agents,
    currentUserId,
}: CreateListingModalProps) {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const { showError } = useError();

    const [mlsId, setMlsId] = useState('');
    const [mlsLocation, setMlsLocation] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [importProgress, setImportProgress] = useState<{
        stage: number;
        message: string;
        total: number;
    } | null>(null);

    // Form state for manual listing creation
    const [formData, setFormData] = useState({
        property_address: '',
        property_city: '',
        property_state: 'NJ',
        property_zip: '',
        property_type: 'single_family_home',
        listing_type: 'for_sale',
        price: '',
        bedrooms: '',
        bathrooms: '',
        description: '',
        square_feet: '',
        features: [] as string[],
        listing_url: '',
        status: 'active' as string,
        featured: false as boolean,
        open_house: false as boolean,
        agent_id: currentUserId,
    });
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImage(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setGalleryImages(prev => [...prev, ...files]);
            setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        }
    };

    const removeGalleryImage = (index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleImport = async () => {
        if (!mlsId) {
            showError({
                title: 'MLS ID Required',
                message: 'Please enter an MLS ID to import',
                severity: 'warning'
            });
            return;
        }

        setImportLoading(true);
        setImportProgress({ stage: 1, message: 'Connecting to listing service...', total: 5 });

        try {
            // Simulate progress updates
            setTimeout(() => {
                setImportProgress({ stage: 2, message: 'Searching for MLS listing in database...', total: 5 });
            }, 1000);

            setTimeout(() => {
                setImportProgress({ stage: 3, message: 'Retrieving property details and photos...', total: 5 });
            }, 3000);

            const response = await fetch('/api/listings/import-mls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mlsId, location: 'New Jersey' }),
            });

            const data = await response.json();

            if (!response.ok) {
                setImportProgress(null);
                showError({
                    title: 'Import Failed',
                    message: data.error || 'Failed to import listing from MLS',
                    severity: 'error',
                    action: data.userFriendly ? undefined : {
                        label: 'Contact Support',
                        href: '/support'
                    }
                });
                return;
            }

            // Success - show completion stages
            setImportProgress({ stage: 4, message: 'Downloading and processing property images...', total: 5 });

            await new Promise(resolve => setTimeout(resolve, 1000));

            setImportProgress({ stage: 5, message: 'Populating form with imported data...', total: 5 });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Populate form with imported listing data
            const listing = data.listing;
            setFormData({
                property_address: listing.property_address || '',
                property_city: listing.property_city || '',
                property_state: listing.property_state || 'NJ',
                property_zip: listing.property_zip || '',
                property_type: listing.property_type || 'single_family_home',
                listing_type: listing.listing_type || 'for_sale',
                price: listing.price?.toString() || '',
                bedrooms: listing.bedrooms?.toString() || '',
                bathrooms: listing.bathrooms?.toString() || '',
                description: listing.description || '',
                square_feet: listing.square_feet?.toString() || '',
                features: listing.features || [],
                status: listing.status || 'pending',
                featured: listing.featured || false,
                open_house: listing.open_house || false,
                agent_id: listing.agent_id || currentUserId,
            });

            // Set cover image and gallery from imported images
            if (listing.cover_image) {
                setCoverPreview(listing.cover_image);
            }
            if (listing.images && listing.images.length > 0) {
                setGalleryPreviews(listing.images);
            }

            // Clear MLS fields
            setMlsId('');
            setMlsLocation('');

            // Invalidate queries to refresh listings
            queryClient.invalidateQueries({ queryKey: ['listings'] });
            queryClient.invalidateQueries({ queryKey: ['all-listings'] });

            setImportProgress(null);

            // Show success message
            const importedMlsId = mlsId; // Save before clearing
            showError({
                title: 'Import Successful',
                message: `MLS listing #${importedMlsId} has been imported and saved. The details are shown below. You can close this modal to view the listing, or continue editing to create another listing.`,
                severity: 'success'
            });
        } catch (error: any) {
            setImportProgress(null);
            showError({
                title: 'Connection Error',
                message: error.message || 'Failed to connect to the server. Please check your internet connection.',
                severity: 'error'
            });
        } finally {
            setImportLoading(false);
        }
    };

    const createListingMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Upload cover image if present
            let coverImageUrl = '';
            if (coverImage) {
                const coverPath = `${user.id}/cover-${Date.now()}.${coverImage.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage
                    .from('listing-images')
                    .upload(coverPath, coverImage);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('listing-images')
                        .getPublicUrl(coverPath);
                    coverImageUrl = publicUrl;
                }
            }

            // Upload gallery images if present
            const galleryUrls: string[] = [];
            for (const image of galleryImages) {
                const imagePath = `${user.id}/gallery-${Date.now()}-${Math.random()}.${image.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage
                    .from('listing-images')
                    .upload(imagePath, image);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('listing-images')
                        .getPublicUrl(imagePath);
                    galleryUrls.push(publicUrl);
                }
            }

            const response = await fetch('/api/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    agent_id: data.agent_id || user.id,
                    price: parseFloat(data.price),
                    bedrooms: parseInt(data.bedrooms) || 0,
                    bathrooms: parseInt(data.bathrooms) || 0,
                    square_feet: parseInt(data.square_feet) || 0,
                    features: data.features,
                    listing_url: data.listing_url || null,
                    cover_image: coverImageUrl,
                    images: galleryUrls,
                }),
            });

            if (!response.ok) throw new Error('Failed to create listing');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['listings'] });
            handleClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createListingMutation.mutate(formData);
    };

    const handleClose = () => {
        onClose();
        // Reset form data
        setFormData({
            property_address: '',
            property_city: '',
            property_state: 'NJ',
            property_zip: '',
            property_type: 'single_family_home',
            listing_type: 'for_sale',
            price: '',
            bedrooms: '',
            bathrooms: '',
            description: '',
            square_feet: '',
            features: [],
            listing_url: '',
            status: 'active',
            featured: false,
            open_house: false,
            agent_id: currentUserId,
        });
        setCoverImage(null);
        setGalleryImages([]);
        setCoverPreview('');
        setGalleryPreviews([]);
        setMlsId('');
        setMlsLocation('');
    };

    return (
        <>
            {/* New Listing Modal */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: '#121212',
                        border: '1px solid #2A2A2A',
                        borderRadius: '12px',
                    },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                            New Listing
                        </Typography>
                        <IconButton onClick={handleClose} size="small" sx={{ color: '#B0B0B0' }}>
                            <X size={20} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {/* Import from MLS Section */}
                    <Box sx={{ mb: 3, p: 2, backgroundColor: '#0D0D0D', borderRadius: '8px' }}>
                        <Typography variant="subtitle2" sx={{ color: '#FFFFFF', mb: 1 }}>
                            Import from MLS (New Jersey)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#B0B0B0', display: 'block', mb: 2 }}>
                            Enter an MLS ID to automatically import listing details from New Jersey listings
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={10}>
                                <TextField
                                    fullWidth
                                    label="MLS ID"
                                    value={mlsId}
                                    onChange={(e) => setMlsId(e.target.value)}
                                    placeholder="e.g., 39784475"
                                    size="small"
                                    sx={dashboardStyles.textField}
                                />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                                <Button
                                    variant="contained"
                                    onClick={handleImport}
                                    disabled={importLoading || !mlsId}
                                    startIcon={<CloudArrowDown size={20} />}
                                    sx={{ ...dashboardStyles.button, width: '100%', height: '40px' }}
                                >
                                    {importLoading ? 'Importing...' : 'Import'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    <Typography variant="subtitle2" sx={{ color: '#B0B0B0', mb: 2, textAlign: 'center' }}>
                        — OR —
                    </Typography>

                    {/* Manual Entry Form */}
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <AddressAutocomplete
                                    value={formData.property_address}
                                    onChange={(val) => setFormData({ ...formData, property_address: val })}
                                    onAddressSelect={(result) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            property_address: result.property_address,
                                            property_city: result.property_city,
                                            property_state: result.property_state,
                                            property_zip: result.property_zip,
                                        }));
                                    }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="City"
                                    value={formData.property_city}
                                    onChange={(e) => setFormData({ ...formData, property_city: e.target.value })}
                                    required
                                    sx={dashboardStyles.textField}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="State"
                                    value={formData.property_state}
                                    disabled
                                    sx={dashboardStyles.textField}
                                    helperText="Default: New Jersey"
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="ZIP"
                                    value={formData.property_zip}
                                    onChange={(e) => setFormData({ ...formData, property_zip: e.target.value })}
                                    required
                                    sx={dashboardStyles.textField}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#B0B0B0' }}>Property Type</InputLabel>
                                    <Select
                                        value={formData.property_type}
                                        label="Property Type"
                                        onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                                        sx={dashboardStyles.textField}
                                    >
                                        <MenuItem value="single_family_home">Single Family Home</MenuItem>
                                        <MenuItem value="townhouse">Townhouse</MenuItem>
                                        <MenuItem value="condo">Condo</MenuItem>
                                        <MenuItem value="apartment">Apartment</MenuItem>
                                        <MenuItem value="villa">Villa</MenuItem>
                                        <MenuItem value="studio">Studio</MenuItem>
                                        <MenuItem value="penthouse">Penthouse</MenuItem>
                                        <MenuItem value="duplex">Duplex</MenuItem>
                                        <MenuItem value="multi_family">Multi-Family</MenuItem>
                                        <MenuItem value="office">Office</MenuItem>
                                        <MenuItem value="shop">Shop</MenuItem>
                                        <MenuItem value="retail">Retail</MenuItem>
                                        <MenuItem value="warehouse">Warehouse</MenuItem>
                                        <MenuItem value="commercial">Commercial</MenuItem>
                                        <MenuItem value="commercial_building">Commercial Building</MenuItem>
                                        <MenuItem value="business">Business</MenuItem>
                                        <MenuItem value="mixed_use">Mixed-Use</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#B0B0B0' }}>Listing Type</InputLabel>
                                    <Select
                                        value={formData.listing_type}
                                        label="Listing Type"
                                        onChange={(e) => setFormData({ ...formData, listing_type: e.target.value })}
                                        sx={dashboardStyles.textField}
                                    >
                                        <MenuItem value="for_sale">For Sale</MenuItem>
                                        <MenuItem value="for_rent">For Rent</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="Price"
                                    value={formData.price ? parseFloat(formData.price).toLocaleString() : ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[$,]/g, '');
                                        setFormData({ ...formData, price: value });
                                    }}
                                    required
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={dashboardStyles.textField}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="Square Feet"
                                    type="number"
                                    value={formData.square_feet}
                                    onChange={(e) => setFormData({ ...formData, square_feet: e.target.value })}
                                    sx={dashboardStyles.textField}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="Bedrooms"
                                    type="number"
                                    value={formData.bedrooms}
                                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                                    sx={dashboardStyles.textField}
                                />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label="Bathrooms"
                                    type="number"
                                    value={formData.bathrooms}
                                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                                    sx={dashboardStyles.textField}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    multiline
                                    rows={3}
                                    sx={dashboardStyles.textField}
                                />
                            </Grid>

                            {/* Listing URL */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Listing URL (Optional)"
                                    placeholder="Paste MLS, Zillow, or Realtor.com link"
                                    value={formData.listing_url}
                                    onChange={(e) => setFormData({ ...formData, listing_url: e.target.value })}
                                    sx={dashboardStyles.textField}
                                    helperText="Add a link to this property on MLS, Zillow, Realtor.com, etc."
                                    FormHelperTextProps={{ sx: { color: '#666' } }}
                                />
                            </Grid>

                            {/* Features Checkboxes */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ color: '#FFFFFF', mb: 1.5 }}>
                                    Property Features
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {['Pool', 'Gym', 'Parking', 'Garden', 'Fireplace', 'Central AC', 'Hardwood Floors', 'Updated Kitchen', 'Basement', 'Deck/Patio'].map((feature) => (
                                        <Chip
                                            key={feature}
                                            label={feature}
                                            onClick={() => {
                                                if (formData.features.includes(feature)) {
                                                    setFormData({ ...formData, features: formData.features.filter(f => f !== feature) });
                                                } else {
                                                    setFormData({ ...formData, features: [...formData.features, feature] });
                                                }
                                            }}
                                            sx={{
                                                backgroundColor: formData.features.includes(feature) ? '#E2C05A' : '#2A2A2A',
                                                color: formData.features.includes(feature) ? '#FFFFFF' : '#B0B0B0',
                                                border: `1px solid ${formData.features.includes(feature) ? '#E2C05A' : '#3A3A3A'}`,
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: formData.features.includes(feature) ? '#C4A43B' : '#333333',
                                                },
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Grid>

                            {/* Status, Featured, Open House, Agent Assignment */}
                            {isAdmin && (
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel sx={{ color: '#B0B0B0' }}>Assign to Agent</InputLabel>
                                        <Select
                                            value={formData.agent_id}
                                            label="Assign to Agent"
                                            onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                                            sx={dashboardStyles.textField}
                                        >
                                            {agents?.map((agent) => (
                                                <MenuItem key={agent.id} value={agent.id}>
                                                    {agent.full_name} ({agent.email})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}

                            <Grid item xs={12} sm={isAdmin ? 6 : 4}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: '#B0B0B0' }}>Status</InputLabel>
                                    <Select
                                        value={formData.status}
                                        label="Status"
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        sx={dashboardStyles.textField}
                                    >
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="pending">Pending</MenuItem>
                                        <MenuItem value="sold">Sold</MenuItem>
                                        <MenuItem value="rented">Rented</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={isAdmin ? 6 : 4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.featured}
                                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                        />
                                    }
                                    label="Featured Listing"
                                    sx={{ color: '#FFF', mt: 1 }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={isAdmin ? 6 : 4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.open_house}
                                            onChange={(e) => setFormData({ ...formData, open_house: e.target.checked })}
                                        />
                                    }
                                    label="Open House"
                                    sx={{ color: '#FFF', mt: 1 }}
                                />
                            </Grid>

                            {/* Cover Image Upload */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ color: '#FFFFFF', mb: 1.5 }}>
                                    Cover Image
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<Upload size={20} />}
                                        sx={{
                                            borderColor: '#2A2A2A',
                                            color: '#B0B0B0',
                                            '&:hover': { borderColor: '#E2C05A', backgroundColor: '#1A1A1A' },
                                        }}
                                    >
                                        Upload Cover
                                        <input type="file" hidden accept="image/*" onChange={handleCoverImageChange} />
                                    </Button>
                                    {coverPreview && (
                                        <Box sx={{ position: 'relative', width: 100, height: 100 }}>
                                            <img src={coverPreview} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                            <IconButton
                                                onClick={() => { setCoverImage(null); setCoverPreview(''); }}
                                                sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#121212', '&:hover': { backgroundColor: '#1A1A1A' } }}
                                                size="small"
                                            >
                                                <X size={16} color="#EF4444" />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>

                            {/* Gallery Images Upload */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ color: '#FFFFFF', mb: 1.5 }}>
                                    Gallery Images
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<Upload size={20} />}
                                        sx={{
                                            borderColor: '#2A2A2A',
                                            color: '#B0B0B0',
                                            '&:hover': { borderColor: '#E2C05A', backgroundColor: '#1A1A1A' },
                                        }}
                                    >
                                        Add Images
                                        <input type="file" hidden accept="image/*" multiple onChange={handleGalleryImagesChange} />
                                    </Button>
                                    {galleryPreviews.map((preview, index) => (
                                        <Box key={index} sx={{ position: 'relative', width: 100, height: 100 }}>
                                            <img src={preview} alt={`Gallery ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                            <IconButton
                                                onClick={() => removeGalleryImage(index)}
                                                sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#121212', '&:hover': { backgroundColor: '#1A1A1A' } }}
                                                size="small"
                                            >
                                                <Trash size={16} color="#EF4444" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            </Grid>
                        </Grid>
                        <DialogActions sx={{ mt: 3, px: 0 }}>
                            <Button onClick={handleClose} sx={{ color: '#808080' }}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={createListingMutation.isPending}
                                sx={dashboardStyles.buttonContained}
                            >
                                {createListingMutation.isPending ? 'Creating...' : 'Create Listing'}
                            </Button>
                        </DialogActions>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Progress Dialog */}
            <Dialog
                open={importProgress !== null}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: '#121212',
                        border: '1px solid #2A2A2A',
                        borderRadius: '12px',
                    },
                }}
            >
                <DialogTitle sx={{ pb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                        Importing Listing from MLS
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            {importProgress?.stage === importProgress?.total ? (
                                <CheckCircle size={32} color="#E2C05A" weight="fill" />
                            ) : (
                                <CircularProgress size={32} sx={{ color: '#E2C05A' }} />
                            )}
                            <Typography variant="body1" sx={{ color: '#FFFFFF', flex: 1 }}>
                                {importProgress?.message}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={importProgress ? (importProgress.stage / importProgress.total) * 100 : 0}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#2A2A2A',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: importProgress?.stage === importProgress?.total ? '#E2C05A' : '#E2C05A',
                                    borderRadius: 4,
                                },
                            }}
                        />
                        <Typography variant="caption" sx={{ color: '#808080', mt: 1, display: 'block' }}>
                            Step {importProgress?.stage} of {importProgress?.total}
                        </Typography>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
}
