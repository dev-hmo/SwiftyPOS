import { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, IconButton, List, ListItemButton, ListItemText,
  Chip, alpha, useTheme, TextField, InputAdornment, Snackbar, Alert,
  Select, MenuItem, InputLabel, FormControl,
} from '@mui/material';
import { Add, Delete, Save, Kitchen } from '@mui/icons-material';
import { useInventoryStore, type RecipeItem } from '../../store/useInventoryStore';

export default function RecipeConfiguratorPage() {
  const theme = useTheme();
  const { products, ingredients, updateProduct } = useInventoryStore();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [draftRecipe, setDraftRecipe] = useState<RecipeItem[]>([]);
  const [dirty, setDirty] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false, msg: '', severity: 'success',
  });

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  // Sync draft when product changes
  const selectProduct = (id: string) => {
    if (dirty && selectedProductId) {
      updateProduct(selectedProductId, { recipe: draftRecipe });
    }
    const prod = products.find((p) => p.id === id);
    setSelectedProductId(id);
    setDraftRecipe(prod?.recipe ? [...prod.recipe] : []);
    setDirty(false);
  };

  const handleIngredientChange = (index: number, field: keyof RecipeItem, value: string | number) => {
    setDraftRecipe((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as RecipeItem;
      return next;
    });
    setDirty(true);
  };

  const addIngredientRow = () => {
    const availableIngredients = ingredients.filter(
      (i) => !draftRecipe.some((r) => r.ingredientId === i.id),
    );
    if (availableIngredients.length === 0) {
      setSnack({ open: true, msg: 'All ingredients already in recipe', severity: 'error' });
      return;
    }
    setDraftRecipe((prev) => [...prev, { ingredientId: availableIngredients[0].id, quantity: 1 }]);
    setDirty(true);
  };

  const removeIngredientRow = (index: number) => {
    setDraftRecipe((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const handleSave = () => {
    if (!selectedProductId) return;
    updateProduct(selectedProductId, { recipe: draftRecipe });
    setDirty(false);
    setSnack({ open: true, msg: `Recipe saved for ${selectedProduct?.name}`, severity: 'success' });
  };

  // Products grouped by category
  const groupedProducts = useMemo(() => {
    const map = new Map<string, typeof products>();
    for (const p of products) {
      const cat = p.category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return map;
  }, [products]);

  // Available ingredients for dropdown (exclude already-in-recipe)
  const availableForDropdown = useMemo(
    () => ingredients.filter((i) => !draftRecipe.some((r) => r.ingredientId === i.id)),
    [ingredients, draftRecipe],
  );

  const glassStyle = {
    bgcolor: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  };

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', gap: 3 }}>
      {/* LEFT: Product list */}
      <Paper elevation={0} sx={{ width: 320, flexShrink: 0, borderRadius: 4, ...glassStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="h6" fontWeight={800}>Select Product</Typography>
          <Typography variant="caption" color="text.secondary">Choose a product to configure its recipe</Typography>
        </Box>
        <List sx={{ flex: 1, overflowY: 'auto', py: 0 }}>
          {Array.from(groupedProducts.entries()).map(([category, prods]) => (
            <Box key={category}>
              <Box sx={{ px: 2.5, py: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                  {category} ({prods.length})
                </Typography>
              </Box>
              {prods.map((p) => {
                const hasRecipe = p.recipe && p.recipe.length > 0;
                const isSelected = p.id === selectedProductId;
                return (
                  <ListItemButton
                    key={p.id}
                    selected={isSelected}
                    onClick={() => selectProduct(p.id)}
                    sx={{
                      px: 2.5, py: 1.5,
                      borderLeft: isSelected ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography fontWeight={700} variant="body2">{p.name}</Typography>
                          {hasRecipe ? (
                            <Chip label={`${p.recipe.length} ing.`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 700 }} />
                          ) : (
                            <Chip label="No recipe" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main', fontWeight: 700 }} />
                          )}
                        </Box>
                      }
                      secondary={<Typography variant="caption" color="text.secondary">{p.sku}</Typography>}
                    />
                  </ListItemButton>
                );
              })}
            </Box>
          ))}
        </List>
      </Paper>

      {/* RIGHT: Recipe editor */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0 }}>
        {selectedProduct ? (
          <>
            {/* Product header + save bar */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, ...glassStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>RECIPE CONFIGURATOR</Typography>
                <Typography variant="h5" fontWeight={800}>{selectedProduct.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedProduct.sku} — {selectedProduct.category}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {dirty && (
                  <Chip label="Unsaved changes" color="warning" size="small" sx={{ fontWeight: 700 }} />
                )}
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  disabled={!dirty}
                  onClick={handleSave}
                  sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}
                >
                  Save Recipe
                </Button>
              </Box>
            </Paper>

            {/* Recipe rows */}
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {draftRecipe.length === 0 && (
                <Paper elevation={0} sx={{ p: 6, borderRadius: 4, ...glassStyle, textAlign: 'center' }}>
                  <Kitchen sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" fontWeight={800} color="text.secondary">No ingredients defined</Typography>
                  <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Add ingredients to define how this product is made
                  </Typography>
                  <Button variant="outlined" startIcon={<Add />} onClick={addIngredientRow} sx={{ borderRadius: 3, fontWeight: 700 }}>
                    Add First Ingredient
                  </Button>
                </Paper>
              )}

              {draftRecipe.map((item, index) => {
                const ingredient = ingredients.find((i) => i.id === item.ingredientId);
                const isLow = ingredient && ingredient.stock_quantity <= ingredient.low_stock_threshold;
                return (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 3, borderRadius: 4,
                      border: `1px solid ${isLow ? alpha(theme.palette.error.main, 0.3) : alpha(theme.palette.divider, 0.1)}`,
                      bgcolor: isLow ? alpha(theme.palette.error.main, 0.03) : alpha(theme.palette.background.paper, 0.5),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ minWidth: 28 }}>
                        #{index + 1}
                      </Typography>
                      <FormControl size="small" sx={{ flex: 2 }}>
                        <InputLabel sx={{ fontWeight: 700 }}>Ingredient</InputLabel>
                        <Select
                          value={item.ingredientId}
                          label="Ingredient"
                          onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          {/* Show current ingredient even if it's "used" by another row */}
                          {ingredients.map((ing) => (
                            <MenuItem key={ing.id} value={ing.id} disabled={false}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <Typography fontWeight={600}>{ing.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {ing.stock_quantity} {ing.unit} available
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                          {availableForDropdown.length === 0 && ingredients.length === 0 && (
                            <MenuItem disabled>No ingredients — create some first</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        label="Qty / unit"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" fontWeight={700} color="text.secondary">
                                {ingredient?.unit || 'units'}
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      {ingredient && (
                        <Chip
                          size="small"
                          label={`$${(ingredient.cost_per_unit * item.quantity).toFixed(3)}`}
                          sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.info.main, 0.08), color: 'info.main', minWidth: 80, justifyContent: 'center' }}
                        />
                      )}
                      <IconButton color="error" onClick={() => removeIngredientRow(index)} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                        <Delete />
                      </IconButton>
                    </Box>
                    {isLow && (
                      <Typography variant="caption" color="error.main" fontWeight={700} sx={{ ml: 5, mt: 1, display: 'block' }}>
                        Low stock: only {ingredient?.stock_quantity} {ingredient?.unit} remaining
                      </Typography>
                    )}
                  </Paper>
                );
              })}
            </Box>

            {draftRecipe.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addIngredientRow}
                disabled={availableForDropdown.length === 0}
                sx={{ borderRadius: 3, fontWeight: 700, borderStyle: 'dashed', borderWidth: 2, py: 1.5 }}
              >
                Add Ingredient
              </Button>
            )}
          </>
        ) : (
          <Paper elevation={0} sx={{ flex: 1, borderRadius: 4, ...glassStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            <Kitchen sx={{ fontSize: 64, mb: 2, opacity: 0.4 }} />
            <Typography variant="h5" fontWeight={800}>Select a Product</Typography>
            <Typography>Choose a product from the left panel to configure its recipe</Typography>
          </Paper>
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 3, fontWeight: 700 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
