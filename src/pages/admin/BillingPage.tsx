import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip,
  Avatar, useTheme, alpha, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Alert
} from '@mui/material';
import {
  WorkspacePremium, CheckCircle, CreditCard, CalendarMonth,
  ArrowUpward, Receipt, HourglassEmpty
} from '@mui/icons-material';
import { useTenantStore } from '../../store/useTenantStore';
import { useUpgradeStore } from '../../store/useUpgradeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import type { PlanTier } from '../../types/tenant';
import { motion } from 'framer-motion';

const PLAN_DETAILS: Record<PlanTier, { price: number; label: string; features: string[]; color: string }> = {
  free: { price: 0, label: 'Free', features: ['Basic POS', '1 Store', 'Limited Reports'], color: '#64748b' },
  standard: { price: 9000, label: 'Standard', features: ['Full POS', '14-Day Trial', 'Standard Reports', 'KDS Access'], color: '#10b981' },
  pro: { price: 29000, label: 'Pro', features: ['KDS + BOM', 'Advanced Analytics', 'Recipe Costing', 'Priority Support'], color: '#3b82f6' },
  enterprise: { price: 79000, label: 'Enterprise', features: ['Custom RBAC', 'Multi-Store', '24/7 Priority Support', 'Custom Integrations'], color: '#8b5cf6' },
};

const MOCK_PAYMENTS = [
  { id: '1', date: '2026-07-01', amount: 29000, method: 'KBZPay', status: 'Paid' },
  { id: '2', date: '2026-06-01', amount: 29000, method: 'WavePay', status: 'Paid' },
  { id: '3', date: '2026-05-01', amount: 9000, method: 'AYA Pay', status: 'Paid' },
];

const PLAN_ORDER: PlanTier[] = ['free', 'standard', 'pro', 'enterprise'];

function computeRenewalDate(joinDateStr: string): Date {
  const d = new Date(joinDateStr);
  const now = new Date();
  while (d <= now) d.setMonth(d.getMonth() + 1);
  return d;
}

