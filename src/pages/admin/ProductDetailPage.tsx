import { useState, useMemo } from 'react';
import { 
  Box, Typography, Grid, TextField, Button, 
  Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl,
  Tabs, Tab, IconButton, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Chip,
  useTheme, alpha, Paper, Avatar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowBack, Delete, Add, Inventory, AccountBalanceWallet, Description, Layers, Kitchen } from '@mui/icons-material';
import { useConfigStore } from '../../store/useConfigStore';
import { useInventoryStore, type RecipeItem } from '../../store/useInventoryStore';
import { motion } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';


export default function ProductDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isNew = id === 'new';

  const { products, ingredients, addProduct, updateProduct } = useInventoryStore();
  const existingProduct = useMemo(() => isNew ? null : products.find(p => p.id === id), [id, isNew, products]);

  const [activeTab, setActiveTab] = useState(0);

  // Global Config
  const { categories, taxes, incomeAccounts, expenseAccounts, addCategory, addTax, addIncomeAccount, addExpenseAccount } = useConfigStore();

  // Quick Create Modal State
  const [createModal, setCreateModal] = useState<{ open: boolean; type: 'category' | 'tax' | 'income' | 'expense' | null }>({ open: false, type: null });
  const [modalInput, setModalInput] = useState({ name: '', rate: '', code: '' });

  // Form State
  const [formData, setFormData] = useState({
    name: existingProduct?.name || '',
    productType: 'storable',
    sku: existingProduct?.sku || (isNew ? '' : 'PRD-0001'),
    barcode: '',
    price: existingProduct?.price || 0.00,
    cost: 0.00,
    stock_quantity: existingProduct?.stock_quantity || 0,
    recipe: existingProduct?.recipe || [] as RecipeItem[],
    categoryId: existingProduct?.category || (categories.length > 0 ? categories[0].id : ''),
    
    // Sales & Accounting
    availableInPos: true,
    incomeAccount: incomeAccounts.length > 0 ? incomeAccounts[0].id : '',
    expenseAccount: expenseAccounts.length > 0 ? expenseAccounts[0].id : '',
    customerTaxes: taxes.length > 0 ? taxes[0].id : '',

    // Inventory & Logistics
    weight: 0,
    volume: 0,
    minStock: 10,
    maxStock: 100,

    // Variants — real variant groups with options
    variantGroupIds: existingProduct?.variantGroups?.map(vg => vg.id) || [] as string[],
  });

  const handleChange = (field: string, value: string | number | boolean) => {
    // Intercept Quick Create Triggers
    if (value === '__CREATE__category') return setCreateModal({ open: true, type: 'category' });
    if (value === '__CREATE__tax') return setCreateModal({ open: true, type: 'tax' });
    if (value === '__CREATE__income') return setCreateModal({ open: true, type: 'income' });
    if (value === '__CREATE__expense') return setCreateModal({ open: true, type: 'expense' });

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateSubmit = () => {
    if (createModal.type === 'category') {
      const newCat = addCategory(modalInput.name);
      if (newCat) setFormData(prev => ({ ...prev, categoryId: newCat.id }));
    }
    if (createModal.type === 'tax') {
      const newTax = addTax(modalInput.name, parseFloat(modalInput.rate) || 0);
      if (newTax) setFormData(prev => ({ ...prev, customerTaxes: newTax.id }));
    }
    if (createModal.type === 'income') {
      const newAcc = addIncomeAccount(modalInput.code, modalInput.name);
      if (newAcc) setFormData(prev => ({ ...prev, incomeAccount: newAcc.id }));
    }
    if (createModal.type === 'expense') {
      const newAcc = addExpenseAccount(modalInput.code, modalInput.name);
      if (newAcc) setFormData(prev => ({ ...prev, expenseAccount: newAcc.id }));
    }
    setCreateModal({ open: false, type: null });
    setModalInput({ name: '', rate: '', code: '' });
  };

  const handleSave = () => {
    // Build variant groups from the selected variant group IDs
    const variantGroups = formData.variantGroupIds.map(vgId => {
      const existing = existingProduct?.variantGroups?.find(vg => vg.id === vgId);
      // Use existing options if product already had this group, otherwise use all options from products store
      if (existing) return existing;
      // Find options from any product that has this group
      const sourceProduct = products.find(p => p.variantGroups.some(vg => vg.id === vgId));
      const sourceGroup = sourceProduct?.variantGroups.find(vg => vg.id === vgId);
      return sourceGroup ? { ...sourceGroup } : { id: vgId, name: vgId, options: [] };
    });

    const productData = {
      id: isNew ? `prod-${Date.now()}` : id!,
      sku: formData.sku,
      name: formData.name,
      category: categories.find(c => c.id === formData.categoryId)?.name || formData.categoryId,
      price: formData.price,
      stock_quantity: formData.stock_quantity,
      recipe: formData.recipe,
      variantGroups,
    };
    if (isNew) {
      addProduct(productData);
    } else {
      updateProduct(id!, productData);
    }
    navigate('/admin/inventory');
  };

  const glassStyle = {
    bgcolor: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 10, px: { xs: 2, md: 4 } }}>
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
              {isNew ? t('product.new') : t('product.registry')}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>{formData.name || t('product.untitled')}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isNew && <Button color="error" variant="outlined" sx={{ borderRadius: 3, fontWeight: 700 }}>{t('product.archive')}</Button>}
          <Button variant="contained" color="inherit" sx={{ borderRadius: 3, fontWeight: 700 }} onClick={() => navigate('/admin/inventory')}>{t('product.discard')}</Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Save />} 
            sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: 800, boxShadow: theme.shadows[4] }} 
            onClick={handleSave}
          >
            {t('product.save')}
          </Button>
        </Box>
      </Box>

      {/* Primary Top Header Fields */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              height: 240, borderRadius: 4, ...glassStyle, 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
              color: 'text.secondary', fontWeight: 700, cursor: 'pointer', border: `2px dashed ${alpha(theme.palette.divider, 0.15)}`,
              transition: '0.2s', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02), borderColor: 'primary.main' }
            }}
          >
            <Box sx={{ p: 2.5, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.05), mb: 2 }}>
               <Add fontSize="medium" color="primary" />
            </Box>
            {t('product.uploadVisual')}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
           <Paper elevation={0} sx={{ p: 4, borderRadius: 5, ...glassStyle, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <TextField 
                fullWidth label={t('product.displayName')} 
                variant="standard" 
                InputProps={{ sx: { fontSize: '2rem', fontWeight: 800, letterSpacing: -1 } }} 
                value={formData.name} onChange={e => handleChange('name', e.target.value)} 
                sx={{ mb: 3 }}
              />
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth variant="filled">
                    <InputLabel sx={{ fontWeight: 700 }}>{t('product.classification')}</InputLabel>
                    <Select value={formData.productType} label={t('product.classification')} onChange={e => handleChange('productType', e.target.value)} sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.action.hover, 0.05) }}>
                      <MenuItem value="storable">{t('product.storable')}</MenuItem>
                      <MenuItem value="consumable">{t('product.consumable')}</MenuItem>
                      <MenuItem value="service">{t('product.service')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Paper elevation={0} sx={{ px: 3, py: 1.5, borderRadius: 4, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`, width: '100%' }}>
                    <FormControlLabel 
                      control={<Switch checked={formData.availableInPos} onChange={e => handleChange('availableInPos', e.target.checked)} color="success" />} 
                      label={<Typography fontWeight={800}>{t('product.availableInPos')}</Typography>} 
                    />
                  </Paper>
                </Grid>
              </Grid>
           </Paper>
        </Grid>
      </Grid>

      {/* Tabs Layout */}
      <Paper elevation={0} sx={{ borderRadius: 5, ...glassStyle, overflow: 'hidden', boxShadow: theme.shadows[1] }}>
        <Box sx={{ borderBottom: 1, borderColor: alpha(theme.palette.divider, 0.1), bgcolor: alpha(theme.palette.action.hover, 0.02), px: 2 }}>
          <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)} textColor="primary" indicatorColor="primary">
            <Tab icon={<Description sx={{ fontSize: 18 }} />} iconPosition="start" label={t('product.tab.general')} sx={{ fontWeight: 700, textTransform: 'none', minHeight: 64, px: 3 }} />
            <Tab icon={<AccountBalanceWallet sx={{ fontSize: 18 }} />} iconPosition="start" label={t('product.tab.accounting')} sx={{ fontWeight: 700, textTransform: 'none', minHeight: 64, px: 3 }} />
            <Tab icon={<Inventory sx={{ fontSize: 18 }} />} iconPosition="start" label={t('product.tab.inventory')} sx={{ fontWeight: 700, textTransform: 'none', minHeight: 64, px: 3 }} />
            <Tab icon={<Kitchen sx={{ fontSize: 18 }} />} iconPosition="start" label={t('product.tab.recipe')} sx={{ fontWeight: 700, textTransform: 'none', minHeight: 64, px: 3 }} />
            <Tab icon={<Layers sx={{ fontSize: 18 }} />} iconPosition="start" label={t('product.tab.variants')} sx={{ fontWeight: 700, textTransform: 'none', minHeight: 64, px: 3 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 6 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} key={activeTab}>
            {/* TAB 0: GENERAL INFO */}
            {activeTab === 0 && (
               <Grid container spacing={6}>
                 <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight={800} mb={3} display="flex" alignItems="center" gap={1.2}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 14 }}>1</Avatar>
                      Basic Identification
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label={t('product.general.sku')} variant="outlined" value={formData.sku} onChange={e => handleChange('sku', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label={t('product.general.barcode')} value={formData.barcode} onChange={e => handleChange('barcode', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ fontWeight: 700 }}>{t('product.general.category')}</InputLabel>
                          <Select value={formData.categoryId} label={t('product.general.category')} onChange={e => handleChange('categoryId', e.target.value)} sx={{ borderRadius: 3 }}>
                            {categories.map(cat => <MenuItem key={cat.id} value={cat.id} sx={{ py: 1.5, px: 2, borderRadius: 2, mx: 1 }}>{cat.name}</MenuItem>)}
                            <Divider sx={{ my: 1 }} />
                            <MenuItem value="__CREATE__category" sx={{ color: 'primary.main', fontWeight: 800, py: 1.5, px: 2, borderRadius: 2, mx: 1 }}>{t('product.general.newCategory')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                 </Grid>
                 <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight={900} mb={4} display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 16 }}>2</Avatar>
                      Pricing Logic
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label={t('product.general.salesPrice')} type="number" InputProps={{ startAdornment: <InputAdornment position="start" sx={{ fontWeight: 800 }}>$</InputAdornment> }} value={formData.price} onChange={e => handleChange('price', parseFloat(e.target.value))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, fontWeight: 900, fontSize: '1.2rem' } }} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label={t('product.general.cost')} type="number" helperText={t('product.general.costHelper')} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ fontWeight: 800 }}>$</InputAdornment> }} value={formData.cost} onChange={e => handleChange('cost', parseFloat(e.target.value))}  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                      </Grid>
                    </Grid>
                 </Grid>
               </Grid>
            )}

            {/* TAB 1: SALES & ACCOUNTING */}
            {activeTab === 1 && (
               <Grid container spacing={8}>
                 <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight={900} mb={4}>Taxation Controls</Typography>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ fontWeight: 700 }}>{t('product.accounting.tax')}</InputLabel>
                          <Select value={formData.customerTaxes} label={t('product.accounting.tax')} onChange={e => handleChange('customerTaxes', e.target.value)} sx={{ borderRadius: 3 }}>
                            {taxes.map(tax => <MenuItem key={tax.id} value={tax.id} sx={{ py: 1.5, px: 2, borderRadius: 2, mx: 1 }}>{tax.name}</MenuItem>)}
                            <Divider sx={{ my: 1 }} />
                            <MenuItem value="__CREATE__tax" sx={{ color: 'primary.main', fontWeight: 800, py: 1.5, px: 2, borderRadius: 2, mx: 1 }}>{t('product.accounting.newTax')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                 </Grid>
                 <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight={900} mb={4}>Financial Ledger Integration</Typography>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ fontWeight: 700 }}>{t('product.accounting.income')}</InputLabel>
                          <Select value={formData.incomeAccount} label={t('product.accounting.income')} onChange={e => handleChange('incomeAccount', e.target.value)} sx={{ borderRadius: 3 }}>
                            {incomeAccounts.map(acc => <MenuItem key={acc.id} value={acc.id} sx={{ py: 1.5, px: 2, borderRadius: 2, mx: 1 }}>{acc.code} — {acc.name}</MenuItem>)}
                            <Divider sx={{ my: 1 }} />
                            <MenuItem value="__CREATE__income" sx={{ color: 'primary.main', fontWeight: 800, py: 1.5, px: 2, borderRadius: 2, mx: 1 }}>{t('product.accounting.newIncome')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ fontWeight: 700 }}>{t('product.accounting.expense')}</InputLabel>
                          <Select value={formData.expenseAccount} label={t('product.accounting.expense')} onChange={e => handleChange('expenseAccount', e.target.value)} sx={{ borderRadius: 3 }}>
                            {expenseAccounts.map(acc => <MenuItem key={acc.id} value={acc.id} sx={{ py: 1.5, px: 2, borderRadius: 2, mx: 1 }}>{acc.code} — {acc.name}</MenuItem>)}
                            <Divider sx={{ my: 1 }} />
                            <MenuItem value="__CREATE__expense" sx={{ color: 'primary.main', fontWeight: 800, py: 1.5, px: 2, borderRadius: 2, mx: 1 }}>{t('product.accounting.newExpense')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                 </Grid>
               </Grid>
            )}

            {/* TAB 2: INVENTORY & LOGISTICS */}
            {activeTab === 2 && (
               <Grid container spacing={8}>
                 <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight={900} mb={4}>Logistics Specs</Typography>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label={t('product.inventory.weight')} type="number" InputProps={{ endAdornment: <InputAdornment position="end" sx={{ fontWeight: 700 }}>kg</InputAdornment> }} value={formData.weight} onChange={e => handleChange('weight', parseFloat(e.target.value))}  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label={t('product.inventory.volume')} type="number" InputProps={{ endAdornment: <InputAdornment position="end" sx={{ fontWeight: 700 }}>m³</InputAdornment> }} value={formData.volume} onChange={e => handleChange('volume', parseFloat(e.target.value))}  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth label={t('product.inventory.stockQty')} type="number" helperText={t('product.inventory.stockHelper')} value={formData.stock_quantity} onChange={e => handleChange('stock_quantity', parseInt(e.target.value, 10) || 0)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                      </Grid>
                    </Grid>
                 </Grid>
                 <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" fontWeight={900} mb={4}>Automated Replenishment Rules</Typography>
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <TextField 
                          fullWidth label={t('product.inventory.min')} type="number" 
                          helperText={t('product.inventory.minHelper')} 
                          value={formData.minStock} onChange={e => handleChange('minStock', parseInt(e.target.value, 10))} 
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField 
                          fullWidth label={t('product.inventory.max')} type="number" 
                          helperText={t('product.inventory.maxHelper')} 
                          value={formData.maxStock} onChange={e => handleChange('maxStock', parseInt(e.target.value, 10))} 
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      </Grid>
                    </Grid>
                 </Grid>
               </Grid>
            )}

            {/* TAB 3: RECIPE (BOM) */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" fontWeight={900} mb={2}>Bill of Materials (BOM)</Typography>
                <Typography color="text.secondary" mb={5} fontWeight={500}>Specify the raw ingredients and quantities required to produce one unit of this product.</Typography>
                
                {formData.recipe.map((recipeItem, index) => {
                  const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
                  return (
                    <Paper key={index} elevation={0} sx={{ p: 4, mb: 3, borderRadius: 5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: alpha(theme.palette.action.hover, 0.02) }}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth variant="outlined">
                            <InputLabel sx={{ fontWeight: 700 }}>{t('product.recipe.ingredient')}</InputLabel>
                            <Select 
                              value={recipeItem.ingredientId} 
                              label={t('product.recipe.ingredient')}
                              onChange={(e) => {
                                const newRecipe = [...formData.recipe];
                                newRecipe[index].ingredientId = e.target.value;
                                setFormData({...formData, recipe: newRecipe});
                              }}
                              sx={{ bgcolor: 'background.paper', borderRadius: 3 }}
                            >
                              {ingredients.map(ing => (
                                <MenuItem key={ing.id} value={ing.id} sx={{ py: 1.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <Typography fontWeight={700}>{ing.name}</Typography>
                                    <Typography color="text.secondary">({ing.unit})</Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField 
                            fullWidth label={t('product.recipe.qty')} type="number" 
                            value={recipeItem.quantity} 
                            InputProps={{ endAdornment: <InputAdornment position="end" sx={{ fontWeight: 800 }}>{ingredient?.unit || t('product.recipe.units')}</InputAdornment> }}
                            onChange={(e) => {
                                const newRecipe = [...formData.recipe];
                                newRecipe[index].quantity = parseFloat(e.target.value) || 0;
                                setFormData({...formData, recipe: newRecipe});
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 3 } }} 
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton color="error" size="large" onClick={() => {
                            setFormData({...formData, recipe: formData.recipe.filter((_, i) => i !== index)});
                          }} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}><Delete /></IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  )
                })}

                <Button 
                  variant="outlined" startIcon={<Add />} 
                  onClick={() => {
                    const firstIng = ingredients[0]?.id || '';
                    setFormData({...formData, recipe: [...formData.recipe, { ingredientId: firstIng, quantity: 1 }]})
                  }}
                  sx={{ borderRadius: 3, fontWeight: 700, px: 4, py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}
                >
                  {t('product.recipe.add')}
                </Button>
              </Box>
            )}

            {/* TAB 4: VARIANTS */}
            {activeTab === 4 && (
              <Box>
                <Typography variant="h6" fontWeight={900} mb={2}>{t('product.variants.title')}</Typography>
                <Typography color="text.secondary" mb={4} fontWeight={500}>{t('product.variants.desc')}</Typography>
                
                <Typography variant="subtitle2" fontWeight={800} mb={2}>{t('product.variants.available')}</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 4 }}>
                  {(() => {
                    // Collect all unique variant groups from all products
                    const allGroups = new Map<string, { id: string; name: string; optionCount: number }>();
                    for (const p of products) {
                      for (const vg of p.variantGroups ?? []) {
                        if (!allGroups.has(vg.id)) {
                          allGroups.set(vg.id, { id: vg.id, name: vg.name, optionCount: vg.options.length });
                        }
                      }
                    }
                    const groups = Array.from(allGroups.values());
                    if (groups.length === 0) {
                      return (
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`, width: '100%', textAlign: 'center' }}>
                          <Typography color="text.secondary" fontWeight={600}>
                            No variant groups exist yet. Create them in{' '}
                            <Typography component="span" color="primary.main" fontWeight={800} sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/inventory/variants')}>
                              Inventory → Variants
                            </Typography>
                          </Typography>
                        </Paper>
                      );
                    }
                    return groups.map(g => {
                      const isSelected = formData.variantGroupIds.includes(g.id);
                      return (
                        <Chip
                          key={g.id}
                          label={`${g.name} (${g.optionCount} options)`}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              variantGroupIds: isSelected
                                ? prev.variantGroupIds.filter(id => id !== g.id)
                                : [...prev.variantGroupIds, g.id],
                            }));
                          }}
                          color={isSelected ? 'primary' : 'default'}
                          variant={isSelected ? 'filled' : 'outlined'}
                          sx={{
                            fontWeight: 700, fontSize: '0.85rem', px: 1, height: 36,
                            border: `2px solid ${isSelected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3)}`,
                          }}
                        />
                      );
                    });
                  })()}
                </Box>

                {formData.variantGroupIds.length > 0 && (
                  <>
                    <Typography variant="subtitle2" fontWeight={800} mb={2}>{t('product.variants.preview')}</Typography>
                    {formData.variantGroupIds.map(vgId => {
                      const sourceProduct = products.find(p => p.variantGroups.some(vg => vg.id === vgId));
                      const group = sourceProduct?.variantGroups.find(vg => vg.id === vgId);
                      if (!group) return null;
                      return (
                        <Paper key={vgId} elevation={0} sx={{ p: 3, mb: 2, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                          <Typography fontWeight={800} mb={1}>{group.name}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {group.options.map(opt => (
                              <Chip key={opt.id} label={`${opt.name}${opt.priceModifier !== 0 ? ` (${opt.priceModifier > 0 ? '+' : ''}$${opt.priceModifier.toFixed(2)})` : ''}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                            ))}
                          </Box>
                        </Paper>
                      );
                    })}
                  </>
                )}
              </Box>
            )}
          </motion.div>
        </Box>
      </Paper>

      {/* QUICK CREATE INLINE MODAL - UNIVERSAL PREMIUM DIALOG */}
      <Dialog 
        open={createModal.open} 
        onClose={() => setCreateModal({ open: false, type: null })} 
        maxWidth="xs" fullWidth 
        PaperProps={{ sx: { borderRadius: 4, p: 1.5, boxShadow: theme.shadows[8] } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: -0.5, pb: 1 }}>
          {t('product.dialog.createTitle')} {createModal.type?.toUpperCase()}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography color="text.secondary" variant="body2" mb={4} fontWeight={500}>
            This setting will be saved globally across the enterprise registry and applied to this product immediately.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField 
              autoFocus fullWidth label={t('product.dialog.name')} variant="outlined" 
              value={modalInput.name} onChange={e => setModalInput(prev => ({ ...prev, name: e.target.value }))} 
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            {createModal.type === 'tax' && (
              <TextField 
                fullWidth label={t('product.dialog.rate')} type="number" variant="outlined"
                value={modalInput.rate} onChange={e => setModalInput(prev => ({ ...prev, rate: e.target.value }))} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            )}
            {(createModal.type === 'income' || createModal.type === 'expense') && (
              <TextField 
                fullWidth label={t('product.dialog.code')} variant="outlined"
                value={modalInput.code} onChange={e => setModalInput(prev => ({ ...prev, code: e.target.value }))} 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
          <Button onClick={() => setCreateModal({ open: false, type: null })} color="inherit" sx={{ fontWeight: 700, borderRadius: 3 }}>{t('product.dialog.dismiss')}</Button>
          <Button 
            variant="contained" onClick={handleCreateSubmit} disabled={!modalInput.name} 
            sx={{ borderRadius: 3, fontWeight: 800, px: 3, py: 1 }}
          >
            {t('product.dialog.createIntegrate')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
