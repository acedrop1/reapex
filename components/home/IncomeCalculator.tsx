'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Slider,
  TextField,
  InputAdornment,
  Grid,
  Card,
  Container,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { Calculator, CurrencyDollar, Percent, HouseLine, CaretDown, Info } from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import Link from 'next/link';

function AnimatedCounter({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 1000 });
  const displayValue = useTransform(springValue, (latest) =>
    Math.round(latest).toLocaleString('en-US')
  );

  useEffect(() => {
    animate(motionValue, value, { duration: 1 });
  }, [value, motionValue]);

  return <motion.span>{displayValue}</motion.span>;
}

export default function IncomeCalculator() {
  const [annualGCI, setAnnualGCI] = useState(250000);
  const [currentSplit, setCurrentSplit] = useState(70);
  const [annualCap, setAnnualCap] = useState(35000);

  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [reapexEarnings, setReapexEarnings] = useState(0);
  const [earningsDifference, setEarningsDifference] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    calculateEarnings();
  }, [annualGCI, currentSplit, annualCap]);

  const calculateEarnings = () => {
    // Reapex Constants
    const REAPEX_ANNUAL_FEE = 450 * 12; // $5,400
    const REAPEX_CLOSING_FEE = 495;

    // Estimate closings based on cap (assuming $16k average cap)
    const estimatedClosings = Math.max(1, Math.round(annualCap / 16000));

    // Current Brokerage Calculation
    // Current Cost = Annual Cap + (Closings * $495)
    const closingFees = estimatedClosings * REAPEX_CLOSING_FEE;
    const currentNet = annualGCI - annualCap - closingFees;

    // Reapex Calculation
    // Reapex Cost = Annual Fee ($5400) + (Closings * $495)
    const reapexNet = annualGCI - REAPEX_ANNUAL_FEE - closingFees;

    // Calculate difference
    const difference = reapexNet - currentNet;

    setCurrentEarnings(currentNet);
    setReapexEarnings(reapexNet);
    setEarningsDifference(difference);

    // Prepare chart data
    setChartData([
      {
        name: 'Current Brokerage',
        earnings: currentNet,
        color: '#dc2626', // Red
      },
      {
        name: 'Reapex Pro Plan',
        earnings: reapexNet,
        color: '#16a34a', // Green
      },
    ]);
  };

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%)',
      }}
    >
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Calculator size={40} weight="duotone" color="#1a1a1a" />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#1a1a1a',
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              Commission Calculator
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: '#666666',
              maxWidth: '800px',
              mx: 'auto',
              fontWeight: 400,
            }}
          >
            See exactly how much more you could earn at Reapex.
          </Typography>
        </Box>

        {/* Main Calculator Card */}
        <Card
          sx={{
            p: { xs: 3, md: 6 },
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            borderRadius: 3,
          }}
        >
          <Grid container spacing={4}>
            {/* Left Side: Inputs */}
            <Grid item xs={12} md={6}>
              <Box sx={{ pr: { md: 4 } }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#1a1a1a' }}>
                  Your Current Situation
                </Typography>

                {/* Annual GCI Slider */}
                <Box sx={{ mb: 5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CurrencyDollar size={24} weight="duotone" color="#1a1a1a" />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      Annual GCI (Gross Commission Income)
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    value={annualGCI}
                    onChange={(e) => setAnnualGCI(Math.max(0, Number(e.target.value)))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        fontSize: '1.25rem',
                        fontWeight: 600,
                      },
                    }}
                  />
                  <Slider
                    value={annualGCI}
                    onChange={(_, value) => setAnnualGCI(value as number)}
                    min={0}
                    max={500000}
                    step={5000}
                    marks={[
                      { value: 0, label: '$0' },
                      { value: 250000, label: '$250k' },
                      { value: 500000, label: '$500k' },
                    ]}
                    sx={{
                      color: '#1a1a1a',
                      height: 8,
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#1a1a1a',
                        width: 20,
                        height: 20,
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: '#1a1a1a',
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: '#e0e0e0',
                      },
                    }}
                  />
                </Box>

                {/* Current Split Slider */}
                <Box sx={{ mb: 5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Percent size={24} weight="duotone" color="#1a1a1a" />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      Your Current Commission Split
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                      {currentSplit}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You keep {currentSplit}%, broker keeps {100 - currentSplit}%
                    </Typography>
                  </Box>
                  <Slider
                    value={currentSplit}
                    onChange={(_, value) => setCurrentSplit(value as number)}
                    min={50}
                    max={90}
                    step={5}
                    marks={[
                      { value: 50, label: '50%' },
                      { value: 70, label: '70%' },
                      { value: 90, label: '90%' },
                    ]}
                    sx={{
                      color: '#1a1a1a',
                      height: 8,
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#1a1a1a',
                        width: 20,
                        height: 20,
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: '#1a1a1a',
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: '#e0e0e0',
                      },
                    }}
                  />
                </Box>

                {/* Current Annual Cap Input */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CurrencyDollar size={24} weight="duotone" color="#1a1a1a" />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                      Current Annual Cap
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    value={annualCap}
                    onChange={(e) => setAnnualCap(Math.max(0, Number(e.target.value)))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText="The total cap amount you pay annually to your current broker"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '1.25rem',
                        fontWeight: 600,
                      },
                    }}
                  />
                  <Slider
                    value={annualCap}
                    onChange={(_, value) => setAnnualCap(value as number)}
                    min={0}
                    max={100000}
                    step={1000}
                    marks={[
                      { value: 0, label: '$0' },
                      { value: 50000, label: '$50k' },
                      { value: 100000, label: '$100k' },
                    ]}
                    sx={{
                      color: '#1a1a1a',
                      mt: 2,
                      height: 8,
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#1a1a1a',
                        width: 20,
                        height: 20,
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: '#1a1a1a',
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: '#e0e0e0',
                      },
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Right Side: Visualization */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  pl: { md: 4 },
                  borderLeft: { md: '1px solid #e0e0e0' },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                {/* Earnings Difference - The Hook */}
                <Box
                  sx={{
                    mb: 4,
                    p: 4,
                    backgroundColor: earningsDifference >= 0 ? '#16a34a15' : '#dc262615',
                    borderRadius: 3,
                    textAlign: 'center',
                    border: `2px solid ${earningsDifference >= 0 ? '#16a34a' : '#dc2626'}`,
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#666666', mb: 1 }}>
                    YOUR INSTANT ANNUAL PAY RAISE
                  </Typography>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      color: earningsDifference >= 0 ? '#16a34a' : '#dc2626',
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      mb: 1,
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    {earningsDifference >= 0 ? '+' : ''}$<AnimatedCounter value={earningsDifference} />
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666666', fontWeight: 500 }}>
                    {earningsDifference >= 0
                      ? 'added to your bottom line with Reapex'
                      : 'Your current split is better'}
                  </Typography>
                </Box>

                {/* Modern Comparison Visual */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1a1a1a' }}>
                    Gross Commission After Splits
                  </Typography>

                  {/* Current Brokerage Bar */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626' }}>
                        Current Brokerage
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#dc2626', fontFamily: '"JetBrains Mono", monospace' }}>
                        ${currentEarnings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 50,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 2,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (currentEarnings / Math.max(currentEarnings, reapexEarnings)) * 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #dc2626 0%, #f87171 100%)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '16px',
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Reapex Bar */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a' }}>
                        Reapex Pro Plan
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a', fontFamily: '"JetBrains Mono", monospace' }}>
                        ${reapexEarnings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 50,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 2,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (reapexEarnings / Math.max(currentEarnings, reapexEarnings)) * 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #16a34a 0%, #4ade80 100%)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '16px',
                          boxShadow: '0 4px 16px rgba(22, 163, 74, 0.3)',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Breakdown Cards */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        p: 2,
                        backgroundColor: '#f9f9f9',
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Current Net Income
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#dc2626', fontFamily: '"JetBrains Mono", monospace' }}>
                        ${currentEarnings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        p: 2,
                        backgroundColor: '#16a34a15',
                        border: '1px solid #16a34a',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Reapex Net Income
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#16a34a', fontFamily: '"JetBrains Mono", monospace' }}>
                        ${reapexEarnings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>

          {/* Disclaimer Accordion - Full Width Below Income Boxes */}
          <Box sx={{ mt: 4 }}>
            <Accordion
              sx={{
                backgroundColor: '#f5f5f5', // Light grey background
                border: '1px solid #e0e0e0',
                borderRadius: '12px !important',
                boxShadow: 'none',
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: 0,
                },
              }}
            >
              <AccordionSummary
                expandIcon={<CaretDown size={20} color="#666666" />}
                sx={{
                  minHeight: '48px',
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                    justifyContent: 'center',
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: '#1a1a1a',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  Disclaimer
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2, px: 3 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#1a1a1a',
                    fontSize: '0.75rem',
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  *The commission calculator is for illustrative purposes only and provides an estimate based solely on the GCI, Split, and Cap figures entered by the user. The estimate and commission split menu do not reflect transaction fees, MLS dues, Realtor® board fees, or other individual business expenses, which may vary. Actual earnings may differ based on transaction volume and specific deal structures. This tool does not constitute a guarantee of income.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Info size={24} weight="duotone" color="#666666" />
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Card>
      </Container>
    </Box>
  );
}
