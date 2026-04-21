'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Box, IconButton, Divider, Typography } from '@mui/material';
import { X, House, Storefront, Users, Calculator, ListChecks, SignIn, Handshake, Envelope } from '@phosphor-icons/react';
import { ReapexLogo } from '@/components/ui/ReapexLogo';

interface AgentMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const consumerLinks = [
  { label: 'Sell', href: '/sell', icon: Storefront },
  { label: 'Buy', href: '/listings', icon: House },
  { label: 'Our Agents', href: '/agents', icon: Users },
  { label: 'Contact Us', href: '/contact', icon: Envelope },
];

export function AgentMegaMenu({ isOpen, onClose }: AgentMegaMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 1299,
            }}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '100vw',
              // maxWidth: '400px', // Removed to make full screen
              height: '100vh',
              backgroundColor: '#0a0a0a',
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
                p: 3,
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              }}
            >
              <ReapexLogo width={120} height={40} variant="light" />
              <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
                <X size={28} weight="bold" />
              </IconButton>
            </Box>

            {/* Main Menu Content */}
            <Box
              sx={{
                flex: 1,
                backgroundColor: '#141414',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                overflowY: 'auto',
              }}
            >
              {/* Consumer Links */}
              {consumerLinks.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        transition: 'all 0.3s ease',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Icon size={24} weight="duotone" color="#ffffff" />
                      <Typography
                        sx={{
                          color: '#ffffff',
                          fontSize: '1rem',
                          fontWeight: 500,
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Agent Login Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: consumerLinks.length * 0.1 }}
              >
                <Link
                  href="/login"
                  onClick={onClose}
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    marginTop: '12px',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '1rem',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: '#ffffff',
                      },
                    }}
                  >
                    <SignIn size={24} weight="duotone" />
                    Agent Login
                  </Box>
                </Link>
              </motion.div>

              {/* Partner CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (consumerLinks.length + 1) * 0.1 }}
              >
                <Link
                  href="/join"
                  onClick={onClose}
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    marginTop: '8px',
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: '#d4af37',
                      color: '#0a0a0a',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
                      '&:hover': {
                        backgroundColor: '#c49d2f',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)',
                      },
                    }}
                  >
                    <Handshake size={24} weight="bold" />
                    Partner With Us
                  </Box>
                </Link>
              </motion.div>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
