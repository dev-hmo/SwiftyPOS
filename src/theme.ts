import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: '#E07B39', // Cafe Terracotta
      light: '#EB9D6A',
      dark: '#B05D28',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981', // Mint Green (for success/positivity)
    },
    background: {
      default: mode === 'light' ? '#F9F6F3' : '#121212', // Warm Cream or Deep Dark
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
    text: {
      primary: mode === 'light' ? '#1F2937' : '#F9F6F3', // Slate or White
      secondary: mode === 'light' ? '#6B7280' : '#9CA3AF',
    },
    divider: mode === 'light' ? '#F1E9E2' : '#2D2D2D',
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontWeight: 800, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 700 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 4, // Reset to standard 4px base for predictable sx scaling
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px -4px rgba(224, 123, 57, 0.3)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #E07B39 0%, #B05D28 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: mode === 'light' 
            ? '0 10px 30px -10px rgba(0,0,0,0.04)' 
            : '0 10px 30px -10px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16, // Explicit 16px for a premium card feel
          border: `1px solid ${mode === 'light' ? '#F1E9E2' : '#2D2D2D'}`,
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
        },
      },
    },
  },
});
