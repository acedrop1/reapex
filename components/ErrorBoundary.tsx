'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { ErrorModal } from '@/components/ErrorModal';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showModal: boolean;
}

/**
 * Error Boundary component to catch React errors and display fallback UI
 * Prevents the entire app from crashing when a component throws an error
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showModal: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and error reporting service
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    this.setState({
      error,
      errorInfo,
      showModal: true,
    });

    // TODO: Send error to error reporting service (e.g., Sentry, LogRocket)
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showModal: false,
    });
  };

  handleCloseModal = () => {
    this.setState({ showModal: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return (
          <>
            {this.props.fallback}
            <ErrorModal
              open={this.state.showModal}
              onClose={this.handleCloseModal}
              error={{
                title: 'Application Error',
                message: this.state.error?.message || 'An unexpected error occurred',
                severity: 'error',
                action: {
                  label: 'Reload Page',
                  onClick: this.handleReload,
                },
              }}
            />
          </>
        );
      }

      // Default fallback UI with ErrorModal integration
      return (
        <>
          <ErrorModal
            open={this.state.showModal}
            onClose={this.handleCloseModal}
            error={{
              title: 'Application Error',
              message: this.state.error?.message || 'An unexpected error occurred',
              severity: 'error',
              action: {
                label: 'Try Again',
                onClick: this.handleReset,
              },
            }}
          />
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
            }}
          >
            <Warning sx={{ fontSize: 64, color: '#FFB74D', mb: 2 }} />

            <Typography variant="h4" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
              Oops! Something went wrong
            </Typography>

            <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 3 }}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 3,
                  mb: 3,
                  p: 2,
                  backgroundColor: '#0a0a0a',
                  borderRadius: 1,
                  border: '1px solid #2a2a2a',
                  textAlign: 'left',
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    color: '#ef5350',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      mt: 2,
                      color: '#b0b0b0',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: '0.7rem',
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                onClick={this.handleReset}
                sx={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  '&:hover': {
                    backgroundColor: '#2a2a2a',
                  },
                }}
              >
                Try Again
              </Button>

              <Button
                variant="outlined"
                onClick={this.handleReload}
                sx={{
                  borderColor: '#2a2a2a',
                  color: '#b0b0b0',
                  '&:hover': {
                    borderColor: '#3a3a3a',
                    backgroundColor: '#1a1a1a',
                  },
                }}
              >
                Reload Page
              </Button>

              <Button
                variant="text"
                onClick={() => (window.location.href = '/dashboard')}
                sx={{
                  color: '#b0b0b0',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                  },
                }}
              >
                Go to Dashboard
              </Button>
            </Box>
          </Paper>
        </Container>
        </>
      );
    }

    return this.props.children;
  }
}
