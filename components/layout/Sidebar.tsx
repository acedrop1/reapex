'use client';

import { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Divider,
  Badge,
} from '@mui/material';
import { isAdmin } from '@/lib/utils/auth';
import {
  SquaresFour,
  Users,
  Receipt,
  FileText,
  Megaphone,
  GraduationCap,
  CurrencyDollar,
  Headset,
  CaretLeft,
  CaretRight,
  ClipboardText,
  House,
  UserList,
  UserGear,
  BellRinging,
  Folder,
  SignOut,
  Star,
  LinkSimple,
  UserCircle,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReapexLogo, ReapexIconLogo } from '@/components/ui/ReapexLogo';
import { useSidebar } from '@/components/providers/SidebarProvider';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const regularMenuItems: Array<{ text: string; icon: any; href: string; external?: boolean }> = [
  { text: 'Dashboard', icon: SquaresFour, href: '/dashboard' },
  { text: 'My Business', icon: CurrencyDollar, href: '/dashboard/business' },
  { text: 'CRM', icon: Users, href: '/crm' },
  { text: 'Agent Profile', icon: UserCircle, href: '/dashboard/profile' },
  { text: 'Resources', icon: LinkSimple, href: '/dashboard/external-links' },
  { text: 'Forms & Compliance', icon: FileText, href: '/dashboard/forms' },
  { text: 'Marketing', icon: Megaphone, href: '/dashboard/marketing' },
  { text: 'Training', icon: GraduationCap, href: '/dashboard/training' },
];

const adminMenuItems: Array<{ text: string; icon: any; href: string; adminOnlyStrict?: boolean }> = [
  { text: 'Applications', icon: ClipboardText, href: '/admin/applications' },
  { text: 'Master CRM', icon: Users, href: '/admin/crm' },
  { text: 'Manage Announcements', icon: BellRinging, href: '/admin/announcements' },
  { text: 'Manage Resources', icon: Folder, href: '/admin/manage-resources' },
  { text: 'All Listings', icon: House, href: '/admin/all-listings' },
  { text: 'All Transactions', icon: FileText, href: '/admin/transactions' },
  { text: 'Sell Requests', icon: House, href: '/admin/sell-requests' },
  { text: 'Pending Reviews', icon: Star, href: '/admin/reviews' },
  { text: 'Commission Payouts', icon: CurrencyDollar, href: '/admin/commission-payouts' },
  { text: 'User Management', icon: UserGear, href: '/admin/users', adminOnlyStrict: true },
];

