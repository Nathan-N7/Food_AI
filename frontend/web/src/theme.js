import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212', // Fundo padrão dark mode do MUI
      paper: '#1e1e1e', // Ligeiramente mais claro para cards
    },
    primary: {
      main: '#9c27b0', // Roxo (Purple) principal
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    secondary: {
      main: '#b388ff', // Deep Purple / Lilás
    },
    error: {
      main: '#f44336',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Remove o uppercase padrão do Material Design
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove o overlay padrão de brilho
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)',
        },
      },
    },
  },
});

export default theme;
