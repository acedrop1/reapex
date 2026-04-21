'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from 'next/link';
import { Box, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ReapexLogo } from '@/components/ui/ReapexLogo';
import AgentApplicationModal from '@/components/modals/AgentApplicationModal';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const menuItems = [
  { label: 'Home', href: '/' },
  { label: 'Buy', href: '/listings' },
  { label: 'Sell', href: '/sell' },
  { label: 'Our Agents', href: '/agents' },
  { label: 'Join Us', href: '/join' },
  { label: 'Contact Us', href: '/contact' },
];

const menuVariants: Variants = {
  closed: {
    x: '100%',
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
    },
  },
  open: {
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
    },
  },
};

const menuItemVariants: Variants = {
  closed: {
    x: 50,
    opacity: 0,
  },
  open: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  }),
};

export function MobileMenu({ isOpen, onClose, isDark }: MobileMenuProps) {
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);

  const handleJoinUsClick = () => {
    setApplicationModalOpen(true);
    onClose(); // Close mobile menu when opening modal
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Menu Panel */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: '#ffffff',
              zIndex: 1300,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <ReapexLogo width={120} height={40} variant="dark" />
              <IconButton onClick={onClose} sx={{ color: '#1a1a1a' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Menu Items */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 4,
                gap: 2,
              }}
            >
              {menuItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  custom={i}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={menuItemVariants}
                >
                  {item.label === 'Join Us' ? (
                    <div
                      onClick={handleJoinUsClick}
                      style={{
                        textDecoration: 'none',
                        color: '#1a1a1a',
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif',
                        display: 'block',
                        padding: '16px 0',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'color 0.2s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#666666';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#1a1a1a';
                      }}
                    >
                      {item.label}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      style={{
                        textDecoration: 'none',
                        color: '#1a1a1a',
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        fontFamily: 'DM Sans, sans-serif',
                        display: 'block',
                        padding: '16px 0',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#666666';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#1a1a1a';
                      }}
                    >
                      {item.label}
                    </Link>
                  )}
                </motion.div>
              ))}

              {/* Login Button */}
              <motion.div
                custom={menuItems.length}
                initial="closed"
                animate="open"
                exit="closed"
                variants={menuItemVariants}
              >
                <Link
                  href="/login"
                  onClick={onClose}
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    marginTop: '24px',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: '#1a1a1a',
                      color: '#ffffff',
                      padding: '16px 32px',
                      borderRadius: 0,
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '1rem',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#333333',
                      },
                    }}
                  >
                    Login
                  </Box>
                </Link>
              </motion.div>
            </Box>
          </motion.div>
        </>
      )}
      <AgentApplicationModal
        open={applicationModalOpen}
        onClose={() => setApplicationModalOpen(false)}
      />
    </AnimatePresence>
  );
}
