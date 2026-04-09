import { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, TextField, InputAdornment, useTheme, alpha
} from '@mui/material';
import { 
  Search, People as Users, Star, AccessTime as Clock, 
  TrendingUp, VerifiedUser as ShieldCheck, Mail, CalendarMonth
} from '@mui/icons-material';
import { useSaaSStore, type Tenant } from '../../store/useSaaSStore';
import { motion } from 'framer-motion';

export default function SaaSDashboard() {
  const theme = useTheme();
  const { tenants } = useSaaSStore();
  const [search, setSearch] = useState('');

  const filteredTenants = useMemo(() => {
    return tenants.filter(t => 
      t.email.toLowerCase().includes(search.toLowerCase()) || 
      t.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [tenants, search]);

  const stats = [
    { label: 'Total Tenants', value: tenants.length, icon: Users, color: '#3b82f6' },
    { label: 'Trialing Users', value: tenants.filter(t => t.status === 'Trial').length, icon: Clock, color: '#f59e0b' },
    { label: 'Active Subs', value: tenants.filter(t => t.status === 'Active').length, icon: ShieldCheck, color: '#10b981' },
    { label: 'Expired', value: tenants.filter(t => t.status === 'Expired').length, icon: Star, color: '#ef4444' },
  ];

  const getStatusColor = (status: Tenant['status']) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Trial': return 'warning';
      case 'Expired': return 'error';
      default: return 'default';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Enterprise': return '#8b5cf6';
      case 'Pro': return '#3b82f6';
      case 'Standard': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} letterSpacing={-1} color="#0f172a">SaaS Registry</Typography>
        <Typography color="text.secondary">System-wide tenant monitoring and subscription lifecycle management.</Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(stat.color, 0.1), color: stat.color, width: 48, height: 48 }}>
                    <stat.icon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={800}>{stat.value}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{stat.label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Tenant List */}
      <Paper elevation={0} sx={{ borderRadius: 5, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight={800}>Registered Establishments</Typography>
          <TextField 
            size="small"
            placeholder="Search email or business..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 3, bgcolor: '#f1f5f9', border: 'none' }
            }}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Establishment</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Plan Tier</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Joined On</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Usage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTenants.map((tenant) => {
                const daysUsed = Math.floor((Date.now() - tenant.joinDate) / (24 * 60 * 60 * 1000));
                return (
                  <TableRow key={tenant.email}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800, fontSize: '0.875rem' }}>
                          {tenant.name.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700}>{tenant.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{tenant.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tenant.plan}
                        size="small"
                        sx={{ 
                          bgcolor: alpha(getPlanColor(tenant.plan), 0.1), 
                          color: getPlanColor(tenant.plan),
                          fontWeight: 800,
                          borderRadius: 2
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <CalendarMonth sx={{ fontSize: 16 }} />
                        <Typography variant="body2">{new Date(tenant.joinDate).toLocaleDateString()}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tenant.status}
                        size="small"
                        color={getStatusColor(tenant.status)}
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{daysUsed} days active</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center', color: 'text.secondary' }}>
                    No establishments matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
