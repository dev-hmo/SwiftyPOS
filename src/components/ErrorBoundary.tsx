import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#F9F6F3',
          px: 4,
        }}>
          <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
            <ErrorOutline sx={{
              fontSize: 80,
              color: alpha('#E07B39', 0.4),
              mb: 3,
            }} />
            <Typography
              variant="h4"
              sx={{ fontFamily: '"Outfit"', fontWeight: 800, mb: 1 }}
            >
              Something went wrong
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'text.secondary', mb: 1 }}
            >
              An unexpected error occurred. Please try again.
            </Typography>
            {this.state.error && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  p: 2,
                  bgcolor: alpha('#000', 0.03),
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  color: 'error.main',
                  mb: 4,
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReload}
              sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: 700 }}
            >
              Reload Application
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
