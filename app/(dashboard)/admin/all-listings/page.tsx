'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  LinearProgress,
} from '@mui/material';
import {
  PencilSimple as EditIcon,
  Trash as DeleteIcon,
  MagnifyingGlass as SearchIcon,
  Plus as PlusIcon,
  CloudArrowDown,
  Upload,
  X,
  Trash,
  CheckCircle,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import CreateListingModal from '@/components/listings/CreateListingModal';
import EditListingModal from '@/components/listings/EditListingModal';

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
  users: {
    full_name: string;
    email: string;
  };
}

const statusColors: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  active: 'success',
  pending: 'warning',
  sold: 'info',
  rented: 'info',
  inactive: 'default',
};

export default function AdminListingsPage() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Table state
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteListingId, setDeleteListingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [openNewListingModal, setOpenNewListingModal] = useState(false);
  const [openEditListingModal, setOpenEditListingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch current user and check if admin
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('id, role, full_name')
        .eq('id', user.id)
        .single();

      if (data) {
        setCurrentUserId(data.id);
        setIsAdmin(data.role === 'admin' || data.role === 'admin_agent');
      }
      return data;
    },
  });

  // Fetch all agents (admin only)
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('role', ['agent', 'admin_agent'])
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all listings
  const { data: listings, isLoading } = useQuery({
    queryKey: ['all-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          users:agent_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Filter listings based on search
  useEffect(() => {
    let filtered = listings || [];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (listing: any) =>
          listing.property_address?.toLowerCase().includes(term) ||
          listing.property_city?.toLowerCase().includes(term) ||
          listing.property_state?.toLowerCase().includes(term) ||
          listing.users?.full_name?.toLowerCase().includes(term) ||
          listing.users?.email?.toLowerCase().includes(term)
      );
    }

    setFilteredListings(filtered);
  }, [listings, searchTerm]);

  const handleOpenEdit = (listing: Listing) => {
    setSelectedListing(listing);
    setOpenEditListingModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditListingModal(false);
    setSelectedListing(null);
  };

  const handleOpenDelete = (id: string) => {
    setDeleteListingId(id);
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
    setDeleteListingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteListingId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', deleteListingId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['all-listings'] });
      handleCloseDelete();
    } catch (err: any) {
      console.error('Error deleting listing:', err);
      alert('Failed to delete listing: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0D' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      {/* Filters - Sticky */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 5, p: 2, backgroundColor: '#121212', borderBottom: '1px solid #2A2A2A', display: 'flex', gap: 2, flexWrap: 'wrap', flexShrink: 0 }}>
        <TextField
          placeholder="Search by address, city, or agent..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: '250px', ...dashboardStyles.textField }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size={20} color="#B0B0B0" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<PlusIcon size={20} />}
          onClick={() => setOpenNewListingModal(true)}
          sx={{ textTransform: 'none', whiteSpace: 'nowrap', ...dashboardStyles.buttonContained }}
        >
          New Listing
        </Button>
      </Box>

      <TableContainer sx={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#121212',
        minHeight: 0,
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#0D0D0D',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#2A2A2A',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
      }}>
        <Table stickyHeader sx={{ ...dashboardStyles.table, minWidth: 800 }}>
          <TableHead sx={dashboardStyles.table}>
            <TableRow sx={dashboardStyles.table}>
              <TableCell sx={dashboardStyles.table}>Address</TableCell>
              <TableCell sx={dashboardStyles.table}>Agent</TableCell>
              <TableCell sx={dashboardStyles.table}>Type</TableCell>
              <TableCell sx={dashboardStyles.table}>Price</TableCell>
              <TableCell sx={dashboardStyles.table}>Status</TableCell>
              <TableCell sx={dashboardStyles.table}>Created</TableCell>
              <TableCell sx={dashboardStyles.table}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={dashboardStyles.table}>
            {filteredListings.length === 0 ? (
              <TableRow sx={dashboardStyles.table}>
                <TableCell colSpan={7} align="center" sx={{ ...dashboardStyles.table, py: 4 }}>
                  <Typography variant="body1" sx={{ color: '#808080' }}>
                    {searchTerm ? 'No listings match your search' : 'No listings yet'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredListings.map((listing) => (
                <TableRow
                  key={listing.id}
                  hover
                  sx={{
                    ...dashboardStyles.table,
                    '&:hover': {
                      backgroundColor: 'rgba(226, 192, 90, 0.04)',
                    },
                  }}
                >
                  <TableCell sx={dashboardStyles.table}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
                      {listing.property_address}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      {listing.property_city}, {listing.property_state} {listing.property_zip}
                    </Typography>
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                      {listing.users?.full_name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#808080' }}>
                      {listing.users?.email}
                    </Typography>
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize', color: '#FFFFFF' }}>
                      {listing.property_type.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#808080', textTransform: 'capitalize' }}>
                      {listing.listing_type.replace(/_/g, ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontFamily: '"JetBrains Mono", monospace' }}>
                      ${listing.price?.toLocaleString() || '0'}
                    </Typography>
                    {listing.price_period && (
                      <Typography variant="caption" sx={{ color: '#808080' }} display="block">
                        /{listing.price_period}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Chip
                      label={listing.status}
                      color={statusColors[listing.status] || 'default'}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    {format(new Date(listing.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell sx={dashboardStyles.table}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(listing)}
                        sx={{
                          color: '#E2C05A',
                          '&:hover': {
                            backgroundColor: 'rgba(226, 192, 90, 0.08)',
                          },
                        }}
                      >
                        <EditIcon size={20} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDelete(listing.id)}
                        sx={{
                          color: '#E57373',
                          '&:hover': {
                            backgroundColor: 'rgba(229, 115, 115, 0.08)',
                          },
                        }}
                      >
                        <DeleteIcon size={20} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Listing Modal */}
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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteOpen}
        onClose={handleCloseDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#121212', color: '#FFF', border: '1px solid #2A2A2A' } }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Listing
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#B0B0B0' }}>
            Are you sure you want to delete this listing? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseDelete}
            disabled={deleting}
            sx={{ textTransform: 'none', color: '#B0B0B0' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleting}
            sx={{
              backgroundColor: '#E57373',
              color: '#ffffff',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#D32F2F',
              },
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

