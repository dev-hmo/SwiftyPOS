import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Chip, Button, TextField,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { 
  Timeline, DeleteSweep, FilterList,
  Login, Logout, ShoppingCart, Undo, 
  Add, Edit, Delete, Settings, PauseCircle, PlayCircle
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useActivityStore, type ActivityAction } from '../../store/useActivityStore';

const ACTION_CONFIG: Record<ActivityAction, { color: string; icon: React.ReactElement; label: string }> = {
  LOGIN: { color: '#10b981', icon: <Login fontSize="small" />, label: 'Login' },
  LOGOUT: { color: '#6b7280', icon: <Logout fontSize="small" />, label: 'Logout' },
  SALE_COMPLETED: { color: '#E07B39', icon: <ShoppingCart fontSize="small" />, label: 'Sale' },
  REFUND: { color: '#ef4444', icon: <Undo fontSize="small" />, label: 'Refund' },
  PRODUCT_ADDED: { color: '#3b82f6', icon: <Add fontSize="small" />, label: 'Product Added' },
  PRODUCT_UPDATED: { color: '#8b5cf6', icon: <Edit fontSize="small" />, label: 'Product Updated' },
  PRODUCT_DELETED: { color: '#ef4444', icon: <Delete fontSize="small" />, label: 'Product Deleted' },
  SETTINGS_CHANGED: { color: '#f59e0b', icon: <Settings fontSize="small" />, label: 'Settings' },
  ORDER_HELD: { color: '#6366f1', icon: <PauseCircle fontSize="small" />, label: 'Order Held' },
  ORDER_RECALLED: { color: '#14b8a6', icon: <PlayCircle fontSize="small" />, label: 'Order Recalled' },
};

export default function ActivityLogPage() {
  const theme = useTheme();
  const { entries, clearLog } = useActivityStore();
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchUser, setSearchUser] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const actionMatch = filterAction === 'ALL' || e.action === filterAction;
      const userMatch = !searchUser || e.userId.toLowerCase().includes(searchUser.toLowerCase());
      return actionMatch && userMatch;
    });
  }, [entries, filterAction, searchUser]);

  const columns: GridColDef[] = [
    {
      field: 'action',
      headerName: 'Action',
      width: 180,
      flex: 0.8,
      renderCell: (params) => {
        const config = ACTION_CONFIG[params.value as ActivityAction];
        return (
          <Chip
            icon={config ? config.icon : undefined}
            label={config?.label || params.value}
            size="small"
            sx={{
              bgcolor: alpha(config?.color || '#666', 0.1),
              color: config?.color || '#666',
              fontWeight: 700,
              borderRadius: 2,
              '& .MuiChip-icon': { color: config?.color },
            }}
          />
        );
      },
    },
    { field: 'details', headerName: 'Details', minWidth: 300, flex: 2 },
    { field: 'userId', headerName: 'User', width: 150, flex: 0.5 },
    {
      field: 'timestamp',
      headerName: 'Time',
      width: 200,
      flex: 0.8,
      valueFormatter: (val) => new Date(val as number).toLocaleString(),
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Timeline color="primary" /> Activity Log
          </Typography>
          <Typography color="text.secondary">
            Audit trail of all system actions. Last {entries.length} entries.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteSweep />}
          onClick={clearLog}
          disabled={entries.length === 0}
          sx={{ borderRadius: 3 }}
        >
          Clear Log
        </Button>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <FilterList color="action" />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Action Type</InputLabel>
          <Select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            label="Action Type"
            sx={{ borderRadius: 3 }}
          >
            <MenuItem value="ALL">All Actions</MenuItem>
            {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
              <MenuItem key={key} value={key}>
                {cfg.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="Search by user..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          sx={{ minWidth: 200, maxWidth: 350, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
      </Paper>

      {/* DataGrid */}
      <Paper
        sx={{
          width: '100%',
          height: 'calc(100vh - 320px)',
          borderRadius: 4,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <DataGrid
          rows={filteredEntries}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.primary.main, 0.03), fontWeight: 800 },
          }}
        />
      </Paper>
    </Box>
  );
}
