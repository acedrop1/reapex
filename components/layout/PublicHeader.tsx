'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Container, AppBar, Toolbar, Button, IconButton } from '@mui/material';
import { ReapexLogo } from '@/components/ui/ReapexLogo';
import { Menu as MenuIcon } from '@mui/icons-material';
import { MobileMenu } from './MobileMenu';
import AgentApplicationModal from '@/components/modals/AgentApplicationModal';

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const pathname = usePathname();

  // About page should never show dark header (always transparent)
  const isAboutPage = pathname === '/about';
  // Homepage should start transparent and transition to dark after scroll
  const isHomePage = pathname === '/';
  // Login page should use black background
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const handleScroll = () => {
      // Large scroll threshold for homepage only
      const scrollThreshold = isHomePage ? window.innerHeight * 0.7 : 50;
      setScrolled(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, isHomePage]);

  // Show dark header logic:
  // - About page: always transparent (never dark)
  // - Homepage: start transparent, go dark after scroll
  // - Login page: black background
  // - All other pages: always dark (standard header)
  const isDark = isAboutPage ? false : (isHomePage ? scrolled : true);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: isLoginPage
          ? '#0a0a0a'
          : (isDark
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(255, 255, 255, 0.1)'),
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: 'none',
        borderBottom: isLoginPage
          ? '1px solid #2a2a2a'
          : (isDark
            ? '1px solid rgba(0, 0, 0, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.2)'),
        boxShadow: isDark
          ? '0 2px 8px rgba(0, 0, 0, 0.1)'
          : '0 4px 16px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        zIndex: 10,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <ReapexLogo width={150} height={50} variant={(isLoginPage || !isDark) ? 'light' : 'dark'} />
          </Link>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
            <Button
              component={Link}
              href="/"
              sx={{
                color: (isLoginPage || !isDark) ? '#ffffff' : '#1a1a1a',
                textTransform: 'none',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#d4af37',
                },
              }}
            >
              Home
            </Button>
            <Button
              component={Link}
              href="/listings"
              sx={{
                color: (isLoginPage || !isDark) ? '#ffffff' : '#1a1a1a',
                textTransform: 'none',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#d4af37',
                },
              }}
            >
              Buy
            </Button>
            <Button
              component={Link}
              href="/sell"
              sx={{
                color: (isLoginPage || !isDark) ? '#ffffff' : '#1a1a1a',
                textTransform: 'none',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#d4af37',
                },
              }}
            >
              Sell
            </Button>
            <Button
              component={Link}
              href="/agents"
              sx={{
                color: (isLoginPage || !isDark) ? '#ffffff' : '#1a1a1a',
                textTransform: 'none',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#d4af37',
                },
              }}
            >
              Our Agents
            </Button>
            <Button
              onClick={() => setApplicationModalOpen(true)}
              sx={{
                color: (isLoginPage || !isDark) ? '#ffffff' : '#1a1a1a',
                textTransform: 'none',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#d4af37',
                },
              }}
            >
              Join Us
            </Button>
            <Button
              component={Link}
              href="/contact"
              sx={{
                color: (isLoginPage || !isDark) ? '#ffffff' : '#1a1a1a',
                textTransform: 'none',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: '#d4af37',
                },
              }}
            >
              Contact Us
            </Button>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              sx={{
                color: isLoginPage ? '#0a0a0a' : '#ffffff',
                backgroundColor: isLoginPage ? '#d4af37' : '#1a1a1a',
                borderColor: isLoginPage ? '#d4af37' : '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: isLoginPage ? '#c49d2f' : '#333333',
                  borderColor: isLoginPage ? '#c49d2f' : '#ffffff',
                },
              }}
            >
              Login
            </Button>
          </Box>

          <IconButton
            sx={{
              display: { md: 'none' },
              color: (isLoginPage || !isDark) ? '#ffffff' : '#1a1a1a',
              transition: 'color 0.3s ease',
            }}
            aria-label="menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isDark={isDark}
      />
      <AgentApplicationModal
        open={applicationModalOpen}
        onClose={() => setApplicationModalOpen(false)}
      />
    </AppBar>
  );
}

