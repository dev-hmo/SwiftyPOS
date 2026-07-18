import {
  Dialog, Box, Typography, IconButton, Chip, Divider, Grid,
  useTheme, alpha, Button
} from '@mui/material';
import { Close, CalendarMonth, CreditCard, Receipt, OpenInNew } from '@mui/icons-material';
import type { UpgradeRequestRecord } from '../../store/useSaaSStore';

interface ViewRequestModalProps {
  open: boolean;
  request: UpgradeRequestRecord | null;
  onClose: () => void;
}

const PLAN_COLORS: Record<string, string> = {
  enterprise: '#8b5cf6', pro: '#3b82f6', standard: '#10b981', free: '#64748b',
};

export default function ViewRequestModal({ open, request, onClose }: ViewRequestModalProps) {
  const theme = useTheme();
  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Typography variant="h6" fontWeight={800}>Upgrade Request Details</Typography>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: alpha(theme.palette.action.hover, 0.05) }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 4 }}>
        {/* Customer Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha(PLAN_COLORS[request.requested_plan] || '#64748b', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: PLAN_COLORS[request.requested_plan] || '#64748b', fontSize: '0.9rem' }}>
            {request.tenant_name.slice(0, 2).toUpperCase()}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={800}>{request.tenant_name}</Typography>
            <Typography variant="caption" color="text.secondary">{request.requester_email}</Typography>
          </Box>
          <Chip
            label={request.status} size="small"
            color={request.status === 'approved' ? 'success' : request.status === 'denied' ? 'error' : 'warning'}
            sx={{ fontWeight: 700, textTransform: 'capitalize' }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Plan Change */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mb: 4 }}>
          <Box sx={{ textAlign: 'center', p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, minWidth: 140 }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary">Current Plan</Typography>
            <Typography variant="h5" fontWeight={900} sx={{ textTransform: 'capitalize', color: PLAN_COLORS[request.current_plan] }}>{request.current_plan}</Typography>
          </Box>
          <Typography variant="h4" fontWeight={900} color="text.secondary">→</Typography>
          <Box sx={{ textAlign: 'center', p: 3, borderRadius: 3, bgcolor: alpha(PLAN_COLORS[request.requested_plan] || '#64748b', 0.05), border: `2px solid ${PLAN_COLORS[request.requested_plan] || '#64748b'}`, minWidth: 140 }}>
            <Typography variant="overline" fontWeight={700} color="text.secondary">Requested Plan</Typography>
            <Typography variant="h5" fontWeight={900} sx={{ textTransform: 'capitalize', color: PLAN_COLORS[request.requested_plan] }}>{request.requested_plan}</Typography>
          </Box>
        </Box>

        {/* Transaction Details */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Requested</Typography>
              </Box>
              <Typography variant="body2" fontWeight={800}>{new Date(request.created_at).toLocaleDateString()}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <CreditCard sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Amount</Typography>
              </Box>
              <Typography variant="body2" fontWeight={800}>{request.amount ? `${request.amount.toLocaleString()} Ks` : '—'}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Receipt sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Payment Method</Typography>
              </Box>
              <Typography variant="body2" fontWeight={800}>{request.payment_method ?? '—'}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.03), border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Receipt sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>Transaction ID</Typography>
              </Box>
              <Typography variant="body2" fontWeight={800}>{request.transaction_id ?? '—'}</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Payment Screenshot */}
        {request.screenshot_url && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Payment Screenshot</Typography>
            <Box sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: 'white', p: 1 }}>
              <Box
                component="img"
                src={request.screenshot_url}
                alt="Payment screenshot"
                sx={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 2 }}
              />
            </Box>
            <Button
              size="small" startIcon={<OpenInNew />}
              href={request.screenshot_url} target="_blank" rel="noopener noreferrer"
              sx={{ mt: 1, fontWeight: 700, textTransform: 'none' }}
            >
              Open Full Size
            </Button>
          </Box>
        )}

        {/* Denial Reason (if denied) */}
        {request.status === 'denied' && request.denial_reason && (
          <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.error.main, 0.05), border: `1px dashed ${alpha(theme.palette.error.main, 0.3)}` }}>
            <Typography variant="caption" fontWeight={700} color="error.main">DENIAL REASON</Typography>
            <Typography variant="body2" fontWeight={600}>{request.denial_reason}</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onClose} sx={{ fontWeight: 700 }}>Close</Button>
      </Box>
    </Dialog>
  );
}
