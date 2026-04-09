import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardActionArea,
  Button,
  Chip,
  Avatar,
  useTheme,
  alpha,
  Paper,
  useMediaQuery
} from '@mui/material';
import { 
  PointOfSale, 
  Inventory, 
  Settings,
  TrendingUp,
  TrendingDown,
  Add,
  Warning,
  ArrowForward,
  FilterList,
  Storefront
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion } from 'framer-motion';

// --- MOCK DASHBOARD DATA UPDATED FOR CAFE ---
const SALES_DATA = [
  { day: 'Mon', revenue: 4000, profit: 2400 },
  { day: 'Tue', revenue: 3000, profit: 1398 },
  { day: 'Wed', revenue: 2000, profit: 9800 },
  { day: 'Thu', revenue: 2780, profit: 3908 },
  { day: 'Fri', revenue: 1890, profit: 4800 },
  { day: 'Sat', revenue: 2390, profit: 3800 },
  { day: 'Sun', revenue: 3490, profit: 4300 },
];

const STOCK_DISTRIBUTION = [
  { name: 'Coffee', value: 400, color: '#E07B39' },
  { name: 'Tea', value: 300, color: '#10b981' },
  { name: 'Pastries', value: 300, color: '#F59E0B' },
  { name: 'Equipment', value: 200, color: '#6B7280' },
];

const MODULE_LAUNCHPAD = [
  { title: 'POS Terminal', sub: 'Primary Sales Console', icon: <PointOfSale fontSize="large" />, path: '/pos', color: '#E07B39', count: 'Active' },
  { title: 'Category Registry', sub: 'Organize Stock Groups', icon: <Inventory fontSize="large" />, path: '/admin/inventory/categories', color: '#B05D28', count: '12 Groups' },
  { title: 'Inventory Hub', sub: 'All SKU Management', icon: <Storefront fontSize="large" />, path: '/admin/inventory', color: '#10b981', count: '142 Items' },
  { title: 'Settings', sub: 'System Configuration', icon: <Settings fontSize="large" />, path: '/admin/settings', color: '#6B7280', count: 'v1.5' },
];

