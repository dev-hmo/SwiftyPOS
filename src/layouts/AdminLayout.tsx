import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  FormControl,
  Select,
  MenuItem,
  IconButton, 
  Collapse,
  Avatar,
  Divider,
  useTheme,
  alpha,
  Paper,
  useMediaQuery
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Inventory as InventoryIcon, 
  PointOfSale as POSIcon,
  BarChart as AnalyticsIcon,
  AccountBalanceWallet as AccountingIcon,
  Settings as SettingsIcon,
  Store as StoreIcon,
  DarkMode,
  LightMode,
  ExpandLess,
  ExpandMore,
  ViewList,
  Security,
  Receipt,
  HelpOutline,
  Logout,
  Menu as MenuIcon,
  Timeline,
  Kitchen,
  Science
} from '@mui/icons-material';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { useEnterpriseStore } from '../store/useEnterpriseStore';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRolesStore } from '../store/useRolesStore';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { motion } from 'framer-motion';

const drawerWidth = 260;

export default function AdminLayout() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentStoreId, setCurrentStore } = useEnterpriseStore();
  const { mode, toggleTheme } = useThemeStore();
  const { user, role, logout } = useAuthStore();
  const { hasPermission } = useRolesStore();
  const { t } = useLanguage();

  const NAVIGATION_CONFIG = React.useMemo(() => [
    { 
      title: t('sidebar.overview'), 
      key: 'Overview',
      path: '/admin', 
      icon: <DashboardIcon />, 
      roles: ['admin'] 
    },
    { 
      title: t('sidebar.sales'), 
      key: 'Sales & History',
      path: '/admin/sales', 
      icon: <Receipt />, 
      roles: ['admin'] 
    },
    { 
      title: t('sidebar.inventory'), 
      key: 'Inventory',
      icon: <InventoryIcon />, 
      roles: ['admin'],
      children: [
        { title: t('sidebar.products'), key: 'Products', path: '/admin/inventory', icon: <ViewList />, roles: ['admin'] },
        { title: t('sidebar.ingredients'), key: 'Ingredients', path: '/admin/inventory/ingredients', icon: <Kitchen />, roles: ['admin'] },
        { title: t('sidebar.variants'), key: 'Variants', path: '/admin/inventory/variants', icon: <Science />, roles: ['admin'] },
      ]
    },
    { 
      title: t('sidebar.reports'), 
      key: 'Reports Hub',
      path: '/admin/reports', 
      icon: <AnalyticsIcon />, 
      roles: ['admin'] 
    },
    { 
      title: t('sidebar.accounting'), 
      key: 'Accounting',
      path: '/admin/accounting', 
      icon: <AccountingIcon />, 
      roles: ['admin']
    },
    { 
      title: t('sidebar.activity'), 
      key: 'Activity Log',
      path: '/admin/activity', 
      icon: <Timeline />, 
      roles: ['admin'] 
    },
    { 
      title: t('sidebar.settings'), 
      key: 'Settings',
      icon: <SettingsIcon />, 
      roles: ['admin'],
      children: [
        { title: t('sidebar.globalSettings'), key: 'Global Settings', path: '/admin/settings', icon: <SettingsIcon />, roles: ['admin'] },
        { title: t('sidebar.roles'), key: 'Roles & Access', path: '/admin/settings/roles', icon: <Security />, roles: ['admin'] }
      ]
    },
  ], [t]);

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({
    'Inventory': true,
    'Settings': false,
  });

  const currentUserRole = role ?? null;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const hasAccess = (moduleName: string) => {
    if (!currentUserRole) return false;
    return hasPermission(currentUserRole, moduleName);
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
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 0.5, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2.5 }}
              >
                <MenuIcon color="primary" />
              </IconButton>
            )}
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 900, fontSize: { xs: '1.2rem', md: '1.4rem' }, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 }, borderRadius: 2.5, bgcolor: 'primary.main', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', boxShadow: theme.shadows[2] }}>
                <StoreIcon sx={{ fontSize: { xs: 18, md: 24 } }} />
              </Box>
              {t('brand.short')} <span style={{ color: theme.palette.text.secondary, fontWeight: 300, display: isMobile ? 'none' : 'inline' }}>POS</span>
            </Typography>
            <Box sx={{ flex: 1, maxWidth: { xs: 140, sm: 320 } }}>
            <FormControl fullWidth size="small">
              <Select
                value={currentStoreId}
                onChange={(e) => setCurrentStore(e.target.value as string)}
                startAdornment={<StoreIcon sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />}
                sx={{ 
                  borderRadius: 3, 
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  fontWeight: 600,
                  color: 'primary.main'
                }}
              >
                <MenuItem value="default" sx={{ py: 1.2, px: 2, borderRadius: 2, mx: 1 }}>{t('sidebar.defaultStore')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <LanguageSwitcher />
        </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary', p: 1, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.05), display: { xs: 'none', md: 'inline-flex' } }}>
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
            
            {!isMobile && <Divider orientation="vertical" flexItem sx={{ mx: 2, height: 28, my: 'auto', borderColor: alpha(theme.palette.divider, 0.1) }} />}

            <Link to="/pos" style={{ textDecoration: 'none' }}>
              <ListItemButton sx={{ borderRadius: 3, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, px: { xs: 2, md: 3 }, py: 1, boxShadow: `0 4px 16px -6px ${theme.palette.primary.main}` }}>
                <POSIcon sx={{ mr: { xs: 0, md: 1 }, fontSize: 20 }} />
                {!isMobile && <Typography variant="button" fontWeight={800} sx={{ letterSpacing: 0.5 }}>{t('sidebar.terminal')}</Typography>}
              </ListItemButton>
            </Link>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box', 
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            bgcolor: theme.palette.background.default,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isMobile ? '4px 0 24px -10px rgba(0,0,0,0.2)' : 'none'
          },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 70, md: 80 } }} />
        
        <Box sx={{ flex: 1, overflowY: 'auto', mt: 4, px: 2 }}>
          <List sx={{ gap: 0.5, display: 'flex', flexDirection: 'column' }}>
            {NAVIGATION_CONFIG.filter(item => {
              return hasAccess(item.key);
            }).map((item) => (
              <React.Fragment key={item.key}>
                {item.children ? (
                  <>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton 
                        onClick={() => toggleMenu(item.key)}
                        sx={{ borderRadius: 4, py: 1.5, '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.05) } }}
                      >
                        <ListItemIcon sx={{ color: openMenus[item.key] ? 'primary.main' : 'text.secondary', minWidth: 44 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.title} primaryTypographyProps={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: -0.2 }} />
                        {openMenus[item.key] ? <ExpandLess sx={{ opacity: 0.5 }} /> : <ExpandMore sx={{ opacity: 0.5 }} />}
                      </ListItemButton>
                    </ListItem>
                    <Collapse in={openMenus[item.key]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ mb: 1 }}>
                        {item.children.map(child => (
                           <ListItem key={child.title} disablePadding sx={{ mb: 0.5 }}>
                            <Link to={child.path} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                              <ListItemButton 
                                selected={location.pathname === child.path} 
                                sx={{ 
                                  pl: 8,
                                  py: 1,
                                  borderRadius: 4,
                                  mx: 0.5,
                                  '&.Mui-selected': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    color: 'primary.main',
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
                                    '&::before': {
                                      content: '""',
                                      position: 'absolute',
                                      left: 20,
                                      width: 4,
                                      height: '60%',
                                      bgcolor: 'primary.main',
                                      borderRadius: 4
                                    }
                                  }
                                }}
                              >
                                <ListItemText primary={child.title} primaryTypographyProps={{ fontWeight: location.pathname === child.path ? 800 : 500, fontSize: '0.88rem' }} />
                              </ListItemButton>
                            </Link>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </>
                ) : (
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <Link to={item.path!} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                      <ListItemButton 
                        selected={location.pathname === item.path} 
                        sx={{ 
                          borderRadius: 4, py: 1.5,
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: 'primary.main',
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
                            '& .MuiListItemIcon-root': { color: 'primary.main' }
                          }
                        }}
                      >
                        <ListItemIcon sx={{ color: 'text.secondary', minWidth: 44 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.title} primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 700 : 600, fontSize: '0.95rem', letterSpacing: -0.2 }} />
                      </ListItemButton>
                    </Link>
                  </ListItem>
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>

        <Box sx={{ p: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}`, bgcolor: alpha(theme.palette.action.hover, 0.02) }}>
           <Paper 
            elevation={0}
            sx={{ 
              p: 2, borderRadius: 5, bgcolor: alpha(theme.palette.background.paper, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              display: 'flex', alignItems: 'center', gap: 2,
              mb: 1
            }}
           >
              <Avatar 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                sx={{ width: 44, height: 44, borderRadius: 3, border: `2px solid ${theme.palette.primary.main}` }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ letterSpacing: -0.2 }}>{user?.email?.split('@')[0] || t('sidebar.adminUser')}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap sx={{ display: 'block', textTransform: 'uppercase' }}>{currentUserRole}</Typography>
              </Box>
           </Paper>
           <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" sx={{ flex: 1, borderRadius: 3, py: 1 }}><HelpOutline fontSize="small" /></IconButton>
              <IconButton size="small" onClick={handleLogout} sx={{ flex: 1, borderRadius: 3, py: 1, color: 'error.main' }}><Logout fontSize="small" /></IconButton>
           </Box>
        </Box>
      </Drawer>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 3 }, 
          bgcolor: theme.palette.background.default, 
          minHeight: '100vh', 
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          transition: 'padding 0.2s ease-in-out'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 70, md: 80 } }} />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Outlet />
        </motion.div>
      </Box>
    </Box>
  );
}
