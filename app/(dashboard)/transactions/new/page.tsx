'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import {
  FloppyDisk,
  ArrowLeft,
} from '@phosphor-icons/react';
import Link from 'next/link';

export default function NewTransactionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    transaction_type: 'sale',
    agency_type: 'seller',
    property_address: '',
    property_city: '',
    property_state: '',
    property_zip: '',
    listing_price: '',
    sale_price: '',
    gci: '',
    agent_split_percentage: '',
    status: 'pending',
    closing_date: '',
    contingency_date: '',
    listing_date: '',
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('transactions').insert({
        agent_id: user.id,
        transaction_type: data.transaction_type,
        agency_type: data.agency_type,
        property_address: data.property_address,
        property_city: data.property_city,
        property_state: data.property_state,
        property_zip: data.property_zip,
        listing_price: data.listing_price ? parseFloat(data.listing_price) : null,
        sale_price: data.sale_price ? parseFloat(data.sale_price) : null,
        gci: parseFloat(data.gci) || 0,
        agent_split_percentage: parseFloat(data.agent_split_percentage) || 0,
        status: data.status,
        closing_date: data.closing_date || null,
        contingency_date: data.contingency_date || null,
        listing_date: data.listing_date || null,
        agent_commission: (parseFloat(data.gci) || 0) * ((parseFloat(data.agent_split_percentage) || 0) / 100),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      router.push('/transactions');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransactionMutation.mutate(formData);
  };

  return (
    <Container maxWidth="lg" sx={dashboardStyles.container}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button component={Link} href="/transactions" startIcon={<ArrowLeft size={20} weight="duotone" />} sx={dashboardStyles.button}>
          Back
        </Button>
        <Typography variant="h4" component="h1">
          New Transaction
        </Typography>
      </Box>

      <Paper sx={{ ...dashboardStyles.paper, p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Transaction Type
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={dashboardStyles.textField}>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={formData.transaction_type}
                  label="Transaction Type"
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData({
                      ...formData,
                      transaction_type: newType,
                      agency_type: newType === 'sale' ? 'seller' : 'tenant',
                    });
                  }}
                  required
                >
                  <MenuItem value="sale">Sale</MenuItem>
                  <MenuItem value="rental">Rental</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={dashboardStyles.textField}>
                <InputLabel>Agency Type</InputLabel>
                <Select
                  value={formData.agency_type}
                  label="Agency Type"
                  onChange={(e) => setFormData({ ...formData, agency_type: e.target.value })}
                  required
                >
                  {formData.transaction_type === 'sale' ? (
                    <>
                      <MenuItem value="seller">Seller</MenuItem>
                      <MenuItem value="buyer">Buyer</MenuItem>
                      <MenuItem value="dual">Dual</MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem value="tenant">Tenant</MenuItem>
                      <MenuItem value="landlord">Landlord</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Property Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Property Address"
                value={formData.property_address}
                onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.property_city}
                onChange={(e) => setFormData({ ...formData, property_city: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.property_state}
                onChange={(e) => setFormData({ ...formData, property_state: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={formData.property_zip}
                onChange={(e) => setFormData({ ...formData, property_zip: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Financial Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Listing Price"
                type="number"
                value={formData.listing_price}
                onChange={(e) => setFormData({ ...formData, listing_price: e.target.value })}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sale Price"
                type="number"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GCI (Gross Commission Income)"
                type="number"
                value={formData.gci}
                onChange={(e) => setFormData({ ...formData, gci: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Agent Split %"
                type="number"
                value={formData.agent_split_percentage}
                onChange={(e) => setFormData({ ...formData, agent_split_percentage: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Important Dates
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Listing Date"
                type="date"
                value={formData.listing_date}
                onChange={(e) => setFormData({ ...formData, listing_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Contingency Date"
                type="date"
                value={formData.contingency_date}
                onChange={(e) => setFormData({ ...formData, contingency_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Closing Date"
                type="date"
                value={formData.closing_date}
                onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="under_contract">Under Contract</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/transactions"
                  sx={dashboardStyles.button}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<FloppyDisk size={20} weight="duotone" />}
                  disabled={createTransactionMutation.isPending}
                  sx={dashboardStyles.button}
                >
                  {createTransactionMutation.isPending ? 'Creating...' : 'Create Transaction'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

