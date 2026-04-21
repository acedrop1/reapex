'use client';

import { AppBar, Toolbar, Typography, IconButton, Box, useMediaQuery, useTheme, Badge, Popover, List as MuiList, ListItem, ListItemText, Button } from '@mui/material';
import { Bell, UserList, List } from '@phosphor-icons/react';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/database';
import { useSidebar } from '@/components/providers/SidebarProvider';
import { formatDistanceToNow } from 'date-fns';
import { isAdmin } from '@/lib/utils/auth';

interface HeaderProps {
  user: User | null;
}

// Map pathname to page title
const getPageTitle = (pathname: string): string => {
  const pathMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/crm': 'Leads & Contacts',
    '/dashboard/transactions': 'Transactions',
    '/dashboard/forms': 'Forms & Compliance',
    '/dashboard/marketing': 'Marketing & Branding',
    '/dashboard/training': 'Training & Compliance',
    '/dashboard/business': 'My Business',
    '/dashboard/support': 'Support & Brokerage',
    '/admin/applications': 'Agent Applications',
    '/admin/brokerage-documents': 'Brokerage Documents',
    '/profile': 'My Profile',
  };

  // Check exact match first
  if (pathMap[pathname]) {
    return pathMap[pathname];
  }

  // Check if pathname starts with any of the mapped paths
  for (const [path, title] of Object.entries(pathMap)) {
    if (pathname.startsWith(path + '/')) {
      return title;
    }
  }

  return 'Dashboard';
};

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const { drawerWidth, toggleMobile } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const supabase = createClient();

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Fetch pending agent applications count (admin and admin_agent)
  const { data: pendingApplicationsCount = 0 } = useQuery({
    queryKey: ['pending-applications-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('agent_applications')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'reviewing']);

      if (error) throw error;
      return count || 0;
    },
    enabled: isAdmin(user?.role),
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const pageTitle = getPageTitle(pathname);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: '#0A0A0A',
        borderBottom: '1px solid #2A2A2A',
        top: 0,
        left: { xs: 0, md: `${drawerWidth}px` },
        right: 0,
        width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
        zIndex: 1100,
        transition: 'left 0.3s ease, width 0.3s ease',
      }}
    >
      <Toolbar>
        {/* Mobile Hamburger Menu */}
        <IconButton
          onClick={toggleMobile}
          sx={{
            mr: 2,
            color: '#FFFFFF',
            display: { xs: 'flex', md: 'none' },
            '&:hover': {
              backgroundColor: '#1A1A1A',
            },
          }}
          aria-label="open menu"
        >
          <List size={24} weight="bold" />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#FFFFFF', fontWeight: 600 }}>
          {pageTitle}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Notifications Bell Icon */}
          <IconButton
            size="large"
            onClick={handleNotificationsOpen}
            sx={{ ml: 0, color: '#B0B0B0', '&:hover': { color: '#FFFFFF', backgroundColor: '#1A1A1A' } }}
            aria-label="notifications"
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }
              }}
            >
              <Bell size={24} weight="duotone" />
            </Badge>
          </IconButton>

          {/* Notifications Popover */}
          <Popover
            open={Boolean(notificationsAnchorEl)}
            anchorEl={notificationsAnchorEl}
            onClose={handleNotificationsClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiPopover-paper': {
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                minWidth: 320,
                maxWidth: 400,
              }
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid #2A2A2A' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    onClick={() => markAllAsReadMutation.mutate()}
                    sx={{ textTransform: 'none', color: '#E2C05A' }}
                  >
                    Mark all as read
                  </Button>
                )}
              </Box>
            </Box>
            <MuiList sx={{ maxHeight: 400, overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No notifications"
                    sx={{ color: '#808080' }}
                  />
                </ListItem>
              ) : (
                notifications.map((notification) => (
                  <ListItem
                    key={notification.id}
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'rgba(226, 192, 90, 0.08)',
                      borderBottom: '1px solid #2A2A2A',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(226, 192, 90, 0.12)',
                      }
                    }}
                    onClick={() => {
                      if (!notification.read) {
                        markAsReadMutation.mutate(notification.id);
                      }
                      if (notification.link) {
                        router.push(notification.link);
                        handleNotificationsClose();
                      }
                    }}
                  >
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#808080' }}>
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: '#FFFFFF',
                          fontWeight: notification.read ? 400 : 600,
                        }
                      }}
                    />
                  </ListItem>
                ))
              )}
            </MuiList>
          </Popover>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

