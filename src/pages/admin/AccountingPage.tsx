import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Add, AccountBalanceWallet, TrendingDown, TrendingUp } from '@mui/icons-material';
import React from 'react';

const columns: GridColDef[] = [
  { field: 'date', headerName: 'Date', width: 150 },
  { 
    field: 'type', 
    headerName: 'Type', 
    width: 120,
    renderCell: (params) => {
      const isExpense = params.value === 'EXPENSE' || params.value === 'DEBIT';
      return (
        <Box sx={{ 
          bgcolor: isExpense ? 'error.50' : 'success.50',
          color: isExpense ? 'error.main' : 'success.main',
          px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: '0.75rem'
        }}>
          {params.value}
        </Box>
      );
    }
  },
  { field: 'category', headerName: 'Category', width: 180 },
  { field: 'description', headerName: 'Description', flex: 1 },
  { 
    field: 'amount', 
    headerName: 'Amount', 
    width: 150, 
    type: 'number',
    valueFormatter: (value: number) => `$${Math.abs(value).toFixed(2)}`,
    renderCell: (params) => {
      const isExpense = params.row.type === 'EXPENSE' || params.row.type === 'DEBIT';
      return (
        <Typography fontWeight={700} color={isExpense ? 'error.main' : 'success.main'}>
          {isExpense ? '-' : '+'}${Math.abs(params.value as number).toFixed(2)}
        </Typography>
      )
    }
  },
];

const initialRows = [
  { id: 1, date: '2026-03-21', type: 'REVENUE', category: 'Daily Sales', description: 'POS Closing shift', amount: 1250.00 },
  { id: 2, date: '2026-03-21', type: 'EXPENSE', category: 'Utilities', description: 'Internet Bill', amount: 85.00 },
  { id: 3, date: '2026-03-20', type: 'CREDIT', category: 'Supplier Refund', description: 'Damaged goods return', amount: 120.00 },
  { id: 4, date: '2026-03-20', type: 'DEBIT', category: 'Inventory Purchase', description: 'Restock Coffee Beans', amount: 450.00 },
];

export default function AccountingPage() {
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState(initialRows);
  const [tabValue, setTabValue] = React.useState(0);
  
  const [newTx, setNewTx] = React.useState({ type: 'EXPENSE', category: '', description: '', amount: '' });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSave = () => {
    const tx = {
      id: rows.length + 1,
      date: new Date().toISOString().split('T')[0],
      type: newTx.type,
      category: newTx.category,
      description: newTx.description,
      amount: parseFloat(newTx.amount)
    };
    setRows([tx, ...rows]);
    handleClose();
    setNewTx({ type: 'EXPENSE', category: '', description: '', amount: '' });
  };

  const filteredRows = React.useMemo(() => {
    if (tabValue === 1) return rows.filter(r => r.type === 'REVENUE' || r.type === 'CREDIT');
    if (tabValue === 2) return rows.filter(r => r.type === 'EXPENSE' || r.type === 'DEBIT');
    return rows;
  }, [rows, tabValue]);

  const totalRevenue = rows.filter(r => r.type === 'REVENUE' || r.type === 'CREDIT').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = rows.filter(r => r.type === 'EXPENSE' || r.type === 'DEBIT').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalRevenue - totalExpense;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Accounting & Ledger</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpen} sx={{ borderRadius: 2, px: 3 }}>
          New Transaction
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main', width: 56, height: 56 }}>
                <AccountBalanceWallet fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Net Balance</Typography>
                <Typography variant="h4" fontWeight={800} color={netBalance >= 0 ? 'success.main' : 'error.main'}>
                  ${netBalance.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ bgcolor: 'success.50', color: 'success.main', width: 56, height: 56 }}>
                <TrendingUp fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Inflow (Credit/Rev)</Typography>
                <Typography variant="h4" fontWeight={800}>${totalRevenue.toFixed(2)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ bgcolor: 'error.50', color: 'error.main', width: 56, height: 56 }}>
                <TrendingDown fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Outflow (Debit/Exp)</Typography>
                <Typography variant="h4" fontWeight={800}>${totalExpense.toFixed(2)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, bgcolor: 'background.paper' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="All Transactions" sx={{ fontWeight: 600 }} />
            <Tab label="Inflow" sx={{ fontWeight: 600, color: 'success.main' }} />
            <Tab label="Outflow" sx={{ fontWeight: 600, color: 'error.main' }} />
          </Tabs>
        </Box>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{ 
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'background.paper',
                fontWeight: 700
              }
            }}
          />
        </Box>
      </Paper>

      {/* Transaction Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Manual Transaction</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Transaction Type</InputLabel>
              <Select
                value={newTx.type}
                label="Transaction Type"
                onChange={(e) => setNewTx({...newTx, type: e.target.value})}
              >
                <MenuItem value="EXPENSE">Expense (e.g. Rent, Utilities)</MenuItem>
                <MenuItem value="DEBIT">Debit (e.g. Payables, Asset purchase)</MenuItem>
                <MenuItem value="CREDIT">Credit (e.g. Receivables, Loan)</MenuItem>
                <MenuItem value="REVENUE">Manual Revenue (e.g. External sales)</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              fullWidth 
              label="Category" 
              placeholder="e.g. Office Supplies"
              value={newTx.category}
              onChange={(e) => setNewTx({...newTx, category: e.target.value})} 
            />
            <TextField 
              fullWidth 
              label="Amount" 
              type="number" 
              slotProps={{ input: { startAdornment: '$' } }}
              value={newTx.amount}
              onChange={(e) => setNewTx({...newTx, amount: e.target.value})} 
            />
            <TextField 
              fullWidth 
              label="Description" 
              multiline 
              rows={2}
              value={newTx.description}
              onChange={(e) => setNewTx({...newTx, description: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!newTx.amount || !newTx.category} sx={{ px: 4, borderRadius: 2 }}>
            Save Transaction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
