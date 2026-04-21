'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress, 
  Checkbox,
  Button,
} from '@mui/material';
import { Assignment, PersonAdd, TrendingUp, AccountBalance, Announcement } from '@mui/icons-material';
import Link from 'next/link';

// Dark theme card styling
const cardStyle = {
  borderRadius: '12px',
  border: '1px solid #2A2A2A',
  backgroundColor: '#121212',
  boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.6)',
  transition: 'all 200ms ease',
  '&:hover': {
    borderColor: '#333333',
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.7)',
  },
};

export function TasksWidget() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('agent_id', user.id)
        .eq('completed', false)
        .gte('due_date', today.toISOString())
        .lt('due_date', tomorrow.toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

      return data || [];
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
    },
  });

  const handleComplete = (taskId: string) => {
    completeTaskMutation.mutate(taskId);
  };

  return (
    <Card sx={cardStyle}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assignment sx={{ mr: 1, color: '#FFFFFF' }} />
            <Typography variant="h6" sx={{ color: '#FFFFFF' }}>My Tasks</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
            TODAY ({tasks?.length || 0})
          </Typography>
        </Box>
        {isLoading ? (
          <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
        ) : tasks && tasks.length > 0 ? (
          <List dense sx={{ p: 0 }}>
            {tasks.map((task: any) => (
              <ListItem
                key={task.id}
                sx={{
                  px: 0,
                  py: 1.5,
                  borderBottom: '1px solid #2A2A2A',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Checkbox
                  checked={task.completed}
                  onChange={() => handleComplete(task.id)}
                  size="small"
                  sx={{ mr: 1.5 }}
                />
                <ListItemText
                  primary={task.title}
                  primaryTypographyProps={{
                    sx: {
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                    }
                  }}
                />
                {!task.completed && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleComplete(task.id)}
                    sx={{ ml: 'auto', minWidth: '80px', fontSize: '0.75rem' }}
                  >
                    Complete
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
            No tasks for today
          </Typography>
        )}
        <Box sx={{ mt: 2 }}>
          <Link href="/crm" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" sx={{ color: '#FFFFFF', cursor: 'pointer' }}>
              View all tasks →
            </Typography>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
}

export function LeadsWidget() {
  const supabase = createClient();
  
  const { data: leads, isLoading } = useQuery({
    queryKey: ['dashboard-leads'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('agent_id', user.id)
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(3);

      return data || [];
    },
  });

  return (
    <Card sx={cardStyle}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonAdd sx={{ mr: 1, color: '#FFFFFF' }} />
            <Typography variant="h6" sx={{ color: '#FFFFFF' }}>New Leads</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
            ({leads?.length || 0})
          </Typography>
        </Box>
        {isLoading ? (
          <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
        ) : leads && leads.length > 0 ? (
          <List dense sx={{ p: 0 }}>
            {leads.map((lead: any) => (
              <ListItem 
                key={lead.id}
                sx={{ px: 0, py: 1 }}
              >
                <ListItemText
                  primary={`${lead.first_name} ${lead.last_name}`}
                  secondary={lead.source || 'No source'}
                  primaryTypographyProps={{
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                  }}
                  secondaryTypographyProps={{
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                  }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
            No new leads
          </Typography>
        )}
        <Box sx={{ mt: 2 }}>
          <Link href="/crm" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" sx={{ color: '#FFFFFF', cursor: 'pointer' }}>
              View all leads →
            </Typography>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
}

export function PipelineWidget() {
  const supabase = createClient();
  
  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['dashboard-pipeline'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { stages: [] };

      const { data } = await supabase
        .from('deals')
        .select('stage, value')
        .eq('agent_id', user.id)
        .in('stage', ['lead', 'qualified', 'proposal', 'negotiation', 'closed']);

      // Group by stage - matching the design
      const stages = [
        { name: 'New', count: 0 },
        { name: 'Active', count: 0 },
        { name: 'Proposal', count: 0 },
        { name: 'Negotiation', count: 0 },
      ];

      data?.forEach((deal: any) => {
        if (deal.stage === 'lead') stages[0].count++;
        else if (deal.stage === 'qualified' || deal.stage === 'proposal') stages[1].count++;
        else if (deal.stage === 'proposal') stages[2].count++;
        else if (deal.stage === 'negotiation') stages[3].count++;
      });

      return { stages };
    },
  });

  const maxCount = Math.max(...(pipeline?.stages?.map((s: any) => s.count) || [0]), 1);

  return (
    <Card sx={cardStyle}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TrendingUp sx={{ mr: 1, color: '#FFFFFF' }} />
          <Typography variant="h6" sx={{ color: '#FFFFFF' }}>Pipeline Snapshot</Typography>
        </Box>
        {isLoading ? (
          <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
        ) : pipeline && pipeline.stages && pipeline.stages.length > 0 ? (
          <Box>
            {pipeline.stages.map((stage: any, index: number) => (
              <Box key={stage.name} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#FFFFFF' }}>{stage.name}</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#FFFFFF' }}>
                    {stage.count}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 24,
                    backgroundColor: '#2A2A2A',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #2A2A2A',
                  }}
                >
                  <Box
                    sx={{
                      width: `${(stage.count / maxCount) * 100}%`,
                      height: '100%',
                      backgroundColor: '#E2C05A',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
            No pipeline data available
          </Typography>
        )}
        <Box sx={{ mt: 2 }}>
          <Link href="/crm" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" sx={{ color: '#FFFFFF', cursor: 'pointer' }}>
              View pipeline →
            </Typography>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
}

export function PendingCommissionsWidget() {
  const supabase = createClient();
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['pending-commissions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('transactions')
        .select('agent_commission')
        .eq('agent_id', user.id)
        .in('status', ['pending', 'under_contract']);

      return data || [];
    },
  });

  const totalPending = transactions?.reduce((sum, t) => sum + (t.agent_commission || 0), 0) || 0;
  const dealCount = transactions?.length || 0;

  return (
    <Card sx={cardStyle}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AccountBalance sx={{ mr: 1, color: '#FFFFFF' }} />
          <Typography variant="h6">Pending Commissions</Typography>
        </Box>
        {isLoading ? (
          <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
        ) : (
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#FFFFFF' }}>
              ${totalPending.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
              Based on {dealCount} pending {dealCount === 1 ? 'deal' : 'deals'}
            </Typography>
          </Box>
        )}
        <Box sx={{ mt: 2 }}>
          <Link href="/transactions" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" sx={{ color: '#FFFFFF', cursor: 'pointer' }}>
              View transactions →
            </Typography>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
}

export function CapProgressWidget() {
  const supabase = createClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-cap-progress'],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data } = await supabase
        .from('users')
        .select('cap_amount, current_cap_progress')
        .eq('id', authUser.id)
        .single();

      return data;
    },
  });

  const capAmount = user?.cap_amount || 0;
  const currentProgress = user?.current_cap_progress || 0;
  const progress = capAmount > 0 ? (currentProgress / capAmount) * 100 : 0;
  const remaining = capAmount - currentProgress;

  return (
    <Card sx={cardStyle}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccountBalance sx={{ mr: 1, color: '#FFFFFF' }} />
          <Typography variant="h6" sx={{ color: '#FFFFFF' }}>Cap Progress</Typography>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
          </Box>
        ) : (
          <Box>
            {/* Large Ring Chart */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative', width: 180, height: 180 }}>
                {/* Background ring */}
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={180}
                  thickness={4}
                  sx={{
                    color: '#e0e0e0',
                    position: 'absolute',
                  }}
                />
                {/* Progress ring */}
                <CircularProgress
                  variant="determinate"
                  value={Math.min(progress, 100)}
                  size={180}
                  thickness={4}
                  sx={{
                    color: '#FFFFFF',
                    position: 'absolute',
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    },
                  }}
                />
                {/* Center content */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h3" fontWeight="700" sx={{ color: '#FFFFFF', mb: 0.5 }}>
                    {Math.round(progress)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666666' }}>
                    to cap
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Stats below ring */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="600" sx={{ color: '#FFFFFF', mb: 1 }}>
                ${remaining.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666666', mb: 0.5 }}>
                remaining to cap
              </Typography>
              <Typography variant="caption" sx={{ color: '#666666' }}>
                ${currentProgress.toLocaleString()} of ${capAmount.toLocaleString()} contributed
              </Typography>
            </Box>
          </Box>
        )}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Link href="/profile" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" sx={{ color: '#FFFFFF', cursor: 'pointer', textAlign: 'center' }}>
              View financials →
            </Typography>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
}

export function BrokerageAnnouncementsWidget() {
  const supabase = createClient();
  
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['recent-announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(3);

      return data || [];
    },
  });

  return (
    <Card sx={cardStyle}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Announcement sx={{ mr: 1, color: '#FFFFFF' }} />
          <Typography variant="h6">Brokerage Announcements</Typography>
        </Box>
        {isLoading ? (
          <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
        ) : announcements && announcements.length > 0 ? (
          <List dense sx={{ p: 0 }}>
            {announcements.map((announcement: any) => (
              <ListItem key={announcement.id} sx={{ px: 0, py: 1 }}>
                <ListItemText
                  primary={announcement.title}
                  primaryTypographyProps={{
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                  }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
            No announcements
          </Typography>
        )}
        <Box sx={{ mt: 2 }}>
          <Link href="/admin/announcements" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" sx={{ color: '#FFFFFF', cursor: 'pointer' }}>
              View all →
            </Typography>
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
}
