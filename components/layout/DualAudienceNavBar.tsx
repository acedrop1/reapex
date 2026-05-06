'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Container, AppBar, Toolbar, Button, IconButton, Dialog, Typography, Alert, Card } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { ReapexLogo } from '@/components/ui/ReapexLogo';
import { List } from '@phosphor-icons/react';
import { AgentMegaMenu } from './AgentMegaMenu';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

export function DualAudienceNavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    }

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleGoogleLogin() {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
      // Redirect happens automatically
    } catch (err: any) {
      setLoginError(err.message || 'An unexpected error occurred');
      setLoginLoading(false);
    }
  }

  // Homepage has its own nav built into MarketingHomepage — hide this one
  const isHomePage = pathname === '/';
  if (isHomePage) return null;

  const isTransparent = false;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: isTransparent
          ? 'rgba(10, 10, 10, 0.3)'
          : 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1.5, px: { xs: 0, sm: 2 } }}>
          {/* Left Side: Brand & Consumer */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <ReapexLogo width={140} height={46} variant="light" />
            </Link>

            {/* Consumer Links - Desktop Only */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center' }}>
              <Button
                component={Link}
                href="/sell"
                sx={{
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  fontFamily: 'DM Sans, sans-serif',
                  position: 'relative',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: '2px',
                    backgroundColor: '#d4af37',
                    transition: 'width 0.3s ease',
                  },
                  '&:hover': {
                    backgroundColor: 'transparent',
                    '&:after': {
                      width: '70%',
                    },
                  },
                }}
              >
                Sell
              </Button>
              <Button
                component={Link}
                href="/listings"
                sx={{
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  fontFamily: 'DM Sans, sans-serif',
                  position: 'relative',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: '2px',
                    backgroundColor: '#d4af37',
                    transition: 'width 0.3s ease',
                  },
                  '&:hover': {
                    backgroundColor: 'transparent',
                    '&:after': {
                      width: '70%',
                    },
                  },
                }}
              >
                Buy
              </Button>
              <Button
                component={Link}
                href="/agents"
                sx={{
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  fontFamily: 'DM Sans, sans-serif',
                  position: 'relative',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: '2px',
                    backgroundColor: '#d4af37',
                    transition: 'width 0.3s ease',
                  },
                  '&:hover': {
                    backgroundColor: 'transparent',
                    '&:after': {
                      width: '70%',
                    },
                  },
                }}
              >
                Our Agents
              </Button>
              <Button
                component={Link}
                href="/contact"
                sx={{
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  fontFamily: 'DM Sans, sans-serif',
                  position: 'relative',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: '2px',
                    backgroundColor: '#d4af37',
                    transition: 'width 0.3s ease',
                  },
                  '&:hover': {
                    backgroundColor: 'transparent',
                    '&:after': {
                      width: '70%',
                    },
                  },
                }}
              >
                Contact Us
              </Button>
            </Box>
          </Box>

          {/* Right Side: Agent Focus */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>


            {/* Agent Portal - Conditional */}
            <Button
              component={isAuthenticated ? Link : 'button'}
              href={isAuthenticated ? '/dashboard' : undefined}
              onClick={isAuthenticated ? undefined : () => setLoginModalOpen(true)}
              variant="outlined"
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9375rem',
                fontFamily: 'DM Sans, sans-serif',
                px: 3,
                py: 1,
                borderRadius: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: '#ffffff',
                },
              }}
            >
              Agent Portal
            </Button>

            {/* Partner With Us - Gold CTA */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                component={Link}
                href="/join"
                variant="contained"
                sx={{
                  backgroundColor: '#d4af37',
                  color: '#0a0a0a',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  fontFamily: 'DM Sans, sans-serif',
                  px: 4,
                  py: 1.25,
                  borderRadius: 1,
                  boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#c49d2f',
                    boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)',
                  },
                }}
              >
                Partner With Us
              </Button>
            </motion.div>
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            sx={{
              display: { md: 'none' },
              color: '#ffffff',
            }}
            aria-label="menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <List size={28} weight="bold" />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Mobile Mega Menu */}
      <AgentMegaMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Agent Login Modal */}
      <Dialog
        open={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false);
          setLoginError(null);
        }}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.2)',
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ mb: 3 }}>
              <ReapexLogo width={180} height={60} variant="dark" />
            </Box>
            <Typography
              component="h2"
              variant="h6"
              gutterBottom
              sx={{ mb: 3, color: '#1a1a1a', fontWeight: 600 }}
            >
              Sign in to your account
            </Typography>
            {loginError && (
              <Alert severity="error" sx={{ mt: 2, mb: 2, width: '100%' }}>
                {loginError}
              </Alert>
            )}

            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              disabled={loginLoading}
              startIcon={<GoogleIcon />}
              sx={{
                mt: 2,
                py: 1.5,
                fontWeight: 600,
                borderColor: '#ddd',
                color: '#555',
                '&:hover': {
                  borderColor: '#d4af37',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              {loginLoading ? 'Connecting...' : 'Sign in with Google'}
            </Button>

            <Typography
              variant="body2"
              sx={{
                mt: 3,
                textAlign: 'center',
                color: '#666',
                fontWeight: 500,
              }}
            >
              Join us at Reapex and keep more of your commission
            </Typography>
          </Box>
        </Box>
      </Dialog>
    </AppBar>
  );
}
