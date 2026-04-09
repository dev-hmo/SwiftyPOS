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
  alpha
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
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();
  const { setUser, setRole, loginWithGoogle } = useAuthStore();
  const { logActivity } = useActivityStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simulation logic (Integration with Supabase Auth will go here)
    if (email === 'admin@example.com' && password === 'admin123') {
      setUser({ email, id: '1' });
      setRole('admin');
      logActivity('LOGIN', 'Admin authenticated', email);
      navigate('/admin');
    } else if (email === 'cashier@example.com' && password === 'cashier123') {
      setUser({ email, id: '2' });
      setRole('cashier');
      logActivity('LOGIN', 'Cashier authenticated', email);
      navigate('/pos');
    } else if (email === 'superadmin@swiftypos.com' && password === 'super123') {
      setUser({ email, id: '0', name: 'Super Admin' });
      setRole('admin');
      logActivity('LOGIN', 'Super Admin authenticated', email);
      navigate('/admin/saas');
    } else {
      setError('Invalid credentials. Try admin@example.com / admin123');
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
    logActivity('LOGIN', 'Google Authentication Success', 'google-oauth');
    navigate('/admin');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100%',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: '#F9F6F3', // Soft Cream
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
            <Box sx={{ textAlign: 'center', mb: 6 }}>
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
                Sign in to your Swifty POS account
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
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
                SIGN IN
              </Button>

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
            </form>

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
