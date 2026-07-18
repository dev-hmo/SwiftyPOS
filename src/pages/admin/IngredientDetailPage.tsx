import { useState, useMemo } from 'react';
import { 
  Box, Typography, Grid, TextField, Button, 
  IconButton, InputAdornment, useTheme, alpha, Paper, Avatar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowBack, Delete, Kitchen } from '@mui/icons-material';
import { useInventoryStore } from '../../store/useInventoryStore';

export default function IngredientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isNew = id === 'new';

  const { ingredients, addIngredient, updateIngredient, deleteIngredient } = useInventoryStore();
  const existingIngredient = useMemo(() => isNew ? null : ingredients.find(i => i.id === id), [id, isNew, ingredients]);

  // Form State
  const [formData, setFormData] = useState({
    name: existingIngredient?.name || '',
    sku: existingIngredient?.sku || '',
    unit: existingIngredient?.unit || 'g',
    stock_quantity: existingIngredient?.stock_quantity || 0,
    cost_per_unit: existingIngredient?.cost_per_unit || 0.00,
    low_stock_threshold: existingIngredient?.low_stock_threshold || 10,
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const ingredientData = {
      id: isNew ? `ing-${Date.now()}` : id!,
      ...formData
    };
    
    if (isNew) {
      addIngredient(ingredientData);
    } else {
      updateIngredient(id!, ingredientData);
    }
    navigate('/admin/inventory/ingredients');
  };

  const handleDelete = () => {
    if (!isNew) {
      deleteIngredient(id!);
      navigate('/admin/inventory/ingredients');
    }
  };

  const glassStyle = {
    bgcolor: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', pb: 10, px: { xs: 2, md: 4 } }}>
      {/* Sticky Header Action Bar */}
      <Box sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        p: 2.5, mb: 5, borderRadius: 4, 
        ...glassStyle,
        position: 'sticky', top: 90, zIndex: 10,
        boxShadow: theme.shadows[2]
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <IconButton onClick={() => navigate('/admin/inventory')} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.05), borderRadius: 2.5, p: 1 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>
              {isNew ? 'New Raw Ingredient' : 'Ingredient Registry'}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>{formData.name || 'Untitled Ingredient'}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isNew && <Button color="error" variant="outlined" onClick={handleDelete} startIcon={<Delete />} sx={{ borderRadius: 3, fontWeight: 700 }}>Delete</Button>}
          <Button variant="contained" color="inherit" sx={{ borderRadius: 3, fontWeight: 700 }} onClick={() => navigate('/admin/inventory')}>Discard</Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Save />} 
            sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: 800, boxShadow: theme.shadows[4] }} 
            onClick={handleSave}
            disabled={!formData.name}
          >
            Save Ingredient
          </Button>
        </Box>
      </Box>

      {/* Main Form Content */}
      <Paper elevation={0} sx={{ p: 5, borderRadius: 5, ...glassStyle }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
            <Kitchen fontSize="large" />
          </Avatar>
          <Typography variant="h4" fontWeight={900}>Ingredient Details</Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField 
              fullWidth label="Ingredient Display Name" 
              variant="outlined" value={formData.name} 
              onChange={e => handleChange('name', e.target.value)} 
              InputProps={{ sx: { fontSize: '1.5rem', fontWeight: 800, py: 1, borderRadius: 3 } }}
              sx={{ mb: 4 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField 
              fullWidth label="Internal SKU (Reference Code)" 
              variant="outlined" value={formData.sku} 
              onChange={e => handleChange('sku', e.target.value)} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, py: 1.5 } }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" fontWeight={800} mb={3}>Measurement & Stocking</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                 <TextField 
                   fullWidth label="Unit of Measurement" 
                   helperText="e.g., kg, g, L, ml, pieces"
                   value={formData.unit} 
                   onChange={e => handleChange('unit', e.target.value)} 
                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                 />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                 <TextField 
                   fullWidth label="Current Stock Level" type="number"
                   value={formData.stock_quantity} 
                   InputProps={{ endAdornment: <InputAdornment position="end" sx={{ fontWeight: 800 }}>{formData.unit}</InputAdornment> }}
                   onChange={e => handleChange('stock_quantity', parseFloat(e.target.value) || 0)} 
                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                 />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                 <TextField 
                   fullWidth label="Low Stock Warning Threshold" type="number"
                   value={formData.low_stock_threshold} 
                   InputProps={{ endAdornment: <InputAdornment position="end" sx={{ fontWeight: 800 }}>{formData.unit}</InputAdornment> }}
                   onChange={e => handleChange('low_stock_threshold', parseFloat(e.target.value) || 0)} 
                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                 />
              </Grid>
            </Grid>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" fontWeight={800} mb={3}>Financial Integration</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                 <TextField 
                   fullWidth label={`Cost per ${formData.unit || 'unit'}`} type="number"
                   value={formData.cost_per_unit} 
                   InputProps={{ startAdornment: <InputAdornment position="start" sx={{ fontWeight: 800 }}>$</InputAdornment> }}
                   onChange={e => handleChange('cost_per_unit', parseFloat(e.target.value) || 0)} 
                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                 />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