export default function BillingPage() {
  const theme = useTheme();
  const { activeTenant, loadTenant } = useTenantStore();
  const { openModal } = useUpgradeStore();
  const [pendingRequest, setPendingRequest] = useState<{ requested_plan: PlanTier; created_at: string } | null>(null);

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  // Fetch pending upgrade request for current tenant
  useEffect(() => {
    const fetchPending = async () => {
      const user = useAuthStore.getState().user;
      if (!user?.id || !activeTenant?.id) return;

      const { data } = await supabase
        .from('upgrade_requests')
        .select('requested_plan, created_at')
        .eq('tenant_id', activeTenant.id)
        .eq('requested_by', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setPendingRequest(data as { requested_plan: PlanTier; created_at: string } | null);
    };

    fetchPending();
  }, [activeTenant?.id]);

  // Use the DB plan from activeTenant, fall back to 'free'
  const currentPlan: PlanTier = (activeTenant?.plan as PlanTier) || 'free';
  const currentPlanDetails = PLAN_DETAILS[currentPlan];

  const renewalDate = activeTenant?.created_at ? computeRenewalDate(activeTenant.created_at) : new Date();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} letterSpacing={-1}>Billing & Plan</Typography>
        <Typography color="text.secondary">Manage your subscription, view payment history, and upgrade your workspace.</Typography>
      </Box>

      {/* Current Plan Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 5, mb: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: alpha(currentPlanDetails.color, 0.02) }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: alpha(currentPlanDetails.color, 0.12), color: currentPlanDetails.color, width: 64, height: 64 }}>
                <WorkspacePremium sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="overline" fontWeight={800} color="text.secondary" sx={{ letterSpacing: 2 }}>CURRENT PLAN</Typography>
                <Typography variant="h4" fontWeight={900} sx={{ textTransform: 'capitalize', color: currentPlanDetails.color }}>{currentPlanDetails.label}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {activeTenant?.subscription_status === 'trial' && (
                    <Chip label="Trial" size="small" color="warning" sx={{ fontWeight: 700 }} />
                  )}
                  <Chip label={activeTenant?.subscription_status || 'active'} size="small" color="success" sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
                </Box>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h3" fontWeight={900} color="primary.main">
                {currentPlanDetails.price === 0 ? 'Free' : `${currentPlanDetails.price.toLocaleString()} Ks`}
              </Typography>
              {currentPlanDetails.price !== 0 && (
                <Typography variant="body2" color="text.secondary" fontWeight={600}>per month</Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonth sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Registered</Typography>
                <Typography variant="body2" fontWeight={800}>{activeTenant?.created_at ? new Date(activeTenant.created_at).toLocaleDateString() : 'N/A'}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCard sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Next Renewal</Typography>
                <Typography variant="body2" fontWeight={800}>{renewalDate.toLocaleDateString()}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Receipt sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Workspace</Typography>
                <Typography variant="body2" fontWeight={800}>{activeTenant?.name || 'N/A'}</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Pending Upgrade Request */}
      {pendingRequest && (
        <Alert severity="info" icon={<HourglassEmpty />} sx={{ mb: 4, borderRadius: 3 }}>
          <Typography variant="body2" fontWeight={800}>
            Upgrade to {PLAN_DETAILS[pendingRequest.requested_plan].label} is pending approval
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Requested on {new Date(pendingRequest.created_at).toLocaleDateString()} — a platform administrator will review your payment shortly.
          </Typography>
        </Alert>
      )}

      {/* Plan Comparison */}
      <Typography variant="h6" fontWeight={800} mb={2}>Available Plans</Typography>
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {PLAN_ORDER.filter(p => p !== 'free').map((tier, i) => {
          const plan = PLAN_DETAILS[tier];
          const isCurrent = currentPlan === tier;
          const canUpgrade = PLAN_ORDER.indexOf(tier) > PLAN_ORDER.indexOf(currentPlan);
          return (
            <Grid size={{ xs: 12, md: 4 }} key={tier}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card
                  elevation={isCurrent ? 4 : 0}
                  sx={{
                    borderRadius: 4, height: '100%', position: 'relative',
                    border: `2px solid ${isCurrent ? plan.color : alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: isCurrent ? alpha(plan.color, 0.02) : 'background.paper',
                  }}
                >
                  {isCurrent && (
                    <Box sx={{ position: 'absolute', top: -10, right: 16, bgcolor: plan.color, color: 'white', px: 1.5, py: 0.3, borderRadius: 2, fontSize: '0.7rem', fontWeight: 800 }}>
                      CURRENT
                    </Box>
                  )}
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={900} sx={{ textTransform: 'capitalize', color: plan.color }}>{plan.label}</Typography>
                    <Typography variant="h4" fontWeight={900} my={1}>
                      {plan.price.toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">Ks/mo</Typography>
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                      {plan.features.map((f, fi) => (
                        <Typography key={fi} variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} /> {f}
                        </Typography>
                      ))}
                    </Box>
                    {isCurrent ? (
                      <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 3, fontWeight: 800, py: 1.2 }}>
                        Current Plan
                      </Button>
                    ) : pendingRequest?.requested_plan === tier ? (
                      <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 3, fontWeight: 800, py: 1.2, borderColor: 'info.main', color: 'info.main' }}>
                        Request Pending
                      </Button>
                    ) : canUpgrade ? (
                      <Button
                        fullWidth variant="contained"
                        startIcon={<ArrowUpward />}
                        onClick={() => openModal(tier)}
                        sx={{ borderRadius: 3, fontWeight: 800, py: 1.2, bgcolor: plan.color, '&:hover': { bgcolor: plan.color, filter: 'brightness(0.9)' } }}
                      >
                        Upgrade
                      </Button>
                    ) : (
                      <Button fullWidth variant="outlined" disabled sx={{ borderRadius: 3, fontWeight: 800, py: 1.2 }}>
                        Downgrade
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Payment History */}
      <Typography variant="h6" fontWeight={800} mb={2}>Payment History</Typography>
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.action.hover, 0.03) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Method</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_PAYMENTS.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                    <CalendarMonth sx={{ fontSize: 16 }} />
                    <Typography variant="body2">{new Date(p.date).toLocaleDateString()}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={700}>{p.amount.toLocaleString()} Ks</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{p.method}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={p.status} size="small" color="success" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                </TableCell>
              </TableRow>
            ))}
            {MOCK_PAYMENTS.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                  No payment history yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
