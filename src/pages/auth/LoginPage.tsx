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
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Store as StoreIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useActivityStore } from '../../store/useActivityStore';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const theme = useTheme();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { logActivity } = useActivityStore();
  const { t } = useLanguage();

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
    const currentRole = useAuthStore.getState().role;
    if (currentRole === 'cashier') {
      navigate('/pos');
    } else if (currentRole === 'kitchen') {
      navigate('/kds');
    } else {
      navigate('/admin');
    }
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
                {t('login.welcome')}
              </Typography>
              <Typography sx={{ color: '#6A6A6A', fontWeight: 500 }}>
                {t('login.subtitle')}
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label={t('login.email')}
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
                label={t('login.password')}
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
                {isLoading ? t('login.signInLoading') : t('login.signIn')}
              </Button>
            </form>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#AAAAAA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {t('login.protected')}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <LanguageSwitcher />
              </Box>
            </Box>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
