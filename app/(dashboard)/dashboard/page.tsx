'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/client';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setUser(userData);

      if (userData && !userData.onboarding_completed) {
        setOnboardingOpen(true);
      }

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .lte('published_at', new Date().toISOString())
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .eq('archived', false)
        .order('published_at', { ascending: false })
        .limit(3);
      setAnnouncements(announcementsData || []);

      // Fetch active transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('id, property_address, property_city, sale_price, status, closing_date, gci')
        .eq('agent_id', session.user.id)
        .in('status', ['pending', 'under_contract'])
        .order('updated_at', { ascending: false })
        .limit(5);
      setTransactions(transactionsData || []);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, priority, completed')
        .eq('agent_id', session.user.id)
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(5);
      setTasks(tasksData || []);

      // Fetch recent leads/contacts
      const { data: leadsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, source, created_at')
        .eq('agent_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      setLeads(leadsData || []);
    }

    loadData();
  }, [router, supabase]);

  const handleOnboardingComplete = async () => {
    setOnboardingOpen(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setUser(userData);
    }
  };

  // Compute stats
  const userPlan = user?.subscription_plan || 'launch';
  const planCaps: Record<string, number | null> = { launch: 21000, growth: 18000, pro: null };
  const capAmount = planCaps[userPlan] ?? user?.cap_amount ?? 21000;
  const currentProgress = user?.current_cap_progress || 0;
  const capPercentage = capAmount ? Math.min((currentProgress / capAmount) * 100, 100) : 0;

  // Pending commissions = sum of GCI from active transactions
  const pendingCommissions = transactions.reduce((sum, t) => sum + (t.gci || 0), 0);

  // Count transactions closing within 30 days
  const closingSoon = transactions.filter(t => {
    if (!t.closing_date) return false;
    const diff = new Date(t.closing_date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  });

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const getInitials = (first: string, last: string) => {
    return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
  };

  const avatarGradients = [
    'linear-gradient(135deg, #6366f1, #818cf8)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #E2C05A, #c4a43e)',
  ];

  // SVG ring calculation
  const circumference = 2 * Math.PI * 50; // r=50
  const dashOffset = circumference - (capPercentage / 100) * circumference;

  return (
    <Box sx={{ p: { xs: 2, md: '24px 28px' }, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Welcome Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(226,192,90,0.06), rgba(196,164,62,0.03))',
          border: '1px solid rgba(226, 192, 90, 0.2)',
          borderRadius: '12px',
          p: '24px 28px',
          mb: 3,
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: 250,
            height: 250,
            background: 'radial-gradient(circle, rgba(226,192,90,.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box>
          <Typography sx={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF', mb: 0.5 }}>
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </Typography>
          <Typography sx={{ fontSize: '13px', color: '#aaaaaa' }}>
            Here&apos;s your business at a glance.{tasks.length > 0 ? ` You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due.` : ''}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '12px', color: '#666666' }}>{todayStr}</Typography>
      </Box>

      {/* Stats Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: '14px', mb: 3 }}>
        {[
          { label: 'New Leads', value: leads.length, delta: 'This month', deltaType: 'up', iconBg: 'rgba(226,192,90,0.12)', iconColor: '#E2C05A' },
          { label: 'YTD GCI', value: `$${((user?.current_cap_progress || 0) / 1000).toFixed(1)}K`, delta: `${userPlan} plan`, deltaType: 'up', iconBg: 'rgba(0,230,138,0.12)', iconColor: '#00e68a' },
          { label: 'Active Transactions', value: transactions.length, delta: closingSoon.length > 0 ? `${closingSoon.length} closing soon` : 'None closing soon', deltaType: 'up', iconBg: 'rgba(255,176,32,0.12)', iconColor: '#ffb020' },
          { label: 'Tasks Due', value: tasks.length, delta: tasks.filter(t => t.priority === 'high').length > 0 ? `${tasks.filter(t => t.priority === 'high').length} high priority` : 'All on track', deltaType: tasks.filter(t => t.priority === 'high').length > 0 ? 'dn' : 'up', iconBg: 'rgba(255,77,106,0.12)', iconColor: '#ff4d6a' },
        ].map((stat, i) => (
          <Box
            key={i}
            sx={{
              background: '#111111',
              border: '1px solid rgba(226, 192, 90, 0.08)',
              borderRadius: '12px',
              p: 2.5,
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                borderColor: 'rgba(226, 192, 90, 0.2)',
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,.3)',
              },
            }}
          >
            <Box sx={{ width: 36, height: 36, borderRadius: '9px', background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
              <Box sx={{ width: 17, height: 17, borderRadius: '50%', backgroundColor: stat.iconColor, opacity: 0.6 }} />
            </Box>
            <Typography sx={{ fontSize: '12px', color: '#666666', mb: 0.5 }}>{stat.label}</Typography>
            <Typography sx={{ fontSize: '26px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-1px', color: '#FFFFFF' }}>
              {stat.value}
            </Typography>
            <Typography sx={{ fontSize: '11px', fontWeight: 600, mt: 0.5, color: stat.deltaType === 'up' ? '#00e68a' : '#ff4d6a' }}>
              {stat.delta}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Main Grid: 2fr 1fr */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2.5 }}>
        {/* Left Column */}
        <Box>
          {/* My Tasks Panel */}
          <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2.5, '&:hover': { borderColor: 'rgba(226,192,90,0.1)' } }}>
            <Box sx={{ p: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>My Tasks</Typography>
              <Box sx={{ fontSize: '11px', fontWeight: 700, px: 1.1, py: 0.25, borderRadius: '100px', background: 'rgba(226,192,90,0.12)', color: '#E2C05A' }}>
                {tasks.length > 0 ? `Today (${tasks.length})` : 'None'}
              </Box>
            </Box>
            <Box sx={{ p: '16px 20px' }}>
              {tasks.length === 0 ? (
                <Typography sx={{ fontSize: '13px', color: '#666666', textAlign: 'center', py: 2 }}>No tasks due. You&apos;re all caught up!</Typography>
              ) : (
                tasks.map((task) => (
                  <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.025)', transition: 'all 0.3s ease', '&:hover': { pl: 0.75 }, '&:last-child': { borderBottom: 'none' } }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: '5px', border: '2px solid #666666', flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#FFFFFF' }}>{task.title}</Typography>
                      <Typography sx={{ fontSize: '11px', color: '#666666', mt: 0.1 }}>
                        {task.description || 'Task'} · Due {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                      </Typography>
                    </Box>
                    <Box sx={{
                      px: 1.1, py: 0.25, borderRadius: '100px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px',
                      ...(task.priority === 'high'
                        ? { background: 'rgba(255,77,106,0.12)', color: '#ff4d6a' }
                        : task.priority === 'medium'
                          ? { background: 'rgba(255,176,32,0.12)', color: '#ffb020' }
                          : { background: 'rgba(0,230,138,0.12)', color: '#00e68a' })
                    }}>
                      {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Pending' : 'Low'}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>

          {/* Pipeline Snapshot Panel */}
          <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2.5, '&:hover': { borderColor: 'rgba(226,192,90,0.1)' } }}>
            <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Pipeline Snapshot</Typography>
            </Box>
            <Box sx={{ p: '16px 20px' }}>
              {[
                { label: 'Pending', count: transactions.filter(t => t.status === 'pending').length, color: 'linear-gradient(90deg, #c4a43e, #E2C05A)', pct: transactions.length > 0 ? (transactions.filter(t => t.status === 'pending').length / Math.max(transactions.length, 1)) * 100 : 0 },
                { label: 'Active', count: transactions.filter(t => t.status === 'under_contract').length, color: 'linear-gradient(90deg, #00b36b, #00e68a)', pct: transactions.length > 0 ? (transactions.filter(t => t.status === 'under_contract').length / Math.max(transactions.length, 1)) * 100 : 0 },
              ].map((pipe, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: i < 1 ? 1.5 : 0 }}>
                  <Typography sx={{ fontSize: '12px', color: '#aaaaaa', width: 70, textAlign: 'right' }}>{pipe.label}</Typography>
                  <Box sx={{ flex: 1, height: 26, background: '#1a1a1a', borderRadius: '5px', overflow: 'hidden' }}>
                    <Box sx={{
                      height: '100%',
                      borderRadius: '5px',
                      background: pipe.color,
                      width: `${Math.max(pipe.pct, pipe.count > 0 ? 15 : 0)}%`,
                      display: 'flex',
                      alignItems: 'center',
                      pl: 1.1,
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}>
                      {pipe.count}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Pending Commissions Panel */}
          <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2.5, '&:hover': { borderColor: 'rgba(226,192,90,0.1)' } }}>
            <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Pending Commissions</Typography>
            </Box>
            <Box sx={{ p: '16px 20px', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '34px', fontWeight: 900, color: '#00e68a', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-1px' }}>
                ${pendingCommissions.toLocaleString()}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#666666', mt: 0.4 }}>
                Based on {transactions.length} pending deal{transactions.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Column */}
        <Box>
          {/* New Leads Panel */}
          <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2.5, '&:hover': { borderColor: 'rgba(226,192,90,0.1)' } }}>
            <Box sx={{ p: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>New Leads</Typography>
              <Box sx={{ fontSize: '11px', fontWeight: 700, px: 1.1, py: 0.25, borderRadius: '100px', background: 'rgba(226,192,90,0.12)', color: '#E2C05A' }}>
                {leads.length}
              </Box>
            </Box>
            <Box sx={{ p: '16px 20px' }}>
              {leads.length === 0 ? (
                <Typography sx={{ fontSize: '13px', color: '#666666', textAlign: 'center', py: 2 }}>No new leads yet</Typography>
              ) : (
                leads.map((lead, i) => (
                  <Box key={lead.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.025)', transition: 'all 0.3s ease', '&:hover': { pl: 0.5 }, '&:last-child': { borderBottom: 'none' } }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '8px', background: avatarGradients[i % avatarGradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: '#FFFFFF', flexShrink: 0 }}>
                      {getInitials(lead.first_name, lead.last_name)}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{lead.first_name} {(lead.last_name || '')[0]}.</Typography>
                      <Typography sx={{ fontSize: '11px', color: '#666666' }}>{lead.source || 'Direct'}</Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>

          {/* Cap Progress Panel */}
          <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2.5, '&:hover': { borderColor: 'rgba(226,192,90,0.1)' } }}>
            <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Cap Progress</Typography>
            </Box>
            <Box sx={{ p: '16px 20px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                {/* SVG Ring */}
                <Box sx={{ width: 90, height: 90, position: 'relative', flexShrink: 0 }}>
                  <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#1a1a1a" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="50"
                      fill="none"
                      stroke="#E2C05A"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </svg>
                  <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '20px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#FFFFFF' }}>
                    {Math.round(capPercentage)}%
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', mb: 0.4 }}>
                    {capAmount ? `${Math.round(capPercentage)}% to Cap` : 'No Cap'} — ${(currentProgress / 1000).toFixed(1)}K
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#aaaaaa' }}>
                    {capAmount
                      ? `Contributed $${currentProgress.toLocaleString()} of $${capAmount.toLocaleString()}`
                      : 'Pro plan — no cap limit'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Quick Actions Panel */}
          <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2.5, '&:hover': { borderColor: 'rgba(226,192,90,0.1)' } }}>
            <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Quick Actions</Typography>
            </Box>
            <Box sx={{ p: '16px 20px' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {[
                  { label: 'Add New Lead', href: '/crm' },
                  { label: 'Submit Commission', href: '/dashboard/business' },
                  { label: 'Request Marketing', href: '/dashboard/marketing' },
                  { label: 'Ask Broker', href: '/dashboard/support' },
                ].map((action, i) => (
                  <Box
                    key={i}
                    component={Link}
                    href={action.href}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.1,
                      p: '12px 14px',
                      borderRadius: '8px',
                      background: '#1a1a1a',
                      border: '1px solid rgba(226, 192, 90, 0.08)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        borderColor: 'rgba(226, 192, 90, 0.2)',
                        background: '#181818',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      },
                    }}
                  >
                    <Box sx={{ width: 15, height: 15, borderRadius: '50%', background: 'rgba(226,192,90,0.2)', flexShrink: 0 }} />
                    {action.label}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Announcements Panel */}
          <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2.5, '&:hover': { borderColor: 'rgba(226,192,90,0.1)' } }}>
            <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Announcements</Typography>
            </Box>
            <Box sx={{ p: '16px 20px' }}>
              {announcements.length === 0 ? (
                <Typography sx={{ fontSize: '13px', color: '#666666', textAlign: 'center', py: 2 }}>No announcements</Typography>
              ) : (
                announcements.map((ann) => (
                  <Box key={ann.id} sx={{ display: 'flex', gap: 1.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.025)', transition: 'all 0.3s ease', '&:hover': { pl: 0.5 }, '&:last-child': { borderBottom: 'none' } }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '7px', background: 'rgba(226,192,90,0.12)', color: '#E2C05A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                      ★
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '13px', lineHeight: 1.45, color: '#FFFFFF' }}>
                        <strong>{ann.title}</strong>
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: '#666666', mt: 0.25 }}>
                        {new Date(ann.published_at || ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Onboarding Wizard */}
      <OnboardingWizard
        open={onboardingOpen}
        onClose={() => {}}
        onComplete={handleOnboardingComplete}
      />
    </Box>
  );
}
