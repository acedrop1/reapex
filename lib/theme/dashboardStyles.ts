// Shared dashboard dark theme styles (black/gold/white)

export const dashboardStyles = {
  // Container styles
  container: {
    backgroundColor: '#0A0A0A', // Near-black background
    color: '#FFFFFF', // White text
  },

  // Paper/Card styles (dark bg, subtle borders, rounded)
  paper: {
    backgroundColor: '#121212', // Card background
    border: '1px solid #2A2A2A', // Subtle border
    borderRadius: '12px', // Rounded corners
    color: '#FFFFFF',
    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.6)',
    transition: 'all 200ms ease',
    '&:hover': {
      borderColor: '#333333',
      boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.7)',
    },
  },

  card: {
    backgroundColor: '#121212',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    color: '#FFFFFF',
    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.6)',
    transition: 'all 200ms ease',
    '&:hover': {
      borderColor: '#333333',
      boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.7)',
    },
  },

  // Table styles
  table: {
    backgroundColor: '#121212',
    border: '1px solid #2A2A2A',
    borderRadius: 0,
    overflow: 'hidden',
    '& .MuiTableCell-root': {
      color: '#FFFFFF',
      borderColor: '#2A2A2A',
    },
    '& .MuiTableHead-root': {
      backgroundColor: 'rgba(226, 192, 90, 0.08)',
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
      fontWeight: 700,
      color: '#E2C05A',
      fontSize: '0.75rem',
      padding: '8px 12px',
      borderBottom: '1px solid #2A2A2A',
      cursor: 'pointer',
      userSelect: 'none',
      '&:hover': {
        backgroundColor: 'rgba(226, 192, 90, 0.12)',
      },
    },
    '& .MuiTableRow-root:hover': {
      backgroundColor: 'rgba(226, 192, 90, 0.04)',
      cursor: 'pointer',
    },
    '& .MuiTableRow-root:nth-of-type(even)': {
      backgroundColor: '#151515',
    },
  },

  // Chip styles
  chip: {
    backgroundColor: '#1E1E1E',
    border: '1px solid #2A2A2A',
    borderRadius: '4px',
    color: '#B0B0B0',
    '&:hover': {
      backgroundColor: '#242424',
    },
  },

  // Status chip variants
  chipSuccess: {
    backgroundColor: 'rgba(27, 94, 32, 0.15)',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    color: '#81C784',
  },

  chipWarning: {
    backgroundColor: 'rgba(230, 81, 0, 0.15)',
    border: '1px solid rgba(255, 152, 0, 0.3)',
    color: '#FFB74D',
  },

  chipError: {
    backgroundColor: 'rgba(183, 28, 28, 0.15)',
    border: '1px solid rgba(244, 67, 54, 0.3)',
    color: '#EF5350',
  },

  chipInfo: {
    backgroundColor: 'rgba(140, 109, 31, 0.15)',
    border: '1px solid rgba(226, 192, 90, 0.3)',
    color: '#EDD48A',
  },

  // Button styles
  button: {
    backgroundColor: 'transparent',
    borderRadius: '8px',
    border: '1px solid #1a1a1a',
    color: '#FFFFFF',
    transition: 'all 200ms ease',
    '&:hover': {
      backgroundColor: 'rgba(26, 26, 26, 0.3)',
      borderColor: '#333333',
    },
  },

  buttonContained: {
    borderRadius: '8px',
    backgroundColor: '#1a1a1a', // Black primary
    color: '#FFFFFF',
    border: 'none',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    transition: 'all 200ms ease',
    '&:hover': {
      backgroundColor: '#333333', // Lighter black/dark gray
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
    },
    '&:active': {
      backgroundColor: '#000000',
      transform: 'translateY(0)',
    },
  },

  // Dialog styles
  dialog: {
    '& .MuiDialog-paper': {
      borderRadius: '16px',
      border: '1px solid #2A2A2A',
      backgroundColor: '#1A1A1A',
      boxShadow: '0 12px 24px 0 rgba(0, 0, 0, 0.9)',
    },
    '& .MuiBackdrop-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
    },
  },

  // TextField styles
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#1A1A1A',
      borderRadius: '8px',
      color: '#FFFFFF',
      '& fieldset': {
        borderColor: '#2A2A2A',
      },
      '&:hover fieldset': {
        borderColor: '#333333',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#E2C05A', // Gold focus
        boxShadow: '0 0 0 3px rgba(226, 192, 90, 0.3)',
      },
      '&.Mui-disabled': {
        backgroundColor: '#121212',
        '& fieldset': {
          borderColor: '#2A2A2A',
        },
      },
    },
    '& .MuiInputLabel-root': {
      color: '#B0B0B0',
      '&.Mui-focused': {
        color: '#E2C05A',
      },
      '&.Mui-disabled': {
        color: '#4D4D4D',
      },
    },
    '& .MuiInputBase-input': {
      color: '#FFFFFF',
      '&.Mui-disabled': {
        color: '#4D4D4D',
        WebkitTextFillColor: '#4D4D4D',
      },
      '&::placeholder': {
        color: '#808080',
        opacity: 1,
      },
    },
    '& .MuiSelect-select': {
      color: '#FFFFFF',
      '&.Mui-disabled': {
        color: '#4D4D4D',
        WebkitTextFillColor: '#4D4D4D',
      },
    },
    '& .MuiFormHelperText-root': {
      color: '#B0B0B0',
      '&.Mui-error': {
        color: '#EF5350',
      },
    },
  },

  // Tab styles
  tabs: {
    borderBottom: '1px solid #2A2A2A',
    '& .MuiTab-root': {
      color: '#B0B0B0',
      transition: 'color 200ms ease',
      '&.Mui-selected': {
        color: '#E2C05A', // Gold for selected
        fontWeight: 600,
      },
      '&:hover': {
        color: '#FFFFFF',
      },
    },
    '& .MuiTabs-indicator': {
      backgroundColor: '#E2C05A', // Gold indicator
      height: '3px',
      borderRadius: '3px 3px 0 0',
    },
  },

  // Typography colors
  typography: {
    primary: { color: '#FFFFFF' },
    secondary: { color: '#B0B0B0' },
    tertiary: { color: '#808080' },
  },

  // Icon color
  icon: {
    color: '#B0B0B0',
  },

  iconPrimary: {
    color: '#E2C05A', // Gold icons
  },

  // Divider
  divider: {
    borderColor: '#2A2A2A',
  },

  // Badge
  badge: {
    backgroundColor: '#E2C05A',
    color: '#000000',
  },

  // Progress bar
  progress: {
    backgroundColor: '#2A2A2A', // Track
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#E2C05A', // Bar
    },
  },

  // Sidebar specific
  sidebar: {
    backgroundColor: '#0F0F0F',
    borderRight: '1px solid #2A2A2A',
  },

  sidebarItem: {
    color: '#B0B0B0',
    borderRadius: '8px',
    transition: 'all 200ms ease',
    '&:hover': {
      backgroundColor: '#1A1A1A',
      color: '#FFFFFF',
    },
    '&.active': {
      backgroundColor: '#E2C05A',
      color: '#000000',
    },
  },
};
