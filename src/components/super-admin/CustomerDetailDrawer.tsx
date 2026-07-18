import { useState, useEffect } from 'react';
import {
  Drawer, Box, Typography, IconButton, TextField, Button, Divider,
  Avatar, Chip, useTheme, alpha, CircularProgress, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Close, Edit, Save, Cancel, Store, People, CalendarMonth,
  CreditCard, Block, PlayArrow
} from '@mui/icons-material';
import { useSaaSStore } from '../../store/useSaaSStore';
import type { PlanTier } from '../../types/tenant';

interface Props {
  open: boolean;
  tenantId: string | null;
  onClose: () => void;
}

const PLAN_COLORS: Record<string, string> = {
  enterprise: '#8b5cf6', pro: '#3b82f6', standard: '#10b981', free: '#64748b',
};

function getRenewalDate(joinTs: number): Date {
  const d = new Date(joinTs);
  const now = new Date();
  while (d <= now) d.setMonth(d.getMonth() + 1);
  return d;
}

export default function CustomerDetailDrawer({ open, tenantId, onClose }: Props) {
  const theme = useTheme();
  const { selectedTenant, isLoading, fetchTenantDetails, updateTenantInfo, updateTenantPlan, suspendTenant, reactivateTenant, clearSelectedTenant, auditLog, fetchAuditLog } = useSaaSStore();
  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState('');
  const [localSlug, setLocalSlug] = useState('');
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [auditExpanded, setAuditExpanded] = useState(false);

  useEffect(() => {
    if (open && tenantId) {
      fetchTenantDetails(tenantId);
      fetchAuditLog(tenantId);
    }
  }, [open, tenantId, fetchTenantDetails, fetchAuditLog]);

  const handleSave = async () => {
    if (!tenantId) return;
    await updateTenantInfo(tenantId, { name: localName, slug: localSlug });
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setLocalName(selectedTenant?.name ?? '');
    setLocalSlug(selectedTenant?.slug ?? '');
    setIsEditing(true);
  };

  const handleSuspend = async () => {
    if (!tenantId) return;
    await suspendTenant(tenantId);
    setSuspendDialog(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    clearSelectedTenant();
    onClose();
  };

  return (
    <>
      <Drawer
        anchor="right" open={open} onClose={handleClose}
        PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, bgcolor: 'background.default' } }}
      >
        {isLoading || !selectedTenant ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="h6" fontWeight={800}>Customer Details</Typography>
              <IconButton onClick={handleClose} size="small" sx={{ bgcolor: alpha(theme.palette.action.hover, 0.05) }}>
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
              {/* Identity */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: alpha(PLAN_COLORS[selectedTenant.plan] || '#64748b', 0.12), color: PLAN_COLORS[selectedTenant.plan] || '#64748b', width: 56, height: 56, fontWeight: 900, fontSize: '1.2rem' }}>
                  {selectedTenant.name.slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  {isEditing ? (
                    <TextField size="small" fullWidth value={localName} onChange={(e) => setLocalName(e.target.value)} sx={{ mb: 0.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  ) : (
                    <Typography variant="h6" fontWeight={800}>{selectedTenant.name}</Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{selectedTenant.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {isEditing ? (
                    <>
                      <IconButton size="small" color="success" onClick={handleSave} sx={{ bgcolor: alpha(theme.palette.success.main, 0.08) }}><Save fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setIsEditing(false)} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.05) }}><Cancel fontSize="small" /></IconButton>
                    </>
                  ) : (
                    <IconButton size="small" onClick={handleStartEdit} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.05) }}><Edit fontSize="small" /></IconButton>
                  )}
                </Box>
              </Box>

              {isEditing && (
                <TextField size="small" fullWidth label="Workspace Slug" value={localSlug} onChange={(e) => setLocalSlug(e.target.value)} sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              )}

              {/* Status & Plan Chips */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip label={selectedTenant.status} size="small"
                  color={selectedTenant.status === 'Active' ? 'success' : selectedTenant.status === 'Trial' ? 'warning' : selectedTenant.status === 'Suspended' ? 'error' : 'default'}
                  sx={{ fontWeight: 700 }}
                />
                <Chip label={selectedTenant.plan} size="small"
                  sx={{ fontWeight: 700, textTransform: 'capitalize', bgcolor: alpha(PLAN_COLORS[selectedTenant.plan] || '#64748b', 0.1), color: PLAN_COLORS[selectedTenant.plan] || '#64748b' }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Info Grid */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Registered</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800}>{new Date(selectedTenant.joinDate).toLocaleDateString()}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <CreditCard sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Renewal Date</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800}>{getRenewalDate(selectedTenant.joinDate).toLocaleDateString()}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Store sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Stores</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800}>{selectedTenant.storeCount}</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Team Members</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800}>{selectedTenant.userCount}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Suspend / Reactivate */}
              {selectedTenant.status === 'Suspended' ? (
                <Button fullWidth variant="outlined" color="success" startIcon={<PlayArrow />} onClick={() => reactivateTenant(selectedTenant.id)} sx={{ mb: 3, borderRadius: 3, fontWeight: 800, py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}>
                  Reactivate This Customer
                </Button>
              ) : selectedTenant.status !== 'Expired' ? (
                <Button fullWidth variant="outlined" color="error" startIcon={<Block />} onClick={() => setSuspendDialog(true)} sx={{ mb: 3, borderRadius: 3, fontWeight: 800, py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}>
                  Suspend Customer Access
                </Button>
              ) : null}

              {/* Quick Plan Change */}
              <Typography variant="subtitle2" fontWeight={800} mb={2}>Quick Plan Change</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                {(['standard', 'pro', 'enterprise'] as PlanTier[]).map((plan) => (
                  <Button key={plan} size="small" variant={selectedTenant.plan === plan ? 'contained' : 'outlined'} disabled={selectedTenant.plan === plan}
                    onClick={() => updateTenantPlan(selectedTenant.id, plan)}
                    sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'capitalize', ...(selectedTenant.plan === plan && { bgcolor: PLAN_COLORS[plan], '&:hover': { bgcolor: PLAN_COLORS[plan] } }) }}
                  >
                    {plan}
                  </Button>
                ))}
              </Box>

              {/* Audit Trail */}
              <Divider sx={{ my: 2 }} />
              <Button fullWidth size="small" onClick={() => setAuditExpanded(!auditExpanded)} sx={{ mb: 1, justifyContent: 'flex-start', fontWeight: 700, textTransform: 'none' }}>
                {auditExpanded ? 'Hide' : 'Show'} Audit Trail ({auditLog.length} entries)
              </Button>
              {auditExpanded && (
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {auditLog.map((entry) => (
                    <Box key={entry.id} sx={{ py: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Chip label={entry.action} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                        <Typography variant="caption" color="text.secondary">{new Date(entry.created_at).toLocaleString()}</Typography>
                      </Box>
                      {entry.actor_email && (
                        <Typography variant="caption" color="text.secondary" display="block">by {entry.actor_email}</Typography>
                      )}
                      {entry.metadata && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                          {JSON.stringify(entry.metadata)}
                        </Typography>
                      )}
                    </Box>
                  ))}
                  {auditLog.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No audit entries.</Typography>}
                </Box>
              )}

              {selectedTenant.trialEndsAt && (
                <Box sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}` }}>
                  <Typography variant="caption" fontWeight={700} color="warning.main">TRIAL ENDS</Typography>
                  <Typography variant="body2" fontWeight={800}>{new Date(selectedTenant.trialEndsAt).toLocaleDateString()}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Suspend Confirmation Dialog */}
      <Dialog open={suspendDialog} onClose={() => setSuspendDialog(false)} PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={800}>Suspend Customer Access?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This will <b>immediately block</b> all access for <b>{selectedTenant?.name}</b> and all associated users. This action is logged in the audit trail.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setSuspendDialog(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleSuspend} sx={{ fontWeight: 800, borderRadius: 2 }}>Suspend Now</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
