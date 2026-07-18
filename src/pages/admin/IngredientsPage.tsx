import { useState } from 'react';
import {
  Box, Typography, Paper, Button, IconButton, Chip, alpha, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, InputLabel, FormControl, Snackbar, Alert,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Add, Download, Edit, Delete, Warning } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useInventoryStore, type Ingredient } from '../../store/useInventoryStore';

const UNIT_OPTIONS = ['g', 'kg', 'ml', 'L', 'pcs'];

export default function IngredientsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { ingredients, addIngredient, deleteIngredient } = useInventoryStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false, msg: '', severity: 'success',
  });

  // New ingredient form state
  const [form, setForm] = useState({
    name: '',
    sku: '',
    unit: 'g',
    current_stock: 0,
    cost_per_unit: 0,
    min_stock_alert: 10,
  });

  const resetForm = () => setForm({ name: '', sku: '', unit: 'g', current_stock: 0, cost_per_unit: 0, min_stock_alert: 10 });

  const lowStockItems = ingredients.filter((i) => i.stock_quantity <= i.low_stock_threshold);

  const handleCreate = () => {
    if (!form.name.trim() || !form.sku.trim()) {
      setSnack({ open: true, msg: 'Name and SKU are required', severity: 'error' });
      return;
    }
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      sku: form.sku.trim(),
      name: form.name.trim(),
      unit: form.unit,
      stock_quantity: Math.max(0, form.current_stock),
      cost_per_unit: Math.max(0, form.cost_per_unit),
      low_stock_threshold: Math.max(0, form.min_stock_alert),
    };
    addIngredient(newIng);
    resetForm();
    setCreateOpen(false);
    setSnack({ open: true, msg: `${newIng.name} created`, severity: 'success' });
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(ingredients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ingredients');
    XLSX.writeFile(wb, 'ingredients_export.xlsx');
  };

  const columns: GridColDef[] = [
    { field: 'sku', headerName: 'SKU', width: 140, flex: 0.5 },
    {
      field: 'name', headerName: 'Ingredient Name', minWidth: 220, flex: 1.5,
      renderCell: (p) => <Typography fontWeight={700}>{p.value}</Typography>,
    },
    { field: 'unit', headerName: 'Unit', width: 90 },
    {
      field: 'cost_per_unit', headerName: 'Cost / Unit', width: 120, type: 'number',
      valueFormatter: (value) => `$${(value as number).toFixed(2)}`,
    },
    {
      field: 'stock_quantity',
      headerName: 'Current Stock',
      width: 160,
      renderCell: (params) => {
        const isLow = params.row.stock_quantity <= params.row.low_stock_threshold;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={800} color={isLow ? 'error.main' : 'success.main'}>
              {params.value} {params.row.unit}
            </Typography>
            {isLow && <Chip icon={<Warning sx={{ fontSize: 14 }} />} label="LOW" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />}
          </Box>
        );
      }
    },
    {
      field: 'low_stock_threshold', headerName: 'Alert Level', width: 110, type: 'number',
      valueFormatter: (value, row) => `${value} ${row.unit}`,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
          <IconButton size="small" onClick={() => navigate(`/admin/inventory/ingredients/${params.row.id}`)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => deleteIngredient(params.row.id)}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Raw Ingredients</Typography>
          <Typography color="text.secondary">
            Manage raw materials and stock levels
            {lowStockItems.length > 0 && (
              <Chip
                icon={<Warning sx={{ fontSize: 14 }} />}
                label={`${lowStockItems.length} low-stock alert${lowStockItems.length > 1 ? 's' : ''}`}
                color="error"
                size="small"
                sx={{ ml: 1.5, fontWeight: 700, height: 24 }}
              />
            )}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExport} sx={{ borderRadius: 3 }}>Export</Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { resetForm(); setCreateOpen(true); }}
            sx={{ borderRadius: 3, px: 3 }}
          >
            Add Ingredient
          </Button>
        </Box>
      </Box>

      {/* DataGrid */}
      <Paper elevation={0} sx={{ flex: 1, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}>
          <DataGrid
            rows={ingredients}
            columns={columns}
            initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
            pageSizeOptions={[15, 25, 50]}
            disableRowSelectionOnClick
            getRowClassName={(params) =>
              params.row.stock_quantity <= params.row.low_stock_threshold ? 'low-stock-row' : ''
            }
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.secondary.main, 0.04), fontWeight: 800 },
              '& .low-stock-row': { bgcolor: alpha(theme.palette.error.main, 0.04) },
              '& .low-stock-row:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
            }}
          />
        </Box>
      </Paper>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.3rem' }}>New Raw Ingredient</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              fullWidth label="Ingredient Name" autoFocus
              value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <TextField
              fullWidth label="SKU (Reference Code)"
              value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: 700 }}>Unit of Measurement</InputLabel>
              <Select
                value={form.unit} label="Unit of Measurement"
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                sx={{ borderRadius: 3 }}
              >
                {UNIT_OPTIONS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </Select>
            </FormControl>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <TextField
                fullWidth label="Initial Stock" type="number"
                value={form.current_stock} onChange={(e) => setForm((p) => ({ ...p, current_stock: parseFloat(e.target.value) || 0 }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <TextField
                fullWidth label="Low Stock Alert Level" type="number"
                value={form.min_stock_alert} onChange={(e) => setForm((p) => ({ ...p, min_stock_alert: parseFloat(e.target.value) || 0 }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>
            <TextField
              fullWidth label="Cost per Unit" type="number"
              value={form.cost_per_unit} onChange={(e) => setForm((p) => ({ ...p, cost_per_unit: parseFloat(e.target.value) || 0 }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ fontWeight: 700, borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 3, fontWeight: 700 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
