'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import AgentInfoTab from '@/components/dashboard/business/AgentInfoTab';
import BillingSubscriptionTab from '@/components/profile/BillingSubscriptionTab';
import SecurityTab from '@/components/profile/SecurityTab';
import AgreementsTab from '@/components/profile/AgreementsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MyProfilePage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState(0);

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return data;
    },
  });


  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0D0D0D' }}>
      {/* Tabs - Sticky */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#0D0D0D',
        borderBottom: 1,
        borderColor: '#2A2A2A',
        flexShrink: 0,
      }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: '#B0B0B0',
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '1rem',
                minHeight: '48px',
                '&.Mui-selected': {
                  color: '#E2C05A',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#E2C05A',
              },
            }}
          >
            <Tab label="Agent Profile" />
            <Tab label="Billing/Subscription" />
            <Tab label="Security" />
            <Tab label="Agreements" />
          </Tabs>
        </Container>
      </Box>

      {/* Tab Panels - Scrollable */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <AgentInfoTab userProfile={userProfile} />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <BillingSubscriptionTab userProfile={userProfile} />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <SecurityTab />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <AgreementsTab />
          </TabPanel>
        </Container>
      </Box>
    </Box>
  );
}
