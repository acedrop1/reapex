'use client';

import { Box, Typography } from '@mui/material';
import { User, CurrencyDollar, TrendUp } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const treeNodes = [
  { level: 0, label: 'You', agents: 1, monthlyIncome: 0, position: 'center' },
  { level: 1, label: 'Agent 1', agents: 1, monthlyIncome: 67, position: 'left' },
  { level: 1, label: 'Agent 2', agents: 1, monthlyIncome: 67, position: 'right' },
  { level: 2, label: 'Agent 3', agents: 1, monthlyIncome: 67, position: 'left' },
  { level: 2, label: 'Agent 4', agents: 1, monthlyIncome: 67, position: 'center' },
  { level: 2, label: 'Agent 5', agents: 1, monthlyIncome: 67, position: 'right' },
];

export default function RevenueShareTree() {
  const totalMonthlyIncome = treeNodes.slice(1).reduce((sum, node) => sum + node.monthlyIncome, 0);
  const totalAnnualIncome = totalMonthlyIncome * 12;

  return (
    <Box
      sx={{
        position: 'relative',
        py: 4,
      }}
    >
      {/* Tree Structure */}
      <Box
        sx={{
          position: 'relative',
          minHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {/* Level 0 - You */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: '#d4af37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4)',
                border: '3px solid #d4af37',
              }}
            >
              <User size={40} weight="bold" color="#0a0a0a" />
            </Box>
            <Typography
              variant="body2"
              sx={{
                mt: 1.5,
                color: '#d4af37',
                fontWeight: 700,
              }}
            >
              You
            </Typography>
          </Box>
        </motion.div>

        {/* Connecting Lines SVG */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {/* Level 1 connections */}
          <line x1="50%" y1="80" x2="30%" y2="200" stroke="#333333" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="50%" y1="80" x2="70%" y2="200" stroke="#333333" strokeWidth="2" strokeDasharray="4 4" />

          {/* Level 2 connections */}
          <line x1="30%" y1="280" x2="20%" y2="400" stroke="#333333" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="30%" y1="280" x2="50%" y2="400" stroke="#333333" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="70%" y1="280" x2="80%" y2="400" stroke="#333333" strokeWidth="2" strokeDasharray="4 4" />
        </svg>

        {/* Level 1 */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 8, md: 20 },
            width: '100%',
            mt: 4,
          }}
        >
          {treeNodes.slice(1, 3).map((node, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + idx * 0.1 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #16a34a',
                    boxShadow: '0 4px 16px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <User size={28} weight="duotone" color="#16a34a" />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    color: '#999999',
                      }}
                >
                  {node.label}
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    px: 2,
                    py: 0.5,
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    borderRadius: 1,
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#16a34a',
                      fontWeight: 600,
                          }}
                  >
                    +${node.monthlyIncome}/mo
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Box>

        {/* Level 2 */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 4, md: 8 },
            width: '100%',
            mt: 4,
          }}
        >
          {treeNodes.slice(3).map((node, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    backgroundColor: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #16a34a',
                    boxShadow: '0 4px 16px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <User size={24} weight="duotone" color="#16a34a" />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    color: '#999999',
                    fontSize: '0.7rem',
                      }}
                >
                  {node.label}
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    px: 1.5,
                    py: 0.5,
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    borderRadius: 1,
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#16a34a',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                          }}
                  >
                    +${node.monthlyIncome}/mo
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mt: 8,
        }}
      >
        {/* Monthly Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Box
            sx={{
              p: 4,
              backgroundColor: '#141414',
              borderRadius: 2,
              border: '1px solid #333333',
              textAlign: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2 }}>
              <CurrencyDollar size={28} weight="duotone" color="#16a34a" />
              <Typography
                variant="body2"
                sx={{
                  color: '#999999',
                  }}
              >
                Monthly Passive Income
              </Typography>
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#16a34a',
              }}
            >
              ${totalMonthlyIncome.toLocaleString()}
            </Typography>
          </Box>
        </motion.div>

        {/* Annual Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Box
            sx={{
              p: 4,
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              borderRadius: 2,
              border: '1px solid #d4af37',
              textAlign: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2 }}>
              <TrendUp size={28} weight="duotone" color="#d4af37" />
              <Typography
                variant="body2"
                sx={{
                  color: '#d4af37',
                  }}
              >
                Annual Passive Income
              </Typography>
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#d4af37',
              }}
            >
              ${totalAnnualIncome.toLocaleString()}
            </Typography>
          </Box>
        </motion.div>
      </Box>

      {/* Explanation */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          backgroundColor: '#0a0a0a',
          borderRadius: 2,
          border: '1px solid #333333',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#cccccc',
            fontFamily: 'DM Sans, sans-serif',
            lineHeight: 1.8,
            textAlign: 'center',
          }}
        >
          For every agent you bring to Reapex, you earn 5% of the brokerage's revenue from their cap ($16,000).
          <br />
          That's <strong style={{ color: '#16a34a' }}>$67/month per agent</strong>, creating genuine passive income as your network grows.
        </Typography>
      </Box>
    </Box>
  );
}
