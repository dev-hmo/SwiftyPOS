import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Button, IconButton, Tabs, Tab, Chip, alpha, useTheme
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Add, Download, Edit, Delete, Restaurant, Kitchen } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useInventoryStore } from '../../store/useInventoryStore';
import PremiumFeatureGate from '../../components/PremiumFeatureGate';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`inventory-tabpanel-${index}`} aria-labelledby={`inventory-tab-${index}`} {...other} style={{ height: '100%' }}>
      {value === index && (<Box sx={{ height: '100%', pt: 3 }}>{children}</Box>)}
    </div>
  );
}

export default function InventoryPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const { products, ingredients, deleteProduct, deleteIngredient } = useInventoryStore();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const productColumns: GridColDef[] = [
    { field: 'sku', headerName: 'SKU', width: 120, flex: 0.5 },
    { field: 'name', headerName: 'Product Name', minWidth: 250, flex: 1.5, renderCell: (p) => <Typography fontWeight={700}>{p.value}</Typography> },
    { field: 'category', headerName: 'Category', width: 160, flex: 0.8 },
    { field: 'price', headerName: 'Price', width: 120, type: 'number', valueFormatter: (value) => `$${(value as number).toFixed(2)}` },
    {
      field: 'stock',
      headerName: 'Stock tracking',
      width: 180,
      renderCell: (params) => {
        const hasRecipe = params.row.recipe && params.row.recipe.length > 0;
        if (hasRecipe) {
          return <Chip label="Recipe Based (Made to Order)" size="small" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', fontWeight: 600 }} />;
        }
        return (
          <Typography fontWeight={700} color={params.row.stock_quantity < 20 ? 'error.main' : 'success.main'}>
            {params.row.stock_quantity} in stock
          </Typography>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
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

  const ingredientColumns: GridColDef[] = [
    { field: 'sku', headerName: 'SKU', width: 140, flex: 0.5 },
    { field: 'name', headerName: 'Ingredient Name', minWidth: 250, flex: 1.5, renderCell: (p) => <Typography fontWeight={700}>{p.value}</Typography> },
    { field: 'unit', headerName: 'Unit', width: 100 },
    { field: 'cost_per_unit', headerName: 'Cost/Unit', width: 130, type: 'number', valueFormatter: (value) => `$${(value as number).toFixed(2)}` },
    { 
      field: 'stock_quantity', 
      headerName: 'Stock Level', 
      width: 160, 
      renderCell: (params) => {
        const isLow = params.row.stock_quantity <= params.row.low_stock_threshold;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight={800} color={isLow ? 'error.main' : 'success.main'}>
              {params.value} {params.row.unit}
            </Typography>
            {isLow && <Chip label="LOW" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />}
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
          <IconButton size="small" onClick={() => navigate(`/admin/inventory/ingredient/${params.row.id}`)}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => deleteIngredient(params.row.id)}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  const exportToExcel = () => {
    const data = tabValue === 0 ? products : ingredients;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tabValue === 0 ? "Products" : "Ingredients");
    XLSX.writeFile(wb, tabValue === 0 ? "products_export.xlsx" : "ingredients_export.xlsx");
  };

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Inventory Management</Typography>
          <Typography color="text.secondary">Manage your sellable products and raw ingredients</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={exportToExcel} sx={{ borderRadius: 3 }}>Export</Button>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => navigate(tabValue === 0 ? '/admin/inventory/product/new' : '/admin/inventory/ingredient/new')} 
            sx={{ borderRadius: 3, px: 3 }}
          >
            Add {tabValue === 0 ? 'Product' : 'Ingredient'}
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ flex: 1, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '1rem', textTransform: 'none', minHeight: 60 } }}>
            <Tab icon={<Restaurant sx={{ mr: 1 }} />} iconPosition="start" label="Finished Products" />
            <Tab icon={<Kitchen sx={{ mr: 1 }} />} iconPosition="start" label="Raw Ingredients" />
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}>
          <CustomTabPanel value={tabValue} index={0}>
            <DataGrid
              rows={products}
              columns={productColumns}
              initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
              pageSizeOptions={[15, 25, 50]}
              disableRowSelectionOnClick
              sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.primary.main, 0.04), fontWeight: 800 } }}
            />
          </CustomTabPanel>
          <CustomTabPanel value={tabValue} index={1}>
            <PremiumFeatureGate feature="recipes" featureName="Raw Ingredients Tracker" requiredTier="Pro">
              <DataGrid
                rows={ingredients}
                columns={ingredientColumns}
                initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
                pageSizeOptions={[15, 25, 50]}
                disableRowSelectionOnClick
                sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.secondary.main, 0.04), fontWeight: 800 } }}
              />
            </PremiumFeatureGate>
          </CustomTabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
