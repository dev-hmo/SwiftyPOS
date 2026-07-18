import { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, TextField, InputAdornment, IconButton,
  Tooltip, Select, MenuItem, FormControl, InputLabel, useTheme, alpha
} from '@mui/material';
import {
  Search, CalendarMonth, Visibility, Edit, Block, PlayArrow,
  FilterList
} from '@mui/icons-material';
import { useSaaSStore } from '../../store/useSaaSStore';
import type { CustomerFilters, CustomerFilterPlan, CustomerFilterStatus, CustomerFilterDateRange } from '../../types/superadmin';
import CustomerDetailDrawer from './CustomerDetailDrawer';

const PLAN_COLORS: Record<string, string> = {
  enterprise: '#8b5cf6', pro: '#3b82f6', standard: '#10b981', free: '#64748b',
};

function getRenewalDate(joinTs: number): Date {
  const d = new Date(joinTs);
  const now = new Date();
  while (d <= now) d.setMonth(d.getMonth() + 1);
  return d;
}

export default function CustomerManagementTab() {
  const theme = useTheme();
  const { tenants, suspendTenant, reactivateTenant } = useSaaSStore();
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '', plan: 'all', status: 'all', registrationDate: 'all', renewalDate: 'all',
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [now] = useState(() => Date.now());

  const filtered = useMemo(() => {
    let result = [...tenants];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
    }
    if (filters.plan !== 'all') result = result.filter((t) => t.plan === filters.plan);
    if (filters.status !== 'all') result = result.filter((t) => t.status === filters.status);
    if (filters.registrationDate !== 'all') {
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const cutoff = now - daysMap[filters.registrationDate] * 86400000;
      result = result.filter((t) => t.joinDate >= cutoff);
    }
    if (filters.renewalDate !== 'all') {
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const upper = now + daysMap[filters.renewalDate] * 86400000;
      result = result.filter((t) => getRenewalDate(t.joinDate).getTime() <= upper);
    }
    return result;
  }, [tenants, filters, now]);

  const handleView = (id: string) => { setSelectedId(id); setDrawerOpen(true); };

  return (
    <Paper elevation={0} sx={{ borderRadius: 5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight={800}>Customers ({filtered.length})</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search name, email..."
            value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
            sx={{ width: { xs: '100%', sm: 260 }, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.05) } }}
          />
          <Tooltip title="Advanced Filters">
            <IconButton onClick={() => setShowFilters(!showFilters)} sx={{ bgcolor: showFilters ? alpha(theme.palette.primary.main, 0.1) : 'transparent' }}>
              <FilterList fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filter Row */}
      {showFilters && (
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`, bgcolor: alpha(theme.palette.action.hover, 0.02) }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Plan</InputLabel>
            <Select label="Plan" value={filters.plan} onChange={(e) => setFilters((f) => ({ ...f, plan: e.target.value as CustomerFilterPlan }))}>
              <MenuItem value="all">All Plans</MenuItem>
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="standard">Standard</MenuItem>
              <MenuItem value="pro">Pro</MenuItem>
              <MenuItem value="enterprise">Enterprise</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as CustomerFilterStatus }))}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Trial">Trial</MenuItem>
              <MenuItem value="Expired">Expired</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Registered</InputLabel>
            <Select label="Registered" value={filters.registrationDate} onChange={(e) => setFilters((f) => ({ ...f, registrationDate: e.target.value as CustomerFilterDateRange }))}>
              <MenuItem value="all">Any Time</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Renewal</InputLabel>
            <Select label="Renewal" value={filters.renewalDate} onChange={(e) => setFilters((f) => ({ ...f, renewalDate: e.target.value as CustomerFilterDateRange }))}>
              <MenuItem value="all">Any Time</MenuItem>
              <MenuItem value="7d">Within 7 Days</MenuItem>
              <MenuItem value="30d">Within 30 Days</MenuItem>
              <MenuItem value="90d">Within 90 Days</MenuItem>
              <MenuItem value="1y">Within 1 Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.action.hover, 0.03) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Registered</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Renewal</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: alpha(PLAN_COLORS[t.plan] || '#64748b', 0.12), color: PLAN_COLORS[t.plan] || '#64748b', fontWeight: 800, fontSize: '0.75rem', width: 36, height: 36 }}>
                      {t.name.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700} variant="body2">{t.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={t.plan} size="small" sx={{ bgcolor: alpha(PLAN_COLORS[t.plan] || '#64748b', 0.1), color: PLAN_COLORS[t.plan] || '#64748b', fontWeight: 800, borderRadius: 2, textTransform: 'capitalize', fontSize: '0.75rem' }} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                    <CalendarMonth sx={{ fontSize: 14 }} />
                    <Typography variant="body2" fontWeight={600}>{new Date(t.joinDate).toLocaleDateString()}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {getRenewalDate(t.joinDate).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={t.status} size="small"
                    color={t.status === 'Active' ? 'success' : t.status === 'Trial' ? 'warning' : t.status === 'Suspended' ? 'error' : 'default'}
                    sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.75rem' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleView(t.id)} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleView(t.id)} sx={{ color: 'text.secondary', bgcolor: alpha(theme.palette.action.hover, 0.06) }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {t.status === 'Suspended' ? (
                      <Tooltip title="Reactivate">
                        <IconButton size="small" onClick={() => reactivateTenant(t.id)} sx={{ color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.06) }}>
                          <PlayArrow fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : t.status !== 'Expired' ? (
                      <Tooltip title="Suspend">
                        <IconButton size="small" onClick={() => suspendTenant(t.id)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.06) }}>
                          <Block fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 10, textAlign: 'center', color: 'text.secondary' }}>No customers found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomerDetailDrawer open={drawerOpen} tenantId={selectedId} onClose={() => { setDrawerOpen(false); setSelectedId(null); }} />
    </Paper>
  );
}
