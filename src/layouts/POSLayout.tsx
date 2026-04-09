import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button, IconButton, alpha, useTheme, Avatar } from '@mui/material';
import { PowerSettingsNew, Settings, ReceiptLong, LockOpen, DarkMode, LightMode, Storefront } from '@mui/icons-material';
import React from 'react';
import LockScreen from '../components/pos/LockScreen';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { useActivityStore } from '../store/useActivityStore';

export default function POSLayout() {
  const [isLocked, setIsLocked] = React.useState(false);
  const { mode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { logActivity } = useActivityStore();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogout = () => {
    logActivity('LOGOUT', 'User logged out', user?.email);
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {isLocked && <LockScreen isLocked={isLocked} onUnlock={() => setIsLocked(false)} />}
      
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: alpha(theme.palette.background.paper, 0.8), 
          backdropFilter: 'blur(10px)',
          color: 'text.primary', 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          px: 2
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 70 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, borderRadius: 3, transform: 'rotate(-5deg)', boxShadow: 2 }}>
                <Storefront sx={{ fontSize: 22 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1, letterSpacing: -0.5, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  SWIFTY <span style={{ color: theme.palette.text.primary, fontWeight: 400 }}>POS</span>
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5, display: { xs: 'none', md: 'block' } }}>SWIFTY POS</Typography>
              </Box>
            </Box>
            
            <Box sx={{ ml: { xs: 1, md: 3 }, display: 'flex', gap: 1 }}>
              <Link to="/admin" style={{ textDecoration: 'none' }}>
                <Button 
                variant="outlined" 
                size="small"
                sx={{ 
                  borderRadius: 3, px: { xs: 1.5, md: 2 }, fontWeight: 700, 
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  color: 'primary.main',
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05), borderColor: 'primary.main' }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>ADMIN PANEL</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>ADMIN</Box>
              </Button>
            </Link>
              <Link to="/kds" style={{ textDecoration: 'none' }}>
                <Button 
                variant="outlined" 
                size="small"
                sx={{ 
                  borderRadius: 3, px: { xs: 1.5, md: 2 }, fontWeight: 700, 
                  borderColor: alpha(theme.palette.warning.main, 0.2),
                  color: 'warning.main',
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.05), borderColor: 'warning.main' }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>KITCHEN</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>KDS</Box>
              </Button>
            </Link>
          </Box>
        </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ textAlign: 'right', mr: 2, display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.2 }}>{user?.email || 'Staff'}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>SHIFT ACTIVE</Typography>
            </Box>
            
            <IconButton size="medium" onClick={toggleTheme} sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.action.hover, 0.05) }}>
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
            
            <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 1 }, ml: 1 }}>
              <IconButton size="medium" sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.action.hover, 0.05), display: { xs: 'none', sm: 'inline-flex' } }}><ReceiptLong fontSize="small" /></IconButton>
              <IconButton size="medium" sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.action.hover, 0.05), display: { xs: 'none', sm: 'inline-flex' } }}><Settings fontSize="small" /></IconButton>
              <IconButton size="medium" sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.action.hover, 0.05) }} onClick={() => setIsLocked(true)}><LockOpen fontSize="small" /></IconButton>
              <IconButton size="medium" color="error" sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.error.main, 0.05) }} onClick={handleLogout}><PowerSettingsNew fontSize="small" /></IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 0, sm: 1.5, md: 2 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}