const KPI_STATS = [
  { title: 'Daily Revenue', value: '$2,459', sub: '+12.5% Today', isUp: true, color: '#E07B39' },
  { title: 'Total Orders', value: '42', sub: 'Cafe Standard', isUp: true, color: '#B05D28' },
  { title: 'Stock Health', value: '94%', sub: 'Healthy Mix', isUp: true, color: '#10b981' },
  { title: 'Low Inventory', value: '12', sub: 'Restock Soon', isUp: false, color: '#ef4444' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4 } }}>
      
      {/* 1. HERO HEADER - Refined */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'flex-end' }, 
        gap: 3,
        mb: 6 
      }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1, mb: 0.5, color: 'text.primary', fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
            Analytics Overview
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500} sx={{ letterSpacing: -0.2, fontSize: { xs: '0.9rem', md: '1rem' } }}>
            Performance insights for <span style={{ color: theme.palette.primary.main, fontWeight: 700 }}>Swifty POS</span>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="outlined" startIcon={<FilterList />} sx={{ borderRadius: 3, fontWeight: 700, px: 2.5, py: 1, flex: { xs: 1, sm: 'none' } }}>Export</Button>
          <Button 
            variant="contained" startIcon={<Add />} 
            onClick={() => navigate('/admin/inventory/product/new')} 
            sx={{ borderRadius: 3, fontWeight: 700, px: 3, py: 1.2, boxShadow: `0 6px 16px -4px ${alpha(theme.palette.primary.main, 0.3)}`, flex: { xs: 1, sm: 'none' } }}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* 2. KPI WIDGETS - HIGH RADIUS */}
      <Grid container spacing={{ xs: 2.5, md: 4 }} sx={{ mb: 8 }}>
        {KPI_STATS.map((stat, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ delay: idx * 0.1 }}>
              <Card 
                elevation={0}
                sx={{ 
                  p: { xs: 2.5, md: 3 }, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: 'background.paper',
                  position: 'relative', overflow: 'hidden',
                  transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[2] }
                }}
              >
                <Box sx={{ position: 'absolute', top: -10, right: -10, p: 3, bgcolor: alpha(stat.color, 0.04), borderRadius: '50%' }}>
                   <Box sx={{ opacity: 0.1, color: stat.color }}>
                     {stat.isUp ? <TrendingUp /> : <TrendingDown />}
                   </Box>
                </Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 0.5, letterSpacing: 1, fontSize: '0.7rem' }}>{stat.title}</Typography>
                <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: -1, mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>{stat.value}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <Chip 
                    label={stat.sub} size="small" 
                    sx={{ fontWeight: 800, borderRadius: 2, bgcolor: alpha(stat.color, 0.1), color: stat.color, border: 'none', height: 22, fontSize: '0.7rem' }}
                   />
                </Box>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* 3. CORE ANALYTICS & HUB */}
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {/* Sales Chart - Refined */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: 'background.paper', minHeight: { xs: 350, md: 450 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, md: 5 } }}>
               <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.5 }}>Revenue Performance</Typography>
               <Button size="small" color="primary" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'inline-flex' } }} onClick={() => navigate('/admin/reports')}>Detailed Insights <ArrowForward sx={{ ml: 1, fontSize: 16 }} /></Button>
            </Box>
            <Box sx={{ width: '100%', height: { xs: 250, md: 350 } }}>
               <ResponsiveContainer>
                  <AreaChart data={SALES_DATA}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.05)} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontWeight: 800, fontSize: 13, fill: theme.palette.text.secondary }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontWeight: 800, fontSize: 13, fill: theme.palette.text.secondary }} />
                    <Tooltip contentStyle={{ borderRadius: 20, border: 'none', boxShadow: theme.shadows[10], fontWeight: 800 }} />
                    <Area type="monotone" dataKey="revenue" stroke={theme.palette.primary.main} strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
               </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Launchpad - Terracotta Themed */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
            <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -1 }}>Quick Launchpad</Typography>
            {MODULE_LAUNCHPAD.map((module, idx) => (
              <Card 
                key={idx} elevation={0} 
                sx={{ 
                  borderRadius: 5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  '&:hover': { transform: { xs: 'none', md: 'translateX(12px)' }, borderColor: module.color, bgcolor: alpha(module.color, 0.02) }
                }}
              >
                <CardActionArea onClick={() => navigate(module.path)} sx={{ p: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
                    <Box sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 4, bgcolor: alpha(module.color, 0.1), color: module.color, display: 'flex' }}>{module.icon}</Box>
                    <Box>
                      <Typography fontWeight={900} variant="subtitle1" sx={{ fontSize: { xs: '0.95rem', md: '1rem' } }}>{module.title}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{module.sub}</Typography>
                    </Box>
                  </Box>
                  <Chip label={module.count} size="small" sx={{ fontWeight: 900, bgcolor: 'background.default', borderRadius: 2, display: { xs: 'none', sm: 'inline-flex' } }} />
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* 4. STOCK HEALTH & LIVE FEED */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
         <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 7, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, height: '100%' }}>
               <Typography variant="h5" fontWeight={900} mb={3} sx={{ letterSpacing: -1 }}>Inventory Balance</Typography>
               <Box sx={{ height: { xs: 280, md: 320 } }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={STOCK_DISTRIBUTION} innerRadius={isMobile ? 70 : 90} outerRadius={isMobile ? 100 : 125} paddingAngle={8} dataKey="value" stroke="none">
                        {STOCK_DISTRIBUTION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      {!isMobile && <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 800, paddingTop: 20 }} />}
                    </PieChart>
                  </ResponsiveContainer>
               </Box>
            </Paper>
         </Grid>

         <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 7, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                  <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -1 }}>Live Activity Feed</Typography>
                  <Chip label="Pulse" color="primary" size="small" sx={{ fontWeight: 900, borderRadius: 2, display: { xs: 'none', sm: 'inline-flex' } }} />
               </Box>
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { user: 'Hlaing Min Oo', task: 're-stocked Italian Roast', time: 'Just now', icon: <Inventory /> },
                    { user: 'System Bot', task: 'flagged 8 items for urgent reorder', time: '12m ago', icon: <Warning /> },
                    { user: 'Kitchen Display', task: 'processed 5 breakfast sets', time: '28m ago', icon: <PointOfSale /> },
                  ].map((row, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                       <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', width: 48, height: 48, borderRadius: 4 }}>{row.icon}</Avatar>
                       <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight={900}>
                            {row.user} <span style={{ fontWeight: 500, color: theme.palette.text.secondary }}>{row.task}</span>
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700 }}>{row.time}</Typography>
                       </Box>
                    </Box>
                  ))}
               </Box>
            </Paper>
         </Grid>
      </Grid>
    </Box>
  );
}
