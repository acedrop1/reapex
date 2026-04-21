import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Container, Typography, Box, Grid, Card, CardContent, Button } from '@mui/material';

export default async function SupportPage() {
  const supabase = await createServerComponentClient();

  // Use getUser() instead of getSession() for server-side security
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        Support & Brokerage
      </Typography>

      <Grid container spacing={3}>
        {/* Get Help */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '1px solid #e0e0e0', borderRadius: 0 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Get Help
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    py: 1.5,
                    borderRadius: 0,
                    '&:hover': { backgroundColor: '#333333' },
                  }}
                >
                  Submit Support Ticket
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#1a1a1a',
                    color: '#1a1a1a',
                    py: 1.5,
                    borderRadius: 0,
                  }}
                >
                  Ask a Broker Question
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Our People */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '1px solid #e0e0e0', borderRadius: 0 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Our People
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                Company directory and preferred vendor list coming soon.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Office Resources */}
        <Grid item xs={12}>
          <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 0 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Office Resources
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ borderRadius: 0, borderColor: '#1a1a1a', color: '#1a1a1a', py: 1.5 }}
                  >
                    Book Conference Room
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ borderRadius: 0, borderColor: '#1a1a1a', color: '#1a1a1a', py: 1.5 }}
                  >
                    Wi-Fi Setup
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ borderRadius: 0, borderColor: '#1a1a1a', color: '#1a1a1a', py: 1.5 }}
                  >
                    Printer Instructions
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
