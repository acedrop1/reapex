import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Box } from '@mui/material';
import { SidebarProvider } from '@/components/providers/SidebarProvider';
import { isAdmin } from '@/lib/utils/auth';
import PageLoader from '@/components/layout/PageLoader';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerComponentClient();

  // Use getUser() instead of getSession() for server-side security
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    redirect('/login');
  }

  // Get user profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  // Block access if no user profile exists in the users table
  if (!user || userError) {
    // Sign out the unauthorized session
    await supabase.auth.signOut();
    redirect('/login');
  }

  // Check if user account is approved (admins bypass this check)
  if (user && !isAdmin(user.role)) {
    if (user.account_status !== 'approved') {
      redirect('/pending-approval');
    }
  }

  // Check if user must change their password (temporary password)
  if (user && (user as any).must_change_password === true) {
    redirect('/change-password');
  }

  return (
    <SidebarProvider>
      <PageLoader />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000000' }}>
        <Sidebar user={user} />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Header user={user} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              backgroundColor: '#000000',
              pt: '60px',
              minHeight: '100vh',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </SidebarProvider>
  );
}
