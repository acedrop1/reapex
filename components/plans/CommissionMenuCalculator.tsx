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
  Tabs,
  Tab,
} from '@mui/material';
import { Calculator, ChartLine, Calendar } from '@phosphor-icons/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

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

export default function CommissionMenuCalculator() {
  const [annualGCI, setAnnualGCI] = useState(250000);
  const [currentSplit, setCurrentSplit] = useState(70);
  const [monthlyFees, setMonthlyFees] = useState(1200);
  const [activeTab, setActiveTab] = useState(0);

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [yearlyComparison, setYearlyComparison] = useState<any>({});

  useEffect(() => {
    calculateProjections();
  }, [annualGCI, currentSplit, monthlyFees]);

  const calculateProjections = () => {
    const monthlyGCI = annualGCI / 12;

    // Current brokerage calculation
    const currentMonthlyEarnings = (monthlyGCI * (currentSplit / 100)) - monthlyFees;
    const currentYearlyEarnings = currentMonthlyEarnings * 12;

    // Reapex Growth Plan (90/10, $12k cap, $225/month)
    const reapexSplit = 0.9;
    const reapexCap = 12000;
    const reapexMonthlyFee = 225;
    const reapexMonthlyEarnings = (monthlyGCI * reapexSplit) - reapexMonthlyFee;
    let reapexYearlyEarnings = 0;
    let cappedMonth = 0;

    // Calculate month-by-month with cap
    const monthly: any[] = [];
    let brokerFeesAccumulated = 0; // Track total broker fees paid

    for (let month = 1; month <= 12; month++) {
      const currentMonthly = currentMonthlyEarnings;
      let reapexMonthly = 0;

      // Broker fee this month (10% of GCI) before cap
      const brokerFeeThisMonth = monthlyGCI * 0.1;

      // Check if we've hit the cap
      if (brokerFeesAccumulated < reapexCap) {
        // Still paying to cap
        const remainingCap = reapexCap - brokerFeesAccumulated;
        const actualBrokerFee = Math.min(brokerFeeThisMonth, remainingCap);
        brokerFeesAccumulated += actualBrokerFee;

        // Agent keeps 90% minus monthly fee
        reapexMonthly = (monthlyGCI - actualBrokerFee) - reapexMonthlyFee;

        if (brokerFeesAccumulated >= reapexCap && cappedMonth === 0) {
          cappedMonth = month;
        }
      } else {
        // Cap reached - keep 100% minus monthly fee
        reapexMonthly = monthlyGCI - reapexMonthlyFee;
      }

      monthly.push({
        month: `Month ${month}`,
        current: Math.round(currentMonthly),
        reapex: Math.round(reapexMonthly),
        difference: Math.round(reapexMonthly - currentMonthly),
      });

      reapexYearlyEarnings += reapexMonthly;
    }

    setMonthlyData(monthly);
    setYearlyComparison({
      current: Math.round(currentYearlyEarnings),
      reapex: Math.round(reapexYearlyEarnings),
      difference: Math.round(reapexYearlyEarnings - currentYearlyEarnings),
    });
  };

  return (
    <Box
      sx={{
        mt: 8,
        p: { xs: 4, md: 6 },
        backgroundColor: '#141414',
        borderRadius: 3,
        border: '1px solid #333333',
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Calculator size={32} weight="duotone" color="#d4af37" />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            Interactive Commission Projector
          </Typography>
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: '#999999',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          See your earnings month-by-month with detailed breakdowns
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left: Inputs */}
        <Grid item xs={12} md={4}>
          <Box sx={{ pr: { md: 2 } }}>
            {/* Annual GCI */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#d4af37',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Annual GCI
              </Typography>
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
                    color: '#ffffff',
                    backgroundColor: '#0a0a0a',
                    '& fieldset': {
                      borderColor: '#333333',
                    },
                    '&:hover fieldset': {
                      borderColor: '#d4af37',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#d4af37',
                    },
                  },
                }}
              />
              <Slider
                value={annualGCI}
                onChange={(_, value) => setAnnualGCI(value as number)}
                min={0}
                max={500000}
                step={5000}
                sx={{
                  color: '#d4af37',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#d4af37',
                  },
                }}
              />
            </Box>

            {/* Current Split */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#d4af37',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Current Split: {currentSplit}%
              </Typography>
              <Slider
                value={currentSplit}
                onChange={(_, value) => setCurrentSplit(value as number)}
                min={50}
                max={90}
                step={5}
                sx={{
                  color: '#999999',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#999999',
                  },
                }}
              />
            </Box>

            {/* Monthly Fees */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#d4af37',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Monthly Fees
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={monthlyFees}
                onChange={(e) => setMonthlyFees(Math.max(0, Number(e.target.value)))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    backgroundColor: '#0a0a0a',
                    '& fieldset': {
                      borderColor: '#333333',
                    },
                    '&:hover fieldset': {
                      borderColor: '#d4af37',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#d4af37',
                    },
                  },
                }}
              />
            </Box>

            {/* Yearly Summary */}
            <Card
              sx={{
                p: 3,
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid #d4af37',
                borderRadius: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#999999',
                  display: 'block',
                  mb: 1,
                }}
              >
                Annual Earnings Increase
              </Typography>
              <Typography
                variant="h3"
                sx={{
                      fontWeight: 800,
                  color: yearlyComparison.difference >= 0 ? '#16a34a' : '#dc2626',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {yearlyComparison.difference >= 0 ? '+' : ''}$<AnimatedCounter value={yearlyComparison.difference || 0} />
              </Typography>
            </Card>
          </Box>
        </Grid>

        {/* Right: Visualizations */}
        <Grid item xs={12} md={8}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              mb: 4,
              '& .MuiTab-root': {
                color: '#999999',
                fontFamily: 'DM Sans, sans-serif',
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': {
                  color: '#d4af37',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#d4af37',
              },
            }}
          >
            <Tab label="Monthly Breakdown" icon={<Calendar size={18} />} iconPosition="start" />
            <Tab label="Annual Trend" icon={<ChartLine size={18} />} iconPosition="start" />
          </Tabs>

          {/* Monthly Breakdown Chart */}
          {activeTab === 0 && (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#999999' }}
                  tickFormatter={(value) => value.replace('Month ', 'M')}
                />
                <YAxis
                  tick={{ fill: '#999999' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141414',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend
                  wrapperStyle={{ color: '#ffffff' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#999999"
                  strokeWidth={3}
                  name="Current Brokerage"
                  dot={{ fill: '#999999' }}
                />
                <Line
                  type="monotone"
                  dataKey="reapex"
                  stroke="#d4af37"
                  strokeWidth={3}
                  name="Reapex (Growth Plan)"
                  dot={{ fill: '#d4af37' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* Annual Trend */}
          {activeTab === 1 && (
            <Box sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, backgroundColor: '#1a1a1a', border: '1px solid #333333' }}>
                    <Typography variant="caption" sx={{ color: '#999999', display: 'block', mb: 1 }}>
                      Current Brokerage
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#999999', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                      ${yearlyComparison.current?.toLocaleString()}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '1px solid #d4af37' }}>
                    <Typography variant="caption" sx={{ color: '#d4af37', display: 'block', mb: 1 }}>
                      Reapex (Growth Plan)
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#d4af37', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                      ${yearlyComparison.reapex?.toLocaleString()}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              <Typography
                variant="body1"
                sx={{
                  mt: 4,
                  p: 3,
                  backgroundColor: '#0a0a0a',
                  borderRadius: 2,
                  color: '#cccccc',
                  lineHeight: 1.8,
                }}
              >
                With the Growth Plan (90/10 split, $12k cap, $225/month), you'll reach your cap and then keep 100% of your
                commissions (minus the monthly fee) for the rest of the year. This typically happens around month 7-9 for most agents.
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
