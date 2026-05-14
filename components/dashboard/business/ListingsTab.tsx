'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Button,
    Menu,
    MenuItem,
    IconButton,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Plus, DotsThreeVertical, ArrowSquareOut } from '@phosphor-icons/react';
import { Edit } from '@mui/icons-material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import CreateListingModal from '@/components/listings/CreateListingModal';
import EditListingModal from '@/components/listings/EditListingModal';

export default function ListingsTab() {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const [openNewListingModal, setOpenNewListingModal] = useState(false);
    const [openEditListingModal, setOpenEditListingModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [isAdmin, setIsAdmin] = useState(false);

    // Mobile detection and menu state
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

    // Menu handlers
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, listingId: string) => {
        event.stopPropagation(); // Prevent card click
        setMenuAnchor(event.currentTarget);
        setSelectedListingId(listingId);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedListingId(null);
    };

    const handleOpenEdit = (listing: any) => {
        setSelectedListing(listing);
        setOpenEditListingModal(true);
    };

    const handleCloseEdit = () => {
        setOpenEditListingModal(false);
        setSelectedListing(null);
    };

    // Fetch current user and check if admin
    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('users')
                .select('id, role')
                .eq('id', user.id)
                .single();

            if (data) {
                setCurrentUserId(data.id);
                setIsAdmin(data.role === 'admin');
            }
            return data;
        },
    });

    // Fetch all agents (only if admin)
    const { data: agents } = useQuery({
        queryKey: ['agents'],
        enabled: isAdmin,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, email')
                .in('role', ['agent', 'admin'])
                .order('full_name');

            if (error) throw error;
            return data || [];
        },
    });

    const { data: listings, isLoading } = useQuery({
        queryKey: ['listings'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('agent_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                    Manage your property listings
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Plus size={20} />}
                    onClick={() => setOpenNewListingModal(true)}
                    sx={dashboardStyles.buttonContained}
                >
                    New Listing
                </Button>
            </Box>

            {isLoading ? (
                <Typography sx={{ color: '#B0B0B0' }}>Loading...</Typography>
            ) : listings && listings.length > 0 ? (
                <Grid container spacing={2}>
                    {listings.map((listing: any) => (
                        <Grid item xs={12} sm={6} md={4} key={listing.id}>
                            <Box sx={{ position: 'relative' }}>
                                <Card
                                    sx={{
                                        backgroundColor: '#121212',
                                        border: '1px solid #2A2A2A',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 200ms ease',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                                        },
                                    }}
                                    onClick={() => handleOpenEdit(listing)}
                                >
                                    {listing.cover_image && (
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={listing.cover_image}
                                            alt={listing.property_address}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                    )}
                                    <CardContent sx={{ minWidth: 0 }}>
                                        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1, fontFamily: '"JetBrains Mono", monospace' }}>
                                            ${listing.price?.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1, wordBreak: 'break-word' }}>
                                            {listing.property_address}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#808080' }}>
                                            {listing.property_city}, {listing.property_state}
                                        </Typography>
                                        <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <Chip
                                                label={listing.status}
                                                size="small"
                                                sx={{
                                                    backgroundColor: listing.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                                                    color: listing.status === 'active' ? '#E2C05A' : '#FF9800',
                                                    border: `1px solid ${listing.status === 'active' ? '#E2C05A' : '#FF9800'}`,
                                                }}
                                            />
                                            {listing.listing_url && (
                                                <Chip
                                                    label="View Listing"
                                                    size="small"
                                                    icon={<ArrowSquareOut size={14} color="#E2C05A" />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        let url = listing.listing_url;
                                                        if (url && !url.startsWith('http')) url = 'https://' + url;
                                                        window.open(url, '_blank', 'noopener,noreferrer');
                                                    }}
                                                    sx={{
                                                        backgroundColor: 'rgba(226, 192, 90, 0.1)',
                                                        color: '#E2C05A',
                                                        border: '1px solid rgba(226, 192, 90, 0.3)',
                                                        cursor: 'pointer',
                                                        '&:hover': { backgroundColor: 'rgba(226, 192, 90, 0.2)' },
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                                {/* 3-dot menu */}
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleMenuOpen(e, listing.id)}
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        color: '#FFFFFF',
                                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                        backdropFilter: 'blur(4px)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        },
                                    }}
                                >
                                    <DotsThreeVertical size={20} weight="bold" />
                                </IconButton>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box sx={{ textAlign: 'center', p: 6, border: '2px dashed #2A2A2A', borderRadius: '12px', backgroundColor: '#121212' }}>
                    <Typography variant="h6" sx={{ color: '#B0B0B0', mb: 1 }}>
                        No listings yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#808080' }}>
                        Create your first listing to get started
                    </Typography>
                </Box>
            )}

            {/* New Listing Modal */}
            <CreateListingModal
                open={openNewListingModal}
                onClose={() => setOpenNewListingModal(false)}
                isAdmin={isAdmin}
                agents={agents || []}
                currentUserId={currentUserId}
            />

            {/* Edit Listing Modal */}
            <EditListingModal
                open={openEditListingModal}
                onClose={handleCloseEdit}
                listing={selectedListing}
                isAdmin={isAdmin}
                agents={agents || []}
            />

            {/* Listing Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #2A2A2A',
                        minWidth: 180,
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        const listing = listings?.find((l: any) => l.id === selectedListingId);
                        if (listing) handleOpenEdit(listing);
                        handleMenuClose();
                    }}
                    sx={{
                        color: '#FFFFFF',
                        '&:hover': { backgroundColor: '#2A2A2A' },
                        py: 1.5,
                    }}
                >
                    <Edit sx={{ mr: 1.5, fontSize: 20 }} />
                    Edit Listing
                </MenuItem>
                <MenuItem
                    onClick={async () => {
                        if (selectedListingId) {
                            const listing = listings?.find((l: any) => l.id === selectedListingId);
                            if (listing) {
                                const newStatus = listing.status === 'active' ? 'archived' : 'active';
                                await supabase
                                    .from('listings')
                                    .update({ status: newStatus })
                                    .eq('id', selectedListingId);
                                queryClient.invalidateQueries(['listings']);
                            }
                        }
                        handleMenuClose();
                    }}
                    sx={{
                        color: '#FFFFFF',
                        '&:hover': { backgroundColor: '#2A2A2A' },
                        py: 1.5,
                    }}
                >
                    {(() => {
                        const listing = listings?.find((l: any) => l.id === selectedListingId);
                        return listing?.status === 'active' ? 'Change to Archived' : 'Change to Active';
                    })()}
                </MenuItem>
            </Menu>
        </Box>
    );
}

