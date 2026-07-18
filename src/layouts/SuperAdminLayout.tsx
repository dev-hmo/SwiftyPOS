import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Avatar, useTheme, alpha,
  Paper, useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DarkMode, LightMode, Logout, Menu as MenuIcon, AdminPanelSettings
} from '@mui/icons-material';
import React from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';

const drawerWidth = 260;

const NAV_ITEMS = [
  { title: 'Dashboard', path: '/super-admin', icon: <DashboardIcon /> },
];

export default function SuperAdminLayout() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeStore();
  const { logout } = useAuthStore();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const glassStyle = {
    bgcolor: mode === 'light' ? alpha(theme.palette.background.paper, 0.8) : alpha(theme.palette.background.paper, 0.5),
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  };

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          ...glassStyle,
          color: 'text.primary',
          boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 70, md: 80 }, px: { xs: 1.5, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 3 } }}>
            {isMobile && (
              <IconButton color="inherit" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 0.5, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2.5 }}>
                <MenuIcon color="primary" />
              </IconButton>
            )}
            <Typography variant="h6" noWrap sx={{ fontWeight: 900, fontSize: { xs: '1.2rem', md: '1.4rem' }, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 }, borderRadius: 2.5, bgcolor: 'error.main', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', boxShadow: theme.shadows[2] }}>
                <AdminPanelSettings sx={{ fontSize: { xs: 18, md: 24 } }} />
              </Box>
              Super Admin
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary', p: 1, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.05), display: { xs: 'none', md: 'inline-flex' } }}>
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth, boxSizing: 'border-box',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            bgcolor: theme.palette.background.default,
          },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 70, md: 80 } }} />
        <Box sx={{ flex: 1, overflowY: 'auto', mt: 4, px: 2 }}>
          <List sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
            {NAV_ITEMS.map((item) => (
              <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                <Link to={item.path} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                  <ListItemButton
                    selected={location.pathname === item.path}
                    sx={{
                      borderRadius: 4, py: 1.5,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.error.main, 0.08),
                        color: 'error.main',
                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12) },
                        '& .MuiListItemIcon-root': { color: 'error.main' },
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: 'text.secondary', minWidth: 44 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.title} primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 700 : 600, fontSize: '0.95rem' }} />
                  </ListItemButton>
                </Link>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ p: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 5, bgcolor: alpha(theme.palette.background.paper, 0.5), border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: 'error.main', color: 'white', border: `2px solid ${theme.palette.error.main}` }}>
              <AdminPanelSettings />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={800} noWrap>Super Admin</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap sx={{ display: 'block', textTransform: 'uppercase' }}>Platform Access</Typography>
            </Box>
          </Paper>
          <IconButton size="small" onClick={handleLogout} sx={{ width: '100%', borderRadius: 3, py: 1, color: 'error.main' }}><Logout fontSize="small" /></IconButton>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, bgcolor: theme.palette.background.default, minHeight: '100vh', width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar sx={{ minHeight: { xs: 70, md: 80 } }} />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Outlet />
        </motion.div>
      </Box>
    </Box>
  );
}
