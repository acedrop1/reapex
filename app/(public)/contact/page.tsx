import { Container, Typography, Box, Grid, Card, CardContent, Button, TextField } from '@mui/material';
import { Send, LocationOn, Email } from '@mui/icons-material';

export default function ContactPage() {
  return (
    <Box sx={{ backgroundColor: '#000000', pt: 16, pb: 8, minHeight: '100vh' }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#ffffff' }}>
            Contact Us
          </Typography>
          <Typography variant="h6" sx={{ color: '#999999' }}>
            Get in touch with our team
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Contact Form */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                p: 4,
                backgroundColor: '#111111',
                border: '1px solid #2a2a2a',
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3, color: '#ffffff' }}>
                Send us a Message
              </Typography>
              <Box component="form" sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: '#2a2a2a' },
                          '&:hover fieldset': { borderColor: '#d4af37' },
                          '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                        },
                        '& .MuiInputLabel-root': { color: '#999999' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: '#2a2a2a' },
                          '&:hover fieldset': { borderColor: '#d4af37' },
                          '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                        },
                        '& .MuiInputLabel-root': { color: '#999999' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: '#2a2a2a' },
                          '&:hover fieldset': { borderColor: '#d4af37' },
                          '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                        },
                        '& .MuiInputLabel-root': { color: '#999999' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      multiline
                      rows={6}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: '#2a2a2a' },
                          '&:hover fieldset': { borderColor: '#d4af37' },
                          '&.Mui-focused fieldset': { borderColor: '#d4af37' },
                        },
                        '& .MuiInputLabel-root': { color: '#999999' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#d4af37' },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      startIcon={<Send />}
                      sx={{
                        backgroundColor: '#d4af37',
                        color: '#0a0a0a',
                        py: 1.5,
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: '#c49d2f',
                        },
                      }}
                    >
                      Send Message
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Card>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                p: 4,
                height: '100%',
                backgroundColor: '#111111',
                border: '1px solid #2a2a2a',
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3, color: '#ffffff' }}>
                Get in Touch
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'start', mb: 2 }}>
                  <LocationOn sx={{ color: '#d4af37', mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      Address
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#999999' }}>
                      260 Columbia Ave, Suite 20<br />
                      Fort Lee, NJ 07024
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'start' }}>
                  <Email sx={{ color: '#d4af37', mr: 2, mt: 0.5 }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#999999' }}>
                      info@re-apex.com
                    </Typography>
                  </Box>
                </Box>
              </Box>

            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

