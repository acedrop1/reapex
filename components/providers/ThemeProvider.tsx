'use client';

import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';

// Dark theme with black/gold/white color palette — Reapex brand
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E2C05A', // Gold accent
      light: '#EDD48A',
      dark: '#C4A43B',
      contrastText: '#000000',
    },
    secondary: {
      main: '#F5E6A3',
      light: '#FFF8DC',
      dark: '#E2C05A',
    },
    background: {
      default: '#0A0A0A', // Near-black background
      paper: '#121212', // Card backgrounds
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
    divider: '#2A2A2A',
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#1B5E20',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#E65100',
    },
    error: {
      main: '#F44336',
      light: '#EF5350',
      dark: '#B71C1C',
    },
    info: {
      main: '#E2C05A',
      light: '#EDD48A',
      dark: '#C4A43B',
    },
  },
  typography: {
    fontFamily: [
      'DM Sans',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'DM Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: '#FFFFFF',
    },
    h2: {
      fontFamily: 'DM Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      color: '#FFFFFF',
    },
    h3: {
      fontFamily: 'DM Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      color: '#FFFFFF',
    },
    h4: {
      fontFamily: 'DM Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      color: '#FFFFFF',
    },
    h5: {
      fontFamily: 'DM Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      color: '#FFFFFF',
    },
    h6: {
      fontFamily: 'DM Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
      color: '#FFFFFF',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#FFFFFF',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#B0B0B0',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#121212',
          borderRadius: 12,
          border: '1px solid #2A2A2A',
          boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.6)',
          transition: 'all 200ms ease',
          '&:hover': {
            borderColor: '#333333',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.7)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          transition: 'all 200ms ease',
        },
        contained: {
          backgroundColor: '#1a1a1a',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#333333',
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
          },
          '&:active': {
            backgroundColor: '#000000',
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderColor: '#2A2A2A',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(26, 26, 26, 0.3)',
            borderColor: '#333333',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
          color: '#B0B0B0',
          border: '1px solid #2A2A2A',
          borderRadius: 4,
          '&:hover': {
            backgroundColor: '#242424',
          },
        },
        filled: {
          backgroundColor: '#1E1E1E',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#1E1E1E',
          },
          '&:nth-of-type(even)': {
            backgroundColor: '#151515',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #2A2A2A',
          color: '#FFFFFF',
        },
        head: {
          color: '#B0B0B0',
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: '0.875rem',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#1A1A1A',
            '& fieldset': {
              borderColor: '#2A2A2A',
            },
            '&:hover fieldset': {
              borderColor: '#333333',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#E2C05A',
              boxShadow: '0 0 0 3px rgba(226, 192, 90, 0.3)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#121212',
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        disableScrollLock: true,
      },
      styleOverrides: {
        paper: {
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          boxShadow: '0 12px 24px 0 rgba(0, 0, 0, 0.9)',
        },
      },
    },
    MuiModal: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiDrawer: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: ({ ownerState }: any) => ({
          // Transparent backdrop for Select menus, visible for dialogs
          backgroundColor: ownerState.invisible ? 'transparent' : 'rgba(0, 0, 0, 0.75)',
        }),
      },
    },
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          disableScrollLock: true,
          BackdropProps: {
            invisible: true, // Make backdrop transparent but keep it functional
          },
          slotProps: {
            paper: {
              sx: {
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                marginTop: '4px',
              },
            },
          },
        },
      },
    },
  },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
