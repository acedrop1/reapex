'use client';

import { useState, useEffect } from 'react';
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
    InputAdornment,
    FormControlLabel,
    Switch,
    Chip,
} from '@mui/material';
import { X, Upload, Trash } from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { useError } from '@/contexts/ErrorContext';
import AddressAutocomplete from '@/components/listings/AddressAutocomplete';

interface Listing {
    id: string;
    agent_id: string;
    title: string | null;
    property_type: string;
    listing_type: string;
    property_address: string;
    property_city: string;
    property_state: string;
    property_zip: string;
    price: number;
    price_period: string | null;
    deposit: number | null;
    monthly_rental: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    garages: number | null;
    square_feet: number | null;
    description: string | null;
    featured: boolean;
    open_house: boolean;
    mls_number: string | null;
    images: string[];
    images_data: any[];
    amenities: string[];
    status: string;
    cover_image: string | null;
    listing_url: string | null;
    features: any;
    created_at: string;
}

interface EditListingModalProps {
    open: boolean;
    onClose: () => void;
    listing: Listing | null;
    isAdmin: boolean;
    agents: any[];
}

export default function EditListingModal({
    open,
    onClose,
    listing,
    isAdmin,
    agents,
}: EditListingModalProps) {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const { showError } = useError();

    // Form state
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
        agent_id: '',
    });
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);

    // Populate form when listing changes
    useEffect(() => {
        if (listing && open) {
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
                features: Array.isArray(listing.features) ? listing.features : [],
                listing_url: listing.listing_url || '',
                status: listing.status || 'active',
                featured: listing.featured || false,
                open_house: listing.open_house || false,
                agent_id: listing.agent_id || '',
            });
            setCoverPreview(listing.cover_image || '');
            setExistingImages(listing.images || []);
            setGalleryPreviews(listing.images || []);
        }
    }, [listing, open]);

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
        // Remove from existing images if it's from the database
        if (index < existingImages.length) {
            setExistingImages(prev => prev.filter((_, i) => i !== index));
        } else {
            // Remove from new uploads
            const newIndex = index - existingImages.length;
            setGalleryImages(prev => prev.filter((_, i) => i !== newIndex));
        }
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const updateListingMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            if (!listing) throw new Error('No listing selected');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Upload cover image if new one selected
            let coverImageUrl = coverPreview;
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

            // Upload new gallery images
            const newGalleryUrls: string[] = [];
            for (const image of galleryImages) {
                const imagePath = `${user.id}/gallery-${Date.now()}-${Math.random()}.${image.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage
                    .from('listing-images')
                    .upload(imagePath, image);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('listing-images')
                        .getPublicUrl(imagePath);
                    newGalleryUrls.push(publicUrl);
                }
            }

            // Combine existing and new gallery images
            const allGalleryUrls = [...existingImages, ...newGalleryUrls];

            const response = await fetch(`/api/listings/${listing.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    agent_id: data.agent_id || user.id,
                    price: parseFloat(data.price),
                    bedrooms: parseInt(data.bedrooms) || 0,
                    bathrooms: parseInt(data.bathrooms) || 0,
                    square_feet: parseInt(data.square_feet) || 0,
                    features: data.features,
                    cover_image: coverImageUrl,
                    images: allGalleryUrls,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update listing');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-listings'] });
            queryClient.invalidateQueries({ queryKey: ['listings'] });
            handleClose();
        },
        onError: (error: Error) => {
            showError({
                title: 'Update Failed',
                message: error.message,
                severity: 'error'
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateListingMutation.mutate(formData);
    };

    const handleClose = () => {
        onClose();
        // Reset state
        setCoverImage(null);
        setGalleryImages([]);
        setCoverPreview('');
        setGalleryPreviews([]);
        setExistingImages([]);
    };

    if (!listing) return null;

    return (
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
                        Edit Listing
                    </Typography>
                    <IconButton onClick={handleClose} size="small" sx={{ color: '#B0B0B0' }}>
                        <X size={20} />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
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

                        {/* Features */}
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

                        {/* Admin: Agent Assignment */}
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

                        {/* Cover Image */}
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
                                    {coverPreview ? 'Change Cover' : 'Upload Cover'}
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

                        {/* Gallery Images */}
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
                            disabled={updateListingMutation.isPending}
                            sx={dashboardStyles.buttonContained}
                        >
                            {updateListingMutation.isPending ? 'Updating...' : 'Update Listing'}
                        </Button>
                    </DialogActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
