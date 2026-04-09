import { useState } from 'react';
import { 
  Box, Typography, Paper, Chip, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Divider
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Receipt, Print, Refresh } from '@mui/icons-material';
import { useSalesStore, type SaleRecord } from '../../store/useSalesStore';

export default function SalesPage() {
  const { sales, refundSale } = useSalesStore();
  const [selectedTx, setSelectedTx] = useState<SaleRecord | null>(null);

  const columns: GridColDef[] = [
    { field: 'receiptNumber', headerName: 'Receipt #', width: 160, renderCell: (p) => <Typography fontWeight={700}>{p.value}</Typography> },
    { field: 'createdAt', headerName: 'Date / Time', width: 200, valueFormatter: (val) => new Date(val).toLocaleString() },
    { field: 'cashier', headerName: 'Cashier', width: 180 },
    { field: 'paymentMethod', headerName: 'Payment', width: 130, 
      renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'capitalize' }} />
    },
    { field: 'itemCount', headerName: 'Items', width: 90, type: 'number',
      valueGetter: (_val, row) => row.items?.length || 0,
    },
    { field: 'total', headerName: 'Total', width: 120, renderCell: (p) => <Typography fontWeight={800}>${p.value.toFixed(2)}</Typography> },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 140,
      renderCell: (p) => (
        <Chip 
          label={p.value} 
          size="small"
          color={p.value === 'Completed' ? 'success' : p.value === 'Refunded' ? 'error' : 'warning'}
          sx={{ fontWeight: 600, borderRadius: 2 }}
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (p) => (
        <Button 
          variant="outlined" 
          size="small" 
          startIcon={<Receipt />} 
          onClick={() => setSelectedTx(p.row as SaleRecord)}
          sx={{ borderRadius: 2 }}
        >
          View
        </Button>
      )
    }
  ];

  // Calculate summary stats
  const totalRevenue = sales.filter(s => s.status === 'Completed').reduce((sum, s) => sum + s.total, 0);
  const totalOrders = sales.length;
  const refundedCount = sales.filter(s => s.status === 'Refunded').length;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Sales Ledger</Typography>
          <Typography color="text.secondary">Comprehensive transaction history and receipt repository.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip label={`${totalOrders} Orders`} sx={{ fontWeight: 700 }} />
          <Chip label={`$${totalRevenue.toFixed(2)} Revenue`} color="success" sx={{ fontWeight: 700 }} />
          {refundedCount > 0 && <Chip label={`${refundedCount} Refunded`} color="error" sx={{ fontWeight: 700 }} />}
          <Button variant="contained" startIcon={<Refresh />} sx={{ borderRadius: 2 }}>Sync Latest</Button>
        </Box>
      </Box>

      {sales.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h6" color="text.secondary" fontWeight={700}>No Sales Recorded Yet</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Complete a transaction on the POS terminal to see it appear here.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ width: '100%', height: 'calc(100vh - 220px)', borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <DataGrid
            rows={sales}
            columns={columns}
            initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
            pageSizeOptions={[15, 30, 50]}
            disableRowSelectionOnClick
            sx={{ 
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', fontWeight: 800 }
            }}
          />
        </Paper>
      )}

      {/* Interactive Receipt Viewer */}
      <Dialog open={!!selectedTx} onClose={() => setSelectedTx(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" fontWeight={800}>Receipt Viewer</Typography>
          <Chip label={selectedTx?.status} color={selectedTx?.status === 'Completed' ? 'success' : 'error'} size="small" />
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: '#f8fafc' }}>
          <Paper elevation={0} sx={{ p: 4, border: '1px dashed #cbd5e1', borderRadius: 2, bgcolor: 'white', maxWidth: 380, mx: 'auto' }}>
            <Box textAlign="center" mb={3}>
              <Typography variant="h5" fontWeight={900}>SWIFTY POS</Typography>
              <Typography variant="body2" color="text.secondary">123 Coffee Lane, Brew City</Typography>
              <Typography variant="body2" color="text.secondary">Cashier: {selectedTx?.cashier}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedTx && new Date(selectedTx.createdAt).toLocaleString()}</Typography>
              <Typography variant="body2" fontWeight={700} mt={1}>{selectedTx?.receiptNumber}</Typography>
              {selectedTx?.customer && (
                <Typography variant="body2" color="primary.main" fontWeight={600}>Customer: {selectedTx.customer}</Typography>
              )}
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

            {/* Real line items from the sale */}
            <Box sx={{ mb: 2 }}>
              {selectedTx?.items.map((item, idx) => (
                <Grid container spacing={1} key={idx} sx={{ mb: 0.5 }}>
                  <Grid size={{ xs: 7 }}>
                    <Typography variant="body2" fontWeight={600}>{item.name} x{item.quantity}</Typography>
                  </Grid>
                  <Grid size={{ xs: 5 }} sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">${(item.price * item.quantity).toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              ))}
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

            <Box sx={{ mb: 1 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">${selectedTx?.subtotal.toFixed(2)}</Typography>
              </Box>
              {(selectedTx?.discount ?? 0) > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Discount:</Typography>
                  <Typography variant="body2" color="error.main">-${selectedTx?.discount.toFixed(2)}</Typography>
                </Box>
              )}
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Tax (GST 8%):</Typography>
                <Typography variant="body2">${selectedTx?.tax.toFixed(2)}</Typography>
              </Box>
            </Box>

            <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6" fontWeight={800}>TOTAL:</Typography>
              <Typography variant="h6" fontWeight={800}>${selectedTx?.total.toFixed(2)}</Typography>
            </Box>

            <Box display="flex" justifyContent="center" mt={2}>
              <Chip 
                label={`Paid via ${selectedTx?.paymentMethod}`} 
                variant="outlined" 
                sx={{ fontWeight: 700, textTransform: 'capitalize' }} 
              />
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setSelectedTx(null)} color="inherit">Close</Button>
          {selectedTx?.status === 'Completed' && (
            <Button 
              color="error" variant="outlined" sx={{ borderRadius: 2 }}
              onClick={() => {
                if (selectedTx) {
                  refundSale(selectedTx.id);
                  setSelectedTx({ ...selectedTx, status: 'Refunded' });
                }
              }}
            >
              Issue Refund
            </Button>
          )}
          <Button variant="contained" startIcon={<Print />} sx={{ borderRadius: 2, px: 3 }}>Print Duplicate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