export function Sidebar({ user }: { user: any }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen, drawerWidth } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Fetch pending applications count (non-archived only)
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-applications-count'],
    queryFn: async () => {
      if (!isAdmin(user?.role)) return 0;
      const { count} = await supabase
        .from('agent_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('archived', false);
      return count || 0;
    },
    enabled: isAdmin(user?.role),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch pending reviews count (unapproved reviews)
  const { data: pendingReviewsCount } = useQuery({
    queryKey: ['pending-reviews-count'],
    queryFn: async () => {
      if (!isAdmin(user?.role)) return 0;
      const { count } = await supabase
        .from('agent_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);
      return count || 0;
    },
    enabled: isAdmin(user?.role),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch unassigned sell requests count
  const { data: unassignedSellRequestsCount } = useQuery({
    queryKey: ['unassigned-sell-requests-count'],
    queryFn: async () => {
      if (!isAdmin(user?.role)) return 0;
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'sell_page')
        .is('agent_id', null);
      return count || 0;
    },
    enabled: isAdmin(user?.role),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'GET' });
    router.push('/login');
    router.refresh();
  };

  const renderMenuItem = (item: { text: string; icon: any; href: string; external?: boolean }) => {
    const Icon = item.icon;

    // Determine if item is active
    let isActive = false;

    // For Dashboard, only match exact path. For others, match path and children
    isActive = !item.external && (item.href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname === item.href || pathname.startsWith(item.href + '/'));

    // Check if this item should show a badge
    const showBadge = (item.text === 'Applications' && pendingCount && pendingCount > 0) ||
                      (item.text === 'Pending Reviews' && pendingReviewsCount && pendingReviewsCount > 0) ||
                      (item.text === 'Sell Requests' && unassignedSellRequestsCount && unassignedSellRequestsCount > 0);

    // Determine which count to show in the badge
    const badgeCount = item.text === 'Applications' ? pendingCount :
                       item.text === 'Pending Reviews' ? pendingReviewsCount :
                       item.text === 'Sell Requests' ? unassignedSellRequestsCount : 0;

    const listItemButton = (
      <ListItemButton
        component={item.external ? 'a' : Link}
        href={item.href}
        {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        selected={isActive}
        sx={{
          px: isCollapsed ? 0 : 1.5,
          py: 1,
          mx: isCollapsed ? 0 : 1,
          color: '#B0B0B0',
          borderRadius: '8px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          transition: 'all 200ms ease',
          '&.Mui-selected': {
            backgroundColor: 'rgba(226, 192, 90, 0.12)',
            color: '#E2C05A',
            borderLeft: '3px solid #E2C05A',
            borderRadius: '0 8px 8px 0',
            '&:hover': {
              backgroundColor: 'rgba(226, 192, 90, 0.18)',
            },
            '& .MuiListItemIcon-root': {
              color: '#E2C05A',
            },
            '& .MuiListItemText-primary': {
              color: '#E2C05A',
              fontWeight: 600,
            },
          },
          '&:hover': {
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            '& .MuiListItemIcon-root': {
              color: '#FFFFFF',
            },
            '& .MuiListItemText-primary': {
              color: '#FFFFFF',
            },
          },
          '& .MuiListItemIcon-root': {
            color: '#B0B0B0',
            minWidth: isCollapsed ? 'auto' : 36,
            justifyContent: 'center',
          },
          '& .MuiListItemText-primary': {
            color: '#B0B0B0',
            fontWeight: 500,
            fontSize: '13px',
            whiteSpace: 'nowrap',
          },
        }}
      >
        <ListItemIcon>
          {showBadge ? (
            <Badge
              badgeContent={badgeCount}
              color="error"
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  height: '16px',
                  minWidth: '16px',
                  padding: '0 4px',
                }
              }}
            >
              <Icon size={24} weight="duotone" />
            </Badge>
          ) : (
            <Icon size={24} weight="duotone" />
          )}
        </ListItemIcon>
        {!isCollapsed && <ListItemText primary={item.text} />}
      </ListItemButton>
    );

    return (
      <ListItem key={item.text} disablePadding>
        {isCollapsed ? (
          <Tooltip title={item.text} placement="right" arrow>
            {listItemButton}
          </Tooltip>
        ) : (
          listItemButton
        )}
      </ListItem>
    );
  };

  const showAdminSection = user && isAdmin(user.role);

  const drawer = (
    <Box sx={{ backgroundColor: '#0F0F0F', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Expand button when collapsed - centered on sidebar edge */}
      {isCollapsed && !isMobile && (
        <IconButton
          onClick={handleToggleCollapse}
          size="small"
          sx={{
            position: 'absolute',
            right: -16,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#0F0F0F',
            border: '1px solid #2A2A2A',
            color: '#B0B0B0',
            zIndex: 1500,
            '&:hover': {
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
            },
          }}
        >
          <CaretRight size={16} weight="bold" />
        </IconButton>
      )}

      <Toolbar sx={{
        borderBottom: '1px solid #2A2A2A',
        minHeight: '64px !important',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        px: isCollapsed ? 0 : 2,
        position: 'relative',
      }}>
        {isCollapsed ? (
          <Link href="/" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <ReapexIconLogo size={32} invert={true} />
          </Link>
        ) : (
          <>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <ReapexLogo width={120} height={40} variant="light" />
            </Link>
            {!isMobile && (
              <IconButton
                onClick={handleToggleCollapse}
                size="small"
                sx={{
                  position: 'absolute',
                  right: 8,
                  color: '#B0B0B0',
                  '&:hover': {
                    color: '#FFFFFF',
                    backgroundColor: '#1A1A1A',
                  },
                }}
              >
                <CaretLeft size={20} weight="bold" />
              </IconButton>
            )}
          </>
        )}
      </Toolbar>

      <List sx={{ pt: 1, px: 0, flexGrow: 1, overflow: 'auto' }}>
        {/* Regular Menu Items */}
        {regularMenuItems.map(renderMenuItem)}

        {/* Admin Settings Section */}
        {showAdminSection && (
          <>
            <Divider sx={{ my: 2, mx: 1, borderColor: '#2A2A2A', position: 'relative' }}>
              {!isCollapsed && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#0F0F0F',
                    px: 1.5,
                    color: '#808080',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  Admin Settings
                </Typography>
              )}
            </Divider>

            {adminMenuItems
              .filter(item => {
                // Admin-only strict items (only for admins, not brokers)
                if (item.adminOnlyStrict) {
                  return isAdmin(user.role);
                }
                return true;
              })
              .map(renderMenuItem)}
          </>
        )}
      </List>

      {/* Logout Section at Bottom */}
      <Box
        sx={{
          borderTop: '1px solid #2A2A2A',
          p: isCollapsed ? 1 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: 1,
        }}
      >
        {!isCollapsed && user?.full_name && (
          <Typography
            variant="body2"
            sx={{
              color: '#B0B0B0',
              fontWeight: 500,
              fontSize: '13px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.full_name}
          </Typography>
        )}
        <Tooltip title="Logout" placement="top" arrow>
          <IconButton
            onClick={handleLogout}
            sx={{
              color: '#B0B0B0',
              '&:hover': {
                color: '#FFFFFF',
                backgroundColor: '#1A1A1A',
              },
            }}
            aria-label="logout"
          >
            <SignOut size={20} weight="duotone" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #2A2A2A',
              backgroundColor: '#0F0F0F',
              overflow: 'visible',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
}

