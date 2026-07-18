import React from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  TextField, 
  Button, 
  Container, 
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Store as StoreIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useActivityStore } from '../../store/useActivityStore';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const theme = useTheme();
  const [tab, setTab] = React.useState(0);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle } = useAuthStore();
  const { logActivity } = useActivityStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    logActivity('LOGIN', 'User authenticated via email/password', email);
    if (useAuthStore.getState().role === 'super_admin') {
      navigate('/super-admin');
    } else {
      navigate('/admin');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Business name is required.');
      return;
    }

    setIsLoading(true);
    const result = await signup(email, password, businessName);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    logActivity('LOGIN', 'New workspace created', email);
    navigate('/admin');
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    if (result.error) {
      setError(result.error);
      return;
    }
    logActivity('LOGIN', 'Google Authentication initiated', 'google-oauth');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: '#F9F6F3',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '40%',
        height: '40%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
        zIndex: 0
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '40%',
        height: '40%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
        zIndex: 0
      }
    }}>
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, mx: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ 
            p: { xs: 4, sm: 6 }, 
            borderRadius: 7, 
            bgcolor: alpha('#FFFFFF', 0.8),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha('#FFFFFF', 0.5)}`,
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.1)',
          }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: 'primary.main', 
                color: 'white', 
                borderRadius: 3, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mx: 'auto', 
                mb: 3,
                boxShadow: `0 8px 24px -6px ${alpha(theme.palette.primary.main, 0.4)}`
              }}>
                <StoreIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1, color: '#2D2D2D', mb: 1 }}>
                Welcome back
              </Typography>
              <Typography sx={{ color: '#6A6A6A', fontWeight: 500 }}>
                {tab === 0 ? 'Sign in to your workspace' : 'Create a new workspace'}
              </Typography>
            </Box>

            <Tabs 
              value={tab} 
              onChange={(_, v) => { setTab(v); setError(''); }} 
              variant="fullWidth" 
              sx={{ mb: 4, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}
            >
              <Tab label="Sign In" />
              <Tab label="Sign Up" />
            </Tabs>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

            {tab === 0 ? (
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  margin="normal"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  margin="normal"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ 
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={isLoading}
                  sx={{ 
                    py: 1.8, 
                    borderRadius: 3, 
                    fontWeight: 800,
                    fontSize: '1rem',
                    letterSpacing: 0.5,
                    boxShadow: `0 12px 24px -8px ${alpha(theme.palette.primary.main, 0.5)}`,
                    '&:hover': {
                      boxShadow: `0 16px 32px -8px ${alpha(theme.palette.primary.main, 0.6)}`,
                    }
                  }}
                >
                  {isLoading ? 'Signing In...' : 'SIGN IN'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                <TextField
                  fullWidth
                  label="Business Name"
                  variant="outlined"
                  margin="normal"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  helperText="This will be your workspace name"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  margin="normal"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  margin="normal"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Minimum 6 characters"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ 
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                  }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={isLoading}
                  sx={{ 
                    py: 1.8, 
                    borderRadius: 3, 
                    fontWeight: 800,
                    fontSize: '1rem',
                    letterSpacing: 0.5,
                    boxShadow: `0 12px 24px -8px ${alpha(theme.palette.primary.main, 0.5)}`,
                    '&:hover': {
                      boxShadow: `0 16px 32px -8px ${alpha(theme.palette.primary.main, 0.6)}`,
                    }
                  }}
                >
                  {isLoading ? 'Creating Workspace...' : 'CREATE WORKSPACE'}
                </Button>
              </form>
            )}

            <Box sx={{ my: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>OR</Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              sx={{ 
                py: 1.5, 
                borderRadius: 3, 
                fontWeight: 700,
                color: '#334155',
                borderColor: '#e2e8f0',
                '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
              }}
            >
              Continue with Google
            </Button>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#AAAAAA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Protected by Swifty Identity
              </Typography>
            </Box>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
