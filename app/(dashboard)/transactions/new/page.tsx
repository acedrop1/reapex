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
  Slider,
  ToggleButton,
  ToggleButtonGroup,
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
    property_type: 'residential',
    property_address: '',
    property_city: '',
    property_state: '',
    property_zip: '',
    listing_price: '',
    contract_price: '',
    sale_price: '',
    gci: '',
    agent_split_percentage: '',
    status: 'pending',
    closing_date: '',
    contingency_date: '',
    listing_date: '',
  });
  const [commissionMode, setCommissionMode] = useState<'manual' | 'percentage'>('manual');
  const [commissionAmount, setCommissionAmount] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState(3);

  // Commission resolves to a dollar amount either way: manual entry, or percentage of contract price
  const resolvedCommission = commissionMode === 'percentage'
    ? ((parseFloat(formData.contract_price) || 0) * commissionPercentage) / 100
    : parseFloat(commissionAmount) || 0;
  const isCommissionValid = commissionMode === 'percentage'
    ? !!formData.contract_price
    : !!commissionAmount;

  const createTransactionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('transactions').insert({
        agent_id: user.id,
        transaction_type: data.transaction_type,
        agency_type: data.agency_type,
        property_type: data.property_type,
        property_address: data.property_address,
        property_city: data.property_city,
        property_state: data.property_state,
        property_zip: data.property_zip,
        listing_price: data.listing_price ? parseFloat(data.listing_price) : null,
        contract_price: data.contract_price ? parseFloat(data.contract_price) : null,
        commission_amount: resolvedCommission,
        commission_percentage: commissionMode === 'percentage' ? commissionPercentage : null,
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
    if (!isCommissionValid) {
      alert('Please enter a commission amount, or a contract price to calculate it from.');
      return;
    }
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
              <FormControl fullWidth sx={dashboardStyles.textField}>
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={formData.property_type}
                  label="Property Type"
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  required
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="multifamily">Multifamily</MenuItem>
                  <MenuItem value="condo_coop_townhouse">Condo/Coop/Townhouse</MenuItem>
                  <MenuItem value="mixed_use">Mixed Use</MenuItem>
                  <MenuItem value="land">Land</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                </Select>
              </FormControl>
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
                label="Contract Price"
                type="number"
                value={formData.contract_price}
                onChange={(e) => setFormData({ ...formData, contract_price: e.target.value })}
                required
                sx={dashboardStyles.textField}
              />
            </Grid>
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#111111',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Commission *
                  </Typography>
                  <ToggleButtonGroup
                    value={commissionMode}
                    exclusive
                    size="small"
                    onChange={(e, mode) => mode && setCommissionMode(mode)}
                  >
                    {(['manual', 'percentage'] as const).map((mode) => (
                      <ToggleButton
                        key={mode}
                        value={mode}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          fontSize: '0.7rem',
                          textTransform: 'none',
                          color: '#B0B0B0',
                          border: '1px solid #2A2A2A',
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(226, 192, 90, 0.15)',
                            color: '#E2C05A',
                            '&:hover': { backgroundColor: 'rgba(226, 192, 90, 0.25)' },
                          },
                        }}
                      >
                        {mode === 'manual' ? '$ Amount' : 'Calculate Percentage'}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>

                {commissionMode === 'manual' ? (
                  <TextField
                    fullWidth
                    label="Commission Amount"
                    type="number"
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(e.target.value)}
                    required
                    sx={dashboardStyles.textField}
                  />
                ) : (
                  <Box sx={{ px: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
                        Percentage of Contract Price
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#E2C05A', fontWeight: 600 }}>
                        {commissionPercentage}%
                      </Typography>
                    </Box>
                    <Slider
                      value={commissionPercentage}
                      min={0}
                      max={10}
                      step={0.25}
                      onChange={(e, value) => setCommissionPercentage(value as number)}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}%`}
                      sx={{
                        color: '#E2C05A',
                        '& .MuiSlider-rail': { backgroundColor: '#2A2A2A' },
                      }}
                    />
                    <Typography variant="body2" sx={{ color: formData.contract_price ? '#FFFFFF' : '#808080' }}>
                      {formData.contract_price
                        ? `Commission: $${resolvedCommission.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : 'Enter a contract price to calculate the commission'}
                    </Typography>
                  </Box>
                )}
              </Box>
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

