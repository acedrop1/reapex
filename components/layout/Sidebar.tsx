'use client';

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
  Badge,
} from '@mui/material';
import { isAdmin } from '@/lib/utils/auth';
import {
  SquaresFour,
  Users,
  FileText,
  CurrencyDollar,
  CaretLeft,
  CaretRight,
  ClipboardText,
  House,
  UserGear,
  BellRinging,
  Folder,
  Star,
  SignOut,
  CheckSquare,
  BookOpen,
  Question,
  QrCode,
  Link as LinkIcon,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReapexLogo, ReapexIconLogo } from '@/components/ui/ReapexLogo';
import { useSidebar } from '@/components/providers/SidebarProvider';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface NavSection {
  label: string;
  items: Array<{ text: string; icon: any; href: string; external?: boolean; badge?: boolean }>;
}

const agentNavSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { text: 'Dashboard', icon: SquaresFour, href: '/dashboard' },
      { text: 'Leads & Contacts', icon: Users, href: '/crm' },
      { text: 'Transactions', icon: FileText, href: '/transactions' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { text: 'Forms & Compliance', icon: CheckSquare, href: '/dashboard/forms' },
      { text: 'Marketing & Branding', icon: Star, href: '/dashboard/marketing' },
      { text: 'Training & Knowledge', icon: BookOpen, href: '/dashboard/training' },
      { text: 'External Links', icon: LinkIcon, href: '/dashboard/external-links' },
    ],
  },
  {
    label: 'Business',
    items: [
      { text: 'My Business', icon: CurrencyDollar, href: '/dashboard/business' },
      { text: 'Support & Brokerage', icon: Question, href: '/dashboard/support' },
    ],
  },
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
  { text: 'Yard Signs', icon: QrCode, href: '/admin/yard-signs' },
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
      const { count } = await supabase
        .from('agent_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('archived', false);
      return count || 0;
    },
    enabled: isAdmin(user?.role),
    refetchInterval: 30000,
  });

  // Fetch pending reviews count
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
    refetchInterval: 30000,
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
    refetchInterval: 30000,
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

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPlanLabel = (plan: string | null) => {
    switch (plan) {
      case 'pro': return 'Pro Plan';
      case 'growth': return 'Growth Plan';
      case 'launch': return 'Launch Plan';
      default: return 'Agent';
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const getBadgeCount = (text: string) => {
    if (text === 'Applications') return pendingCount || 0;
    if (text === 'Pending Reviews') return pendingReviewsCount || 0;
    if (text === 'Sell Requests') return unassignedSellRequestsCount || 0;
    return 0;
  };

  const showAdminSection = user && isAdmin(user.role);

  const renderNavItem = (item: { text: string; icon: any; href: string; external?: boolean }) => {
    const Icon = item.icon;
    const active = !item.external && isActive(item.href);
    const badgeCount = getBadgeCount(item.text);

    const listItemButton = (
      <ListItemButton
        component={item.external ? 'a' : Link}
        href={item.href}
        {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        selected={active}
        sx={{
          px: isCollapsed ? 0 : 1.5,
          py: 1,
          mx: isCollapsed ? 0 : 1,
          color: 'var(--text-2, #aaaaaa)',
          borderRadius: '8px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid transparent',
          mb: '1px',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 0,
            background: '#E2C05A',
            borderRadius: '0 4px 4px 0',
            transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(226, 192, 90, 0.12)',
            color: '#E2C05A',
            borderColor: 'rgba(226, 192, 90, 0.1)',
            '&::before': {
              width: '3px',
            },
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
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            color: '#FFFFFF',
            transform: 'translateX(3px)',
            '& .MuiListItemIcon-root': {
              color: '#FFFFFF',
            },
            '& .MuiListItemText-primary': {
              color: '#FFFFFF',
            },
          },
          '& .MuiListItemIcon-root': {
            color: 'var(--text-2, #aaaaaa)',
            minWidth: isCollapsed ? 'auto' : 36,
            justifyContent: 'center',
          },
          '& .MuiListItemText-primary': {
            color: 'var(--text-2, #aaaaaa)',
            fontWeight: 500,
            fontSize: '13.5px',
            whiteSpace: 'nowrap',
          },
        }}
      >
        <ListItemIcon>
          {badgeCount > 0 ? (
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
              <Icon size={17} weight="regular" />
            </Badge>
          ) : (
            <Icon size={17} weight="regular" />
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

  const drawer = (
    <Box sx={{
      backgroundColor: '#080808',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '20%',
        right: '-60px',
        width: '120px',
        height: '300px',
        background: 'radial-gradient(ellipse, rgba(226,192,90,.04) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      },
    }}>
      {/* Expand button when collapsed */}
      {isCollapsed && !isMobile && (
        <IconButton
          onClick={handleToggleCollapse}
          size="small"
          sx={{
            position: 'absolute',
            right: -16,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#080808',
            border: '1px solid rgba(226, 192, 90, 0.08)',
            color: '#aaaaaa',
            zIndex: 1500,
            '&:hover': {
              backgroundColor: '#111111',
              color: '#FFFFFF',
            },
          }}
        >
          <CaretRight size={16} weight="bold" />
        </IconButton>
      )}

      <Toolbar sx={{
        borderBottom: '1px solid rgba(226, 192, 90, 0.08)',
        minHeight: '60px !important',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        px: isCollapsed ? 0 : 2.5,
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
                  color: '#aaaaaa',
                  '&:hover': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                  },
                }}
              >
                <CaretLeft size={20} weight="bold" />
              </IconButton>
            )}
          </>
        )}
      </Toolbar>

      <Box sx={{ pt: 1.5, px: 1, flexGrow: 1, overflow: 'auto' }}>
        {/* Agent Navigation Sections */}
        {agentNavSections.map((section) => (
          <Box key={section.label}>
            {!isCollapsed && (
              <Typography
                sx={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#666666',
                  px: 1.5,
                  pt: 1.75,
                  pb: 0.75,
                }}
              >
                {section.label}
              </Typography>
            )}
            {isCollapsed && section.label !== 'Main' && (
              <Box sx={{ mx: 1, my: 1, borderTop: '1px solid rgba(226, 192, 90, 0.08)' }} />
            )}
            <List sx={{ p: 0 }}>
              {section.items.map(renderNavItem)}
            </List>
          </Box>
        ))}

        {/* Admin Settings Section */}
        {showAdminSection && (
          <Box>
            {!isCollapsed ? (
              <Typography
                sx={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: '#666666',
                  px: 1.5,
                  pt: 2,
                  pb: 0.75,
                }}
              >
                Admin
              </Typography>
            ) : (
              <Box sx={{ mx: 1, my: 1, borderTop: '1px solid rgba(226, 192, 90, 0.08)' }} />
            )}
            <List sx={{ p: 0 }}>
              {adminMenuItems
                .filter(item => {
                  if (item.adminOnlyStrict) {
                    return isAdmin(user.role);
                  }
                  return true;
                })
                .map(renderNavItem)}
            </List>
          </Box>
        )}
      </Box>

      {/* User Profile Footer */}
      <Box
        sx={{
          borderTop: '1px solid rgba(226, 192, 90, 0.08)',
          p: isCollapsed ? 1 : 1.75,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.3,
            p: isCollapsed ? 0.5 : '9px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              transform: 'translateX(2px)',
              '& .user-avatar': {
                transform: 'scale(1.08)',
              },
            },
          }}
        >
          {/* Avatar */}
          <Box
            className="user-avatar"
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #E2C05A, #c4a43e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
              color: '#FFFFFF',
              flexShrink: 0,
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
            }}
          >
            {user?.headshot_url ? (
              <Box
                component="img"
                src={user.headshot_url}
                alt={user.full_name || ''}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              getInitials(user?.full_name)
            )}
          </Box>
          {!isCollapsed && (
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography
                sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.full_name || 'Agent'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography
                  sx={{
                    fontSize: '11px',
                    color: '#666666',
                  }}
                >
                  {getPlanLabel(user?.subscription_plan)}
                </Typography>
                {isAdmin(user?.role) && (
                  <Box
                    sx={{
                      fontSize: '9px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#E2C05A',
                      backgroundColor: 'rgba(226, 192, 90, 0.12)',
                      border: '1px solid rgba(226, 192, 90, 0.2)',
                      borderRadius: '4px',
                      px: 0.75,
                      py: 0.15,
                      lineHeight: 1.4,
                    }}
                  >
                    Admin
                  </Box>
                )}
              </Box>
            </Box>
          )}
          {!isCollapsed && (
            <Tooltip title="Logout" placement="top" arrow>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                size="small"
                sx={{
                  color: '#666666',
                  '&:hover': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  },
                }}
                aria-label="logout"
              >
                <SignOut size={16} weight="regular" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {isCollapsed && (
          <Tooltip title="Logout" placement="right" arrow>
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{
                mt: 0.5,
                color: '#666666',
                width: '100%',
                '&:hover': {
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                },
              }}
              aria-label="logout"
            >
              <SignOut size={16} weight="regular" />
            </IconButton>
          </Tooltip>
        )}
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
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 256,
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
              borderRight: '1px solid rgba(226, 192, 90, 0.08)',
              backgroundColor: '#080808',
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
