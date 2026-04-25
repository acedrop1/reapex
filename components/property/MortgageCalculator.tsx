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
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { Calculator, ChartDonut, ChartLine } from '@phosphor-icons/react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface MortgageCalculatorProps {
  propertyPrice: number;
}

export default function MortgageCalculator({ propertyPrice }: MortgageCalculatorProps) {
  const initialPrice = propertyPrice && propertyPrice > 0 ? propertyPrice : 500000;
  const [homePrice, setHomePrice] = useState(initialPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTerm, setLoanTerm] = useState(30);
  const [interestRate, setInterestRate] = useState(7.5);
  const [propertyTax, setPropertyTax] = useState(1.2);
  const [homeInsurance, setHomeInsurance] = useState(1500);
  const [hoaFees, setHoaFees] = useState(0);

  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [loanAmount, setLoanAmount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);
  const [amortizationData, setAmortizationData] = useState<any[]>([]);

  useEffect(() => {
    calculateMortgage();
  }, [homePrice, downPaymentPercent, loanTerm, interestRate, propertyTax, homeInsurance, hoaFees]);

  const calculateMortgage = () => {
    const down = homePrice * (downPaymentPercent / 100);
    const loan = homePrice - down;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Monthly principal and interest
    let monthlyPI = 0;
    if (monthlyRate > 0) {
      monthlyPI =
        (loan * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      monthlyPI = loan / numberOfPayments;
    }

    // Monthly property tax
    const monthlyTax = (homePrice * (propertyTax / 100)) / 12;

    // Monthly insurance
    const monthlyInsurance = homeInsurance / 12;

    // Total monthly payment
    const total = monthlyPI + monthlyTax + monthlyInsurance + hoaFees;

    setDownPayment(down);
    setLoanAmount(loan);
    setMonthlyPayment(total);
    setTotalPayment(total * numberOfPayments + down);

    // Payment Breakdown for Donut Chart
    const breakdown = [
      { name: 'Principal & Interest', value: monthlyPI, color: '#d4af37' },
      { name: 'Property Tax', value: monthlyTax, color: '#c49d2f' },
      { name: 'Home Insurance', value: monthlyInsurance, color: '#f0d98a' },
    ];
    if (hoaFees > 0) {
      breakdown.push({ name: 'HOA Fees', value: hoaFees, color: '#16a34a' });
    }
    setPaymentBreakdown(breakdown);

    // Amortization Schedule for Line Chart (yearly data points)
    const schedule: any[] = [];
    let balance = loan;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    for (let year = 0; year <= loanTerm; year += 1) {
      const month = year * 12;

      if (year === 0) {
        schedule.push({
          year: 0,
          principal: 0,
          interest: 0,
          balance: loan,
        });
      } else {
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;

        // Calculate for each month in the year
        for (let m = 0; m < 12; m++) {
          if (balance > 0) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPI - interestPayment;

            yearlyInterest += interestPayment;
            yearlyPrincipal += principalPayment;
            balance = Math.max(0, balance - principalPayment);
          }
        }

        totalInterestPaid += yearlyInterest;
        totalPrincipalPaid += yearlyPrincipal;

        schedule.push({
          year: year,
          principal: Math.round(totalPrincipalPaid),
          interest: Math.round(totalInterestPaid),
          balance: Math.round(balance),
        });
      }
    }

    setAmortizationData(schedule);
  };

  return (
    <Card
      sx={{
        p: 4,
        backgroundColor: '#1a1a1a',
        border: '1px solid #2a2a2a',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Calculator size={32} weight="duotone" color="#d4af37" />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
          Mortgage Calculator
        </Typography>
      </Box>

      <Divider sx={{ mb: 3, borderColor: '#2a2a2a' }} />

      {/* Monthly Payment Display */}
      <Box sx={{ mb: 4, textAlign: 'center', py: 3, backgroundColor: '#141414', borderRadius: 2, border: '1px solid #2a2a2a' }}>
        <Typography variant="body2" gutterBottom sx={{ color: '#999999' }}>
          Estimated Monthly Payment
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#d4af37' }}>
          ${monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </Typography>
        <Typography variant="caption" sx={{ color: '#999999' }}>
          per month
        </Typography>
      </Box>

      {/* Payment Breakdown */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6}>
          <Typography variant="body2" sx={{ color: '#999999' }}>
            Down Payment
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
            ${downPayment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" sx={{ color: '#999999' }}>
            Loan Amount
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
            ${loanAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3, borderColor: '#2a2a2a' }} />

      {/* Home Price */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#ffffff' }}>
          Home Price
        </Typography>
        <TextField
          fullWidth
          type="number"
          value={homePrice}
          onChange={(e) => setHomePrice(Number(e.target.value))}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              color: '#ffffff',
              '& fieldset': { borderColor: '#2a2a2a' },
              '&:hover fieldset': { borderColor: '#d4af37' },
              '&.Mui-focused fieldset': { borderColor: '#d4af37' },
            },
          }}
        />
        <Slider
          value={homePrice}
          onChange={(_, value) => setHomePrice(value as number)}
          min={50000}
          max={5000000}
          step={10000}
          sx={{
            color: '#d4af37',
            '& .MuiSlider-thumb': {
              backgroundColor: '#d4af37',
            },
            '& .MuiSlider-track': {
              backgroundColor: '#d4af37',
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#2a2a2a',
            },
          }}
        />
      </Box>

      {/* Down Payment */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#ffffff' }}>
          Down Payment: {downPaymentPercent}%
        </Typography>
        <Slider
          value={downPaymentPercent}
          onChange={(_, value) => setDownPaymentPercent(value as number)}
          min={0}
          max={50}
          step={1}
          marks={[
            { value: 0, label: '0%' },
            { value: 20, label: '20%' },
            { value: 50, label: '50%' },
          ]}
          sx={{
            color: '#d4af37',
            '& .MuiSlider-thumb': {
              backgroundColor: '#d4af37',
            },
            '& .MuiSlider-track': {
              backgroundColor: '#d4af37',
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#2a2a2a',
            },
            '& .MuiSlider-markLabel': {
              color: '#999999',
            },
          }}
        />
      </Box>

      {/* Interest Rate */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#ffffff' }}>
          Interest Rate: {interestRate}%
        </Typography>
        <Slider
          value={interestRate}
          onChange={(_, value) => setInterestRate(value as number)}
          min={2}
          max={12}
          step={0.1}
          marks={[
            { value: 2, label: '2%' },
            { value: 7, label: '7%' },
            { value: 12, label: '12%' },
          ]}
          sx={{
            color: '#d4af37',
            '& .MuiSlider-thumb': {
              backgroundColor: '#d4af37',
            },
            '& .MuiSlider-track': {
              backgroundColor: '#d4af37',
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#2a2a2a',
            },
            '& .MuiSlider-markLabel': {
              color: '#999999',
            },
          }}
        />
      </Box>

      {/* Loan Term */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#ffffff' }}>
          Loan Term: {loanTerm} years
        </Typography>
        <Slider
          value={loanTerm}
          onChange={(_, value) => setLoanTerm(value as number)}
          min={10}
          max={30}
          step={5}
          marks={[
            { value: 10, label: '10y' },
            { value: 15, label: '15y' },
            { value: 20, label: '20y' },
            { value: 30, label: '30y' },
          ]}
          sx={{
            color: '#d4af37',
            '& .MuiSlider-thumb': {
              backgroundColor: '#d4af37',
            },
            '& .MuiSlider-track': {
              backgroundColor: '#d4af37',
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#2a2a2a',
            },
            '& .MuiSlider-markLabel': {
              color: '#999999',
            },
          }}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Tabs for Calculator / Charts */}
      <Box sx={{ borderBottom: 1, borderColor: '#2a2a2a', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#999999',
              '&.Mui-selected': {
                color: '#d4af37',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#d4af37',
            },
          }}
        >
          <Tab label="Calculator" icon={<Calculator size={18} />} iconPosition="start" />
          <Tab label="Payment Breakdown" icon={<ChartDonut size={18} />} iconPosition="start" />
          <Tab label="Amortization" icon={<ChartLine size={18} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Calculator */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: '#ffffff' }}>
            Additional Monthly Costs
          </Typography>

          {/* Property Tax */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" gutterBottom sx={{ color: '#999999' }}>
              Property Tax Rate: {propertyTax}%
            </Typography>
            <Slider
              value={propertyTax}
              onChange={(_, value) => setPropertyTax(value as number)}
              min={0}
              max={5}
              step={0.1}
              sx={{
                color: '#1a1a1a',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#1a1a1a',
                },
              }}
            />
          </Box>

          {/* Home Insurance */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" gutterBottom sx={{ color: '#999999' }}>
              Annual Home Insurance: ${homeInsurance}
            </Typography>
            <Slider
              value={homeInsurance}
              onChange={(_, value) => setHomeInsurance(value as number)}
              min={500}
              max={5000}
              step={100}
              sx={{
                color: '#1a1a1a',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#1a1a1a',
                },
              }}
            />
          </Box>

          {/* HOA Fees */}
          <Box>
            <Typography variant="caption" gutterBottom sx={{ color: '#999999' }}>
              Monthly HOA Fees: ${hoaFees}
            </Typography>
            <Slider
              value={hoaFees}
              onChange={(_, value) => setHoaFees(value as number)}
              min={0}
              max={1000}
              step={25}
              sx={{
                color: '#1a1a1a',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#1a1a1a',
                },
              }}
            />
          </Box>
        </Box>
      )}

      {/* Tab Panel 1: Payment Breakdown Donut Chart */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="body2" gutterBottom sx={{ mb: 3, textAlign: 'center', color: '#999999' }}>
            Monthly payment breakdown by category
          </Typography>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={paymentBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: $${Math.round(value).toLocaleString()}`}
                labelLine={true}
              >
                {paymentBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${Math.round(value).toLocaleString()}`}
                contentStyle={{
                  backgroundColor: '#333333',
                  border: '1px solid #555555',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#d4af37',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {paymentBreakdown.map((item, index) => (
              <Grid item xs={6} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: item.color,
                      borderRadius: '4px',
                    }}
                  />
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', color: '#999999' }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                      ${Math.round(item.value).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tab Panel 2: Amortization Line Chart */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="body2" gutterBottom sx={{ mb: 3, textAlign: 'center', color: '#999999' }}>
            Principal vs. Interest paid over {loanTerm} years
          </Typography>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={amortizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="year"
                label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fill: '#999999' } }}
                tick={{ fill: '#999999' }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fill: '#999999' }}
              />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: '#333333',
                  border: '1px solid #555555',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#d4af37',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px', color: '#ffffff' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="principal"
                stroke="#d4af37"
                strokeWidth={3}
                name="Principal Paid"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="interest"
                stroke="#c49d2f"
                strokeWidth={3}
                name="Interest Paid"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#b58b27"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Remaining Balance"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      <Box sx={{ mt: 3, p: 2, backgroundColor: '#141414', borderRadius: 1, border: '1px solid #2a2a2a' }}>
        <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#999999' }}>
          * This calculator provides estimates only. Actual payments may vary based on lender terms,
          credit score, and other factors.
        </Typography>
      </Box>
    </Card>
  );
}
