import { useEffect, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Grid, Card, CardContent,
  Avatar, useTheme, alpha, CircularProgress, Alert
} from '@mui/material';
import {
  People as Users, AccessTime as Clock,
  VerifiedUser as ShieldCheck, Error as ErrorIcon,
  Block, HourglassEmpty, CheckCircle
} from '@mui/icons-material';
import { useSaaSStore } from '../../store/useSaaSStore';
import { motion } from 'framer-motion';
import CustomerManagementTab from '../../components/super-admin/CustomerManagementTab';
import PlanUpgradeApprovalsTab from '../../components/super-admin/PlanUpgradeApprovalsTab';

export default function SuperAdminDashboard() {
  const theme = useTheme();
  const { tenants, upgradeRequests, isLoading, error, fetchTenants, fetchUpgradeRequests } = useSaaSStore();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchTenants();
    fetchUpgradeRequests();
  }, [fetchTenants, fetchUpgradeRequests]);

  if (isLoading && tenants.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" icon={<ErrorIcon />}>{error}</Alert>
      </Box>
    );
  }

  const stats = [
    { label: 'Total Customers', value: tenants.length, icon: Users, color: '#3b82f6' },
    { label: 'Trialing', value: tenants.filter((t) => t.status === 'Trial').length, icon: Clock, color: '#f59e0b' },
    { label: 'Active', value: tenants.filter((t) => t.status === 'Active').length, icon: ShieldCheck, color: '#10b981' },
    { label: 'Suspended', value: tenants.filter((t) => t.status === 'Suspended').length, icon: Block, color: '#ef4444' },
    { label: 'Pending Upgrades', value: upgradeRequests.filter((r) => r.status === 'pending').length, icon: HourglassEmpty, color: '#8b5cf6' },
    { label: 'Approved', value: upgradeRequests.filter((r) => r.status === 'approved').length, icon: CheckCircle, color: '#06b6d4' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} letterSpacing={-1}>Super Admin Dashboard</Typography>
        <Typography color="text.secondary">Manage customers, approve plan upgrades, and monitor platform health.</Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {stats.map((stat, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 2 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: '16px !important' }}>
                  <Avatar sx={{ bgcolor: alpha(stat.color, 0.1), color: stat.color, width: 40, height: 40 }}>
                    <stat.icon sx={{ fontSize: 20 }} />
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

      {/* Tabs */}
      <Tabs
        value={activeTab} onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3, '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', fontSize: '0.95rem' },
          '& .MuiTabs-indicator': { height: 3, borderRadius: 2 }
        }}
      >
        <Tab label={`Customer Management (${tenants.length})`} />
        <Tab label={`Plan Upgrade Approvals (${upgradeRequests.filter((r) => r.status === 'pending').length})`} />
      </Tabs>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {activeTab === 0 && <CustomerManagementTab />}
        {activeTab === 1 && <PlanUpgradeApprovalsTab />}
      </motion.div>
    </Box>
  );
}
