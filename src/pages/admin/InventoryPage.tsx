import { Box, Typography, Paper, Button, IconButton, Chip, alpha, useTheme } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Add, Download, Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useLanguage } from '../../i18n/LanguageContext';

export default function InventoryPage() {
  const theme = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { products, deleteProduct } = useInventoryStore();

  const columns: GridColDef[] = [
    { field: 'sku', headerName: t('inventory.col.sku'), width: 120, flex: 0.5 },
    { field: 'name', headerName: t('inventory.col.name'), minWidth: 250, flex: 1.5, renderCell: (p) => <Typography fontWeight={700}>{p.value}</Typography> },
    { field: 'category', headerName: t('inventory.col.category'), width: 160, flex: 0.8 },
    { field: 'price', headerName: t('inventory.col.price'), width: 120, type: 'number', valueFormatter: (value) => `$${(value as number).toFixed(2)}` },
    {
      field: 'stock',
      headerName: t('inventory.col.stock'),
      width: 200,
      renderCell: (params) => {
        const hasRecipe = params.row.recipe && params.row.recipe.length > 0;
        if (hasRecipe) {
          return <Chip label={t('inventory.recipeBased')} size="small" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', fontWeight: 600 }} />;
        }
        return (
          <Typography fontWeight={700} color={params.row.stock_quantity < 20 ? 'error.main' : 'success.main'}>
            {params.row.stock_quantity} {t('inventory.inStock')}
          </Typography>
        );
      }
    },
    {
      field: 'actions',
      headerName: t('inventory.col.actions'),
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
          <IconButton size="small" onClick={() => navigate(`/admin/inventory/product/${params.row.id}`)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => deleteProduct(params.row.id)}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'products_export.xlsx');
  };

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{t('inventory.title')}</Typography>
          <Typography color="text.secondary">{t('inventory.subtitle')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={exportToExcel} sx={{ borderRadius: 3 }}>{t('common.export')}</Button>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => navigate('/admin/inventory/product/new')} 
            sx={{ borderRadius: 3, px: 3 }}
          >
            {t('inventory.addProduct')}
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ flex: 1, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}>
          <DataGrid
            rows={products}
            columns={columns}
            initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
            pageSizeOptions={[15, 25, 50]}
            disableRowSelectionOnClick
            sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.primary.main, 0.04), fontWeight: 800 } }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
