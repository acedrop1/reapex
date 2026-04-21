'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import ListingsTab from '@/components/dashboard/business/ListingsTab';
import PayoutsTab from '@/components/dashboard/business/PayoutsTab';
import TransactionsTab from '@/components/dashboard/business/TransactionsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  if (value !== index) return null;

  return (
    <div
      role="tabpanel"
      id={`business-tabpanel-${index}`}
      aria-labelledby={`business-tab-${index}`}
      {...other}
    >
      <Box sx={{ py: 3 }}>{children}</Box>
    </div>
  );
}

export default function MyBusinessPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const getInitialTab = () => {
    switch (tabParam) {
      case 'listings': return 1;
      case 'payouts': return 2;
      case 'transactions':
      default: return 0;
    }
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Update tab when params change
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [tabParam]);

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

            <Tab label="Transactions" />
            <Tab label="Listings" />
            <Tab label="Payouts" />
          </Tabs>
        </Container>
      </Box>

      {/* Tab Panels - Scrollable */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <TransactionsTab userProfile={userProfile} />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <ListingsTab />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <PayoutsTab />
          </TabPanel>
        </Container>
      </Box>
    </Box>
  );
}
