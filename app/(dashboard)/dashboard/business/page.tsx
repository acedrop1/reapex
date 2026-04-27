'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Box, Typography } from '@mui/material';
import Link from 'next/link';

export default function BusinessPage() {
  const supabase = createClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      return data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['my-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', user.id)
        .order('updated_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });


  // Compute financials
  const userPlan = user?.subscription_plan || 'launch';
  const planCaps: Record<string, number | null> = { launch: 21000, growth: 18000, pro: null };
  const capAmount = planCaps[userPlan] ?? user?.cap_amount ?? 21000;
  const currentProgress = user?.current_cap_progress || 0;
  const capPercentage = capAmount ? Math.min((currentProgress / capAmount) * 100, 100) : 0;

  const closedTransactions = transactions.filter((t: any) => t.status === 'closed');
  const pendingTransactions = transactions.filter((t: any) => t.status === 'pending' || t.status === 'under_contract');
  const pendingGCI = pendingTransactions.reduce((sum: number, t: any) => sum + (t.gci || 0), 0);
  const ytdGCI = closedTransactions.reduce((sum: number, t: any) => sum + (t.gci || 0), 0) + currentProgress;

  const circumference = 2 * Math.PI * 50;
  const dashOffset = circumference - (capPercentage / 100) * circumference;

  return (
    <Box sx={{ p: { xs: 2, md: '24px 28px' }, fontFamily: "'DM Sans', sans-serif" }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>My Business</Typography>
      </Box>

      {/* Top Row: Commission Dashboard + Pending Payouts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
        {/* Commission Dashboard */}
        <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', p: 2.5 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', mb: 2 }}>Commission Dashboard</Typography>
          <Typography sx={{ fontSize: '12px', color: '#666666', mb: 0.5 }}>YTD Gross Commission Income</Typography>
          <Typography sx={{ fontSize: '28px', fontWeight: 900, color: '#00e68a', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-1px', mb: 2 }}>
            ${ytdGCI.toLocaleString()}
          </Typography>

          {/* Cap Ring */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 2 }}>
            <Box sx={{ width: 90, height: 90, position: 'relative', flexShrink: 0 }}>
              <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1a1a1a" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#E2C05A" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '20px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#FFFFFF' }}>
                {Math.round(capPercentage)}
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', mb: 0.4 }}>Progress to Cap — {Math.round(capPercentage)}%</Typography>
              <Typography sx={{ fontSize: '12px', color: '#aaaaaa' }}>
                {capAmount ? `$${currentProgress.toLocaleString()} of $${capAmount.toLocaleString()} cap` : 'Pro plan — no cap'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Pending Payouts */}
        <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', p: 2.5 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', mb: 2 }}>Pending Payouts</Typography>
          <Typography sx={{ fontSize: '12px', color: '#666666', mb: 0.5 }}>Amount Pending</Typography>
          <Typography sx={{ fontSize: '28px', fontWeight: 900, color: '#ffb020', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-1px', mb: 2 }}>
            ${pendingGCI.toLocaleString()}
          </Typography>

          {/* List pending transactions */}
          {pendingTransactions.slice(0, 3).map((t: any) => (
            <Box key={t.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25, borderTop: '1px solid rgba(226, 192, 90, 0.08)', fontSize: '13px' }}>
              <Typography sx={{ color: '#aaaaaa', fontSize: '13px' }}>
                {t.property_address} {t.closing_date ? `— ${new Date(t.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
              </Typography>
              <Typography sx={{ fontWeight: 700, color: '#E2C05A', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                ${(t.gci || 0).toLocaleString()}
              </Typography>
            </Box>
          ))}
          {pendingTransactions.length === 0 && (
            <Typography sx={{ fontSize: '13px', color: '#666666', mt: 1 }}>No pending payouts</Typography>
          )}
        </Box>
      </Box>

      {/* Bottom Row: Statements + My Bill */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', p: 2.5 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', mb: 0.75 }}>Commission Statements</Typography>
          <Typography sx={{ fontSize: '12px', color: '#666666', mb: 1.75 }}>Searchable history of all past payout statements.</Typography>
          <Box component="a" href="#" onClick={(e: React.MouseEvent) => e.preventDefault()} sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
            px: 2.25, py: 1, borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: 'transparent', border: '1px solid rgba(226, 192, 90, 0.2)', color: '#E2C05A',
            textDecoration: 'none', '&:hover': { background: 'rgba(226,192,90,0.06)' },
          }}>
            View All Statements
          </Box>
        </Box>

        <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', p: 2.5 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', mb: 1.5 }}>My Reapex Bill</Typography>
          <Typography sx={{ fontSize: '12px', color: '#666666', mb: 0.5 }}>Outstanding Balance</Typography>
          <Typography sx={{ fontSize: '20px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#FFFFFF' }}>$0.00</Typography>
          <Typography sx={{ fontSize: '11px', color: '#00e68a', mt: 0.5 }}>All payments current</Typography>
        </Box>
      </Box>

      {/* Submit Commission CTA */}
      <Box component={Link} href="/transactions/new" sx={{
        display: 'inline-flex', px: 3, py: 1.25, borderRadius: '8px',
        fontSize: '13px', fontWeight: 600, background: '#E2C05A', color: '#000000',
        textDecoration: 'none', '&:hover': { background: '#c4a43e' },
      }}>
        Submit Commission (CDF)
      </Box>
    </Box>
  );
}
