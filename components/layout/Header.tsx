'use client';

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Popover,
  List as MuiList,
  ListItem,
  ListItemText,
  Button,
  InputBase,
} from '@mui/material';
import {
  Bell,
  List,
  MagnifyingGlass,
  Gear,
  Sun,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/database';
import { useSidebar } from '@/components/providers/SidebarProvider';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const { drawerWidth, toggleMobile } = useSidebar();
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

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 192, 90, 0.08)',
        top: 0,
        left: { xs: 0, md: `${drawerWidth}px` },
        right: 0,
        width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
        zIndex: 1100,
        transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Toolbar sx={{ height: '60px', minHeight: '60px !important', px: { xs: 2, md: 3.5 } }}>
        {/* Left side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {/* Mobile Hamburger Menu */}
          <IconButton
            onClick={toggleMobile}
            sx={{
              display: { xs: 'flex', md: 'none' },
              width: 34,
              height: 34,
              borderRadius: '8px',
              backgroundColor: '#111111',
              border: '1px solid rgba(226, 192, 90, 0.08)',
              color: '#FFFFFF',
              '&:hover': {
                borderColor: 'rgba(226, 192, 90, 0.2)',
              },
            }}
            aria-label="open menu"
          >
            <List size={18} weight="bold" />
          </IconButton>

          {/* Search Bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: '#111111',
              border: '1px solid rgba(226, 192, 90, 0.08)',
              borderRadius: '8px',
              px: 1.75,
              py: 0.875,
              width: { xs: '100%', sm: 280 },
              maxWidth: 280,
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              '&:focus-within': {
                borderColor: '#E2C05A',
                boxShadow: '0 0 0 3px rgba(226, 192, 90, 0.08)',
              },
            }}
          >
            <MagnifyingGlass size={15} color="#666666" style={{ flexShrink: 0 }} />
            <InputBase
              placeholder="Search..."
              sx={{
                flex: 1,
                color: '#FFFFFF',
                fontSize: '13px',
                fontFamily: "'DM Sans', sans-serif",
                '& input::placeholder': {
                  color: '#666666',
                  opacity: 1,
                },
              }}
            />
          </Box>
        </Box>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {/* Theme Toggle (placeholder) */}
          <IconButton
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              backgroundColor: '#111111',
              border: '1px solid rgba(226, 192, 90, 0.08)',
              color: '#aaaaaa',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                borderColor: 'rgba(226, 192, 90, 0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(226, 192, 90, 0.08)',
              },
              '& svg': { width: 15, height: 15 },
            }}
          >
            <Sun size={15} />
          </IconButton>

          {/* Notifications Bell with Gold Dot */}
          <IconButton
            onClick={handleNotificationsOpen}
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              backgroundColor: '#111111',
              border: '1px solid rgba(226, 192, 90, 0.08)',
              color: '#aaaaaa',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                borderColor: 'rgba(226, 192, 90, 0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(226, 192, 90, 0.08)',
              },
            }}
            aria-label="notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#E2C05A',
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  border: '2px solid #000000',
                  animation: 'notifPulse 2s ease-in-out infinite',
                  '@keyframes notifPulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(226, 192, 90, 0.4)' },
                    '50%': { boxShadow: '0 0 0 6px rgba(226, 192, 90, 0)' },
                  },
                }}
              />
            )}
          </IconButton>

          {/* Settings Gear */}
          <IconButton
            onClick={() => router.push('/dashboard/profile')}
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              backgroundColor: '#111111',
              border: '1px solid rgba(226, 192, 90, 0.08)',
              color: '#aaaaaa',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                borderColor: 'rgba(226, 192, 90, 0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(226, 192, 90, 0.08)',
              },
            }}
          >
            <Gear size={15} />
          </IconButton>
        </Box>
      </Toolbar>

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
            backgroundColor: '#111111',
            border: '1px solid rgba(226, 192, 90, 0.08)',
            borderRadius: '12px',
            minWidth: 320,
            maxWidth: 400,
            mt: 1,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={() => markAllAsReadMutation.mutate()}
                sx={{ textTransform: 'none', color: '#E2C05A', fontSize: '12px' }}
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
                sx={{ '& .MuiListItemText-primary': { color: '#666666', fontSize: '13px' } }}
              />
            </ListItem>
          ) : (
            notifications.map((notification: any) => (
              <ListItem
                key={notification.id}
                sx={{
                  backgroundColor: notification.read ? 'transparent' : 'rgba(226, 192, 90, 0.06)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.025)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(226, 192, 90, 0.08)',
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
                      <Typography variant="body2" sx={{ color: '#aaaaaa', fontSize: '12px' }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666666', fontSize: '11px' }}>
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: '#FFFFFF',
                      fontWeight: notification.read ? 400 : 600,
                      fontSize: '13px',
                    }
                  }}
                />
              </ListItem>
            ))
          )}
        </MuiList>
      </Popover>
    </AppBar>
  );
}
