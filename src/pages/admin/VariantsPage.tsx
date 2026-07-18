import { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, IconButton, Chip, alpha, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  List, ListItemButton, ListItemText, Snackbar, Alert,
  Checkbox, ListItemIcon,
} from '@mui/material';
import { Add, Delete, Edit, Save, Tune, Close } from '@mui/icons-material';
import { useInventoryStore, type ProductVariantOption } from '../../store/useInventoryStore';
import { useLanguage } from '../../i18n/LanguageContext';

export default function VariantsPage() {
  const theme = useTheme();
  const { t } = useLanguage();
  const { products, updateProduct } = useInventoryStore();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [optionForm, setOptionForm] = useState({ name: '', priceModifier: 0 });
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignProductIds, setAssignProductIds] = useState<string[]>([]);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false, msg: '', severity: 'success',
  });

  // ─── Derive variant groups from all products ────────────────
  const variantGroups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; options: ProductVariantOption[]; productCount: number }>();
    for (const p of products) {
      for (const vg of p.variantGroups ?? []) {
        if (!map.has(vg.id)) {
          map.set(vg.id, { id: vg.id, name: vg.name, options: [...vg.options], productCount: 0 });
        }
        const entry = map.get(vg.id)!;
        entry.productCount++;
        // Merge options from all products that share this group id
        for (const opt of vg.options) {
          if (!entry.options.some((o) => o.id === opt.id)) {
            entry.options.push({ ...opt });
          }
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const selectedGroup = variantGroups.find((g) => g.id === selectedGroupId) ?? null;

  const selectedGroupProducts = useMemo(
    () => products.filter((p) => p.variantGroups.some((vg) => vg.id === selectedGroupId)),
    [products, selectedGroupId],
  );

  // ─── Group CRUD ─────────────────────────────────────────────
  const openCreateGroup = () => {
    setEditingGroupId(null);
    setGroupNameInput('');
    setGroupDialogOpen(true);
  };

  const openEditGroup = (groupId: string) => {
    const group = variantGroups.find((g) => g.id === groupId);
    if (!group) return;
    setEditingGroupId(groupId);
    setGroupNameInput(group.name);
    setGroupDialogOpen(true);
  };

  const saveGroup = () => {
    const name = groupNameInput.trim();
    if (!name) {
      setSnack({ open: true, msg: t('variants.groupRequired'), severity: 'error' });
      return;
    }

    if (editingGroupId) {
      // Rename group across all products
      for (const p of products) {
        const vg = p.variantGroups.find((g) => g.id === editingGroupId);
        if (vg && vg.name !== name) {
          updateProduct(p.id, {
            variantGroups: p.variantGroups.map((g) =>
              g.id === editingGroupId ? { ...g, name } : g
            ),
          });
        }
      }
      setSnack({ open: true, msg: `${t('variants.renamed')} "${name}"`, severity: 'success' });
    } else {
      // Create new group — add to first product as a seed, then user assigns
      const newGroupId = `vg-${Date.now()}`;
      if (products.length > 0) {
        const first = products[0];
        updateProduct(first.id, {
          variantGroups: [...first.variantGroups, { id: newGroupId, name, options: [] }],
        });
      }
      setSelectedGroupId(newGroupId);
      setSnack({ open: true, msg: `Created group "${name}"`, severity: 'success' });
    }
    setGroupDialogOpen(false);
    setGroupNameInput('');
    setEditingGroupId(null);
  };

  const deleteGroup = (groupId: string) => {
    for (const p of products) {
      if (p.variantGroups.some((g) => g.id === groupId)) {
        updateProduct(p.id, {
          variantGroups: p.variantGroups.filter((g) => g.id !== groupId),
        });
      }
    }
    if (selectedGroupId === groupId) setSelectedGroupId(null);
    setSnack({ open: true, msg: 'Variant group deleted', severity: 'success' });
  };

  // ─── Option CRUD ────────────────────────────────────────────
  const openAddOption = () => {
    setEditingOptionId(null);
    setOptionForm({ name: '', priceModifier: 0 });
    setOptionDialogOpen(true);
  };

  const openEditOption = (opt: ProductVariantOption) => {
    setEditingOptionId(opt.id);
    setOptionForm({ name: opt.name, priceModifier: opt.priceModifier });
    setOptionDialogOpen(true);
  };

  const saveOption = () => {
    if (!selectedGroupId || !optionForm.name.trim()) {
      setSnack({ open: true, msg: 'Option name is required', severity: 'error' });
      return;
    }

    if (editingOptionId) {
      // Update option across all products with this group
      for (const p of products) {
        const vg = p.variantGroups.find((g) => g.id === selectedGroupId);
        if (vg && vg.options.some((o) => o.id === editingOptionId)) {
          updateProduct(p.id, {
            variantGroups: p.variantGroups.map((g) =>
              g.id === selectedGroupId
                ? {
                    ...g,
                    options: g.options.map((o) =>
                      o.id === editingOptionId
                        ? { ...o, name: optionForm.name.trim(), priceModifier: optionForm.priceModifier }
                        : o
                    ),
                  }
                : g
            ),
          });
        }
      }
      setSnack({ open: true, msg: 'Option updated', severity: 'success' });
    } else {
      const newOpt: ProductVariantOption = {
        id: `vo-${Date.now()}`,
        name: optionForm.name.trim(),
        priceModifier: optionForm.priceModifier,
      };
      // Add to ALL products that have this group
      for (const p of products) {
        if (p.variantGroups.some((g) => g.id === selectedGroupId)) {
          updateProduct(p.id, {
            variantGroups: p.variantGroups.map((g) =>
              g.id === selectedGroupId ? { ...g, options: [...g.options, newOpt] } : g
            ),
          });
        }
      }
      setSnack({ open: true, msg: `Added option "${newOpt.name}"`, severity: 'success' });
    }
    setOptionDialogOpen(false);
    setOptionForm({ name: '', priceModifier: 0 });
    setEditingOptionId(null);
  };

  const deleteOption = (optionId: string) => {
    for (const p of products) {
      if (p.variantGroups.some((g) => g.id === selectedGroupId && g.options.some((o) => o.id === optionId))) {
        updateProduct(p.id, {
          variantGroups: p.variantGroups.map((g) =>
            g.id === selectedGroupId ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g
          ),
        });
      }
    }
    setSnack({ open: true, msg: 'Option removed', severity: 'success' });
  };

  // ─── Product Assignment ─────────────────────────────────────
  const openAssignProducts = () => {
    setAssignProductIds(selectedGroupProducts.map((p) => p.id));
    setAssignDialogOpen(true);
  };

  const saveProductAssignment = () => {
    if (!selectedGroupId) return;

    // Products that should HAVE this group
    const shouldHave = new Set(assignProductIds);
    // Products that currently have this group
    const currentlyHave = new Set(selectedGroupProducts.map((p) => p.id));

    // Remove group from products that should no longer have it
    for (const pid of currentlyHave) {
      if (!shouldHave.has(pid)) {
        const p = products.find((x) => x.id === pid);
        if (p) {
          updateProduct(pid, {
            variantGroups: p.variantGroups.filter((g) => g.id !== selectedGroupId),
          });
        }
      }
    }

    // Add group to products that should now have it (but don't)
    const group = variantGroups.find((g) => g.id === selectedGroupId);
    if (group) {
      for (const pid of shouldHave) {
        if (!currentlyHave.has(pid)) {
          const p = products.find((x) => x.id === pid);
          if (p) {
            updateProduct(pid, {
              variantGroups: [...p.variantGroups, { id: group.id, name: group.name, options: group.options.map((o) => ({ ...o })) }],
            });
          }
        }
      }
    }

    setAssignDialogOpen(false);
    setSnack({ open: true, msg: 'Product assignments updated', severity: 'success' });
  };

  const glassStyle = {
    bgcolor: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  };

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 120px)', display: 'flex', gap: 3 }}>
      {/* LEFT: Variant Group List */}
      <Paper elevation={0} sx={{ width: 300, flexShrink: 0, borderRadius: 4, ...glassStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{t('variants.title')}</Typography>
            <Typography variant="caption" color="text.secondary">{variantGroups.length} {t('variants.defined')}</Typography>
          </Box>
          <Button size="small" variant="contained" startIcon={<Add />} onClick={openCreateGroup} sx={{ borderRadius: 2, fontWeight: 700 }}>
            {t('variants.new')}
          </Button>
        </Box>
        <List sx={{ flex: 1, overflowY: 'auto', py: 0 }}>
          {variantGroups.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Tune sx={{ fontSize: 36, color: 'text.secondary', mb: 1, opacity: 0.4 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>{t('variants.empty')}</Typography>
            </Box>
          )}
          {variantGroups.map((group) => (
            <ListItemButton
              key={group.id}
              selected={group.id === selectedGroupId}
              onClick={() => setSelectedGroupId(group.id)}
              sx={{
                px: 2.5, py: 2,
                borderLeft: group.id === selectedGroupId ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight={700}>{group.name}</Typography>
                    <Chip label={`${group.options.length} opts`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {group.options.slice(0, 3).map((o) => (
                      <Chip key={o.id} label={o.name} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                    ))}
                    {group.options.length > 3 && <Chip label={`+${group.options.length - 3}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />}
                  </Box>
                }
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      {/* RIGHT: Selected Group Detail */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0 }}>
        {selectedGroup ? (
          <>
            {/* Header Bar */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, ...glassStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700}>{t('variants.group')}</Typography>
                <Typography variant="h5" fontWeight={800}>{selectedGroup.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedGroup.options.length} option{selectedGroup.options.length !== 1 ? 's' : ''} · assigned to {selectedGroupProducts.length} product{selectedGroupProducts.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={openAssignProducts} sx={{ borderRadius: 3, fontWeight: 700 }}>
                  Assign Products
                </Button>
                <IconButton onClick={() => openEditGroup(selectedGroup.id)} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.05) }}>
                  <Edit />
                </IconButton>
                <IconButton color="error" onClick={() => deleteGroup(selectedGroup.id)} sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                  <Delete />
                </IconButton>
              </Box>
            </Paper>

            {/* Options Grid */}
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {selectedGroup.options.length === 0 && (
                <Paper elevation={0} sx={{ p: 6, borderRadius: 4, ...glassStyle, textAlign: 'center' }}>
                  <Tune sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" fontWeight={800} color="text.secondary">No options defined</Typography>
                  <Typography color="text.secondary" sx={{ mb: 3 }}>Add options like "Small", "Medium", "Large"</Typography>
                  <Button variant="outlined" startIcon={<Add />} onClick={openAddOption} sx={{ borderRadius: 3, fontWeight: 700 }}>
                    {t('variants.addFirstOption')}
                  </Button>
                </Paper>
              )}

              {selectedGroup.options
                .slice()
                .sort((a, b) => a.priceModifier - b.priceModifier)
                .map((opt) => (
                <Paper
                  key={opt.id}
                  elevation={0}
                  sx={{
                    p: 3, borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'primary.main', fontSize: '0.85rem',
                    }}>
                      {opt.priceModifier > 0 ? `+$${opt.priceModifier.toFixed(2)}` : opt.priceModifier < 0 ? `-$${Math.abs(opt.priceModifier).toFixed(2)}` : '$0.00'}
                    </Box>
                    <Box>
                      <Typography fontWeight={700}>{opt.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {opt.priceModifier === 0 ? 'No price change' : `Adds ${opt.priceModifier > 0 ? '+' : ''}$${opt.priceModifier.toFixed(2)} to base price`}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => openEditOption(opt)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteOption(opt.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ))}

              {selectedGroup.options.length > 0 && (
                <Button
                  variant="outlined" startIcon={<Add />} onClick={openAddOption}
                  sx={{ borderRadius: 3, fontWeight: 700, borderStyle: 'dashed', borderWidth: 2, py: 1.5 }}
                >
                  {t('variants.addOption')}
                </Button>
              )}
            </Box>

            {/* Assigned Products */}
            {selectedGroupProducts.length > 0 && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, ...glassStyle }}>
                <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Assigned Products</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedGroupProducts.map((p) => (
                    <Chip key={p.id} label={p.name} size="small" sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.06) }} />
                  ))}
                </Box>
              </Paper>
            )}
          </>
        ) : (
          <Paper elevation={0} sx={{ flex: 1, borderRadius: 4, ...glassStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            <Tune sx={{ fontSize: 64, mb: 2, opacity: 0.4 }} />
            <Typography variant="h5" fontWeight={800}>{t('variants.selectGroup')}</Typography>
            <Typography>{t('variants.selectGroupDesc')}</Typography>
          </Paper>
        )}
      </Box>

      {/* ─── Group Create/Edit Dialog ─── */}
      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingGroupId ? t('variants.dialog.renameGroup') : t('variants.dialog.newGroup')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth autoFocus label={t('variants.dialog.groupName')}
            value={groupNameInput} onChange={(e) => setGroupNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveGroup(); }}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setGroupDialogOpen(false)} sx={{ fontWeight: 700, borderRadius: 3 }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={saveGroup} disabled={!groupNameInput.trim()} sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>
            {editingGroupId ? t('variants.dialog.rename') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Option Create/Edit Dialog ─── */}
      <Dialog open={optionDialogOpen} onClose={() => setOptionDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingOptionId ? 'Edit Option' : 'New Option'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              fullWidth autoFocus label="Option Name (e.g. Large, 50% Sugar)"
              value={optionForm.name} onChange={(e) => setOptionForm((p) => ({ ...p, name: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') saveOption(); }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <TextField
              fullWidth label="Price Modifier" type="number"
              helperText="Amount added to base price (+ or -). Use 0 for no change."
              value={optionForm.priceModifier}
              onChange={(e) => setOptionForm((p) => ({ ...p, priceModifier: parseFloat(e.target.value) || 0 }))}
              InputProps={{ startAdornment: <Typography sx={{ mr: 1, fontWeight: 800 }}>$</Typography> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setOptionDialogOpen(false)} sx={{ fontWeight: 700, borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" onClick={saveOption} disabled={!optionForm.name.trim()} sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>
            {editingOptionId ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Product Assignment Dialog ─── */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Assign Products to "{selectedGroup?.name}"
          <IconButton onClick={() => setAssignDialogOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select which products should have this variant group.
          </Typography>
          <List dense>
            {products.map((p) => (
              <ListItemButton key={p.id} dense onClick={() => {
                setAssignProductIds((prev) =>
                  prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                );
              }}>
                <ListItemIcon>
                  <Checkbox edge="start" checked={assignProductIds.includes(p.id)} disableRipple />
                </ListItemIcon>
                <ListItemText primary={<Typography fontWeight={600}>{p.name}</Typography>} secondary={p.sku} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setAssignDialogOpen(false)} sx={{ fontWeight: 700, borderRadius: 3 }}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={saveProductAssignment} sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>
            Save Assignments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 3, fontWeight: 700 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
