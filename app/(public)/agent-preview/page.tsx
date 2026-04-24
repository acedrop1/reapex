import { Box, Container, Typography, Grid, Card, Button, Chip, LinearProgress } from '@mui/material';
import {
  Wallet,
  ChartDonut,
  FileText,
  Lightning,
  MegaphoneSimple,
  ShieldCheck,
  TrendUp,
  CaretRight,
  CheckCircle,
  Clock,
  Warning,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default function AgentPreviewPage() {
  // Mock data for dashboard
  const walletBalance = 14250;
  const capProgress = 92; // percentage
  const capTotal = 16000;
  const capPaid = Math.round(capTotal * (capProgress / 100));

  const transactions = [
    {
      id: '1',
      address: '123 Ocean Drive, Miami Beach',
      status: 'pending_contract',
      commission: 12500,
      closingDate: '2024-01-15',
    },
    {
      id: '2',
      address: '456 Park Avenue, New York',
      status: 'under_contract',
      commission: 18750,
      closingDate: '2024-01-22',
    },
    {
      id: '3',
      address: '789 Sunset Boulevard, Los Angeles',
      status: 'inspection',
      commission: 9200,
      closingDate: '2024-02-01',
    },
    {
      id: '4',
      address: '321 Main Street, Austin',
      status: 'closed',
      commission: 7500,
      closingDate: '2024-01-08',
    },
  ];

  const getStatusChip = (status: string) => {
    const statusConfig = {
      pending_contract: { label: 'Pending Contract', color: '#f59e0b' },
      under_contract: { label: 'Under Contract', color: '#d4af37' },
      inspection: { label: 'Inspection', color: '#c49d2f' },
      closed: { label: 'Closed', color: '#16a34a' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];

    return (
      <Chip
        label={config.label}
        sx={{
          backgroundColor: `${config.color}20`,
          color: config.color,
          fontWeight: 600,
          fontSize: '0.75rem',
          border: `1px solid ${config.color}40`,
        }}
      />
    );
  };

  return (
    <Box sx={{ backgroundColor: '#0a0a0a', pt: 12 }}>
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 10 } }}>
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="overline"
            sx={{
              color: '#d4af37',
              fontWeight: 700,
              fontSize: '0.875rem',
              letterSpacing: '0.15em',
              mb: 2,
              display: 'block',
            }}
          >
            Dashboard Preview
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '4rem' },
              color: '#ffffff',
              mb: 2,
            }}
          >
            Your Agent
            <Box component="span" sx={{ color: '#d4af37' }}>
              {' '}
              Command Center
            </Box>
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#999999',
              maxWidth: '700px',
            }}
          >
            This is what your dashboard looks like. Real-time earnings, cap tracking, and instant transfers.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Main Dashboard */}
          <Grid item xs={12} md={8}>
            {/* Top Row - Wallet & Cap */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Wallet Widget */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    p: 4,
                    backgroundColor: '#141414',
                    border: '2px solid #16a34a',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: 'rgba(22, 163, 74, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <Wallet size={32} weight="duotone" color="#16a34a" />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#999999',
                                }}
                    >
                      Available Balance
                    </Typography>
                  </Box>

                  <Typography
                    variant="h2"
                    sx={{
                              fontWeight: 800,
                      color: '#16a34a',
                      mb: 3,
                    }}
                  >
                    ${walletBalance.toLocaleString()}
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Lightning size={20} weight="fill" />}
                    sx={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                              fontWeight: 700,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: '#15803d',
                      },
                    }}
                  >
                    Instant Transfer
                  </Button>
                </Card>
              </Grid>

              {/* Cap Tracker */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    p: 4,
                    backgroundColor: '#141414',
                    border: '2px solid #d4af37',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <ChartDonut size={32} weight="duotone" color="#d4af37" />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#999999',
                                }}
                    >
                      Cap Progress
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2 }}>
                    <Typography
                      variant="h2"
                      sx={{
                                  fontWeight: 800,
                        color: '#d4af37',
                      }}
                    >
                      {capProgress}%
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666666',
                                }}
                    >
                      to 100%
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={capProgress}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#333333',
                      mb: 2,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#d4af37',
                        borderRadius: 6,
                      },
                    }}
                  />

                  <Typography
                    variant="caption"
                    sx={{
                      color: '#999999',
                            }}
                  >
                    ${capPaid.toLocaleString()} of ${capTotal.toLocaleString()} paid
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Active Transactions Table */}
            <Card
              sx={{
                p: 4,
                backgroundColor: '#141414',
                border: '1px solid #333333',
                borderRadius: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <FileText size={28} weight="duotone" color="#d4af37" />
                <Typography
                  variant="h5"
                  sx={{
                          fontWeight: 700,
                    color: '#ffffff',
                  }}
                >
                  Active Transactions
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {transactions.map((transaction) => (
                  <Box
                    key={transaction.id}
                    sx={{
                      p: 3,
                      backgroundColor: '#0a0a0a',
                      borderRadius: 2,
                      border: '1px solid #333333',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#d4af37',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: '200px' }}>
                        <Typography
                          variant="body1"
                          sx={{
                            color: '#ffffff',
                            fontWeight: 600,
                                          mb: 1,
                          }}
                        >
                          {transaction.address}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#666666',
                                        }}
                        >
                          Closing: {new Date(transaction.closingDate).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {getStatusChip(transaction.status)}

                        <Typography
                          variant="h6"
                          sx={{
                            color: '#16a34a',
                            fontWeight: 700,
                                        }}
                        >
                          ${transaction.commission.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Right Column - Quick Actions Sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Accelerator Leads */}
              <Card
                sx={{
                  p: 4,
                  backgroundColor: '#141414',
                  border: '1px solid #333333',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#d4af37',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <TrendUp size={28} weight="duotone" color="#d4af37" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                                  fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      Accelerator Leads
                    </Typography>
                  </Box>
                  <CaretRight size={20} color="#666666" />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#999999',
                          lineHeight: 1.6,
                  }}
                >
                  12 new qualified leads waiting for your review
                </Typography>
                <Chip
                  label="3 Hot Leads"
                  size="small"
                  sx={{
                    mt: 2,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontWeight: 600,
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                />
              </Card>

              {/* Marketing Center */}
              <Card
                sx={{
                  p: 4,
                  backgroundColor: '#141414',
                  border: '1px solid #333333',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#c49d2f',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <MegaphoneSimple size={28} weight="duotone" color="#c49d2f" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                                  fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      Marketing Center
                    </Typography>
                  </Box>
                  <CaretRight size={20} color="#666666" />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#999999',
                          lineHeight: 1.6,
                  }}
                >
                  Create branded social posts, videos, and email campaigns
                </Typography>
              </Card>

              {/* Compliance */}
              <Card
                sx={{
                  p: 4,
                  backgroundColor: '#141414',
                  border: '1px solid #333333',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#16a34a',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(22, 163, 74, 0.3)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: 'rgba(22, 163, 74, 0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <ShieldCheck size={28} weight="duotone" color="#16a34a" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                                  fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      Compliance
                    </Typography>
                  </Box>
                  <CaretRight size={20} color="#666666" />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#999999',
                          lineHeight: 1.6,
                    mb: 2,
                  }}
                >
                  All documents up to date and contracts reviewed
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle size={16} weight="fill" color="#16a34a" />
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#16a34a',
                      fontWeight: 600,
                            }}
                  >
                    100% Compliant
                  </Typography>
                </Box>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Bottom CTA */}
        <Box
          sx={{
            mt: 8,
            p: 6,
            backgroundColor: '#141414',
            borderRadius: 3,
            border: '2px solid #d4af37',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#ffffff',
              mb: 2,
            }}
          >
            Ready to Experience This?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#999999',
              mb: 4,
            }}
          >
            Join hundreds of agents who control their income and build real wealth.
          </Typography>
          <Button
            component="a"
            href="/join"
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#d4af37',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: '1.125rem',
              px: 6,
              py: 2,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#c49d2f',
              },
            }}
          >
            Start Your Application
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
