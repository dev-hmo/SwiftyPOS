import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, useTheme, alpha,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Avatar, CircularProgress
} from '@mui/material';
import {
  CheckCircle, Cancel, Visibility, HourglassEmpty, Block
} from '@mui/icons-material';
import { useSaaSStore, type UpgradeRequestRecord } from '../../store/useSaaSStore';
import ViewRequestModal from './ViewRequestModal';

export default function PlanUpgradeApprovalsTab() {
  const theme = useTheme();
  const { upgradeRequests, approveUpgradeRequest, denyUpgradeRequest } = useSaaSStore();
  const [viewModal, setViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequestRecord | null>(null);
  const [denyDialog, setDenyDialog] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pending = upgradeRequests.filter((r) => r.status === 'pending');
  const processed = upgradeRequests.filter((r) => r.status !== 'pending');

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    await approveUpgradeRequest(id);
    setProcessingId(null);
  };

  const handleDeny = async () => {
    if (!selectedRequest) return;
    setProcessingId(selectedRequest.id);
    await denyUpgradeRequest(selectedRequest.id, denyReason);
    setProcessingId(null);
    setDenyDialog(false);
    setDenyReason('');
    setSelectedRequest(null);
  };

  const openDeny = (req: UpgradeRequestRecord) => {
    setSelectedRequest(req);
    setDenyDialog(true);
  };

  return (
    <>
      {/* Pending Requests */}
      <Paper elevation={0} sx={{ borderRadius: 5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden', mb: 4 }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HourglassEmpty sx={{ color: 'warning.main' }} />
          <Typography variant="h6" fontWeight={800}>Pending Approvals ({pending.length})</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.action.hover, 0.03) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Plan Change</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Payment</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Requested</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pending.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 800, fontSize: '0.75rem', width: 36, height: 36 }}>
                        {r.tenant_name.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={700} variant="body2">{r.tenant_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.requester_email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={r.current_plan} size="small" sx={{ fontWeight: 700, textTransform: 'capitalize', bgcolor: alpha('#64748b', 0.1), color: '#64748b', fontSize: '0.7rem' }} />
                      <Typography color="text.secondary" fontWeight={700}>→</Typography>
                      <Chip label={r.requested_plan} size="small" sx={{ fontWeight: 700, textTransform: 'capitalize', bgcolor: alpha('#10b981', 0.1), color: '#10b981', fontSize: '0.7rem' }} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700}>{r.amount ? `${r.amount.toLocaleString()} Ks` : '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{r.payment_method ?? '—'}</Typography>
                    {r.transaction_id && (
                      <Typography variant="caption" color="text.secondary" display="block">TX: {r.transaction_id}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{new Date(r.created_at).toLocaleDateString()}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Request">
                        <IconButton size="small" onClick={() => { setSelectedRequest(r); setViewModal(true); }} sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve">
                        <IconButton size="small" disabled={processingId === r.id} onClick={() => handleApprove(r.id)} sx={{ color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.06) }}>
                          {processingId === r.id ? <CircularProgress size={16} /> : <CheckCircle fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deny">
                        <IconButton size="small" disabled={processingId === r.id} onClick={() => openDeny(r)} sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.06) }}>
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {pending.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                    No pending upgrade requests.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Processed Requests */}
      {processed.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Block sx={{ color: 'text.secondary' }} />
            <Typography variant="h6" fontWeight={800}>Processed ({processed.length})</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.action.hover, 0.03) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Plan Change</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Reviewed</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processed.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography fontWeight={700} variant="body2">{r.tenant_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.requester_email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={r.current_plan} size="small" sx={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.7rem' }} />
                        <Typography color="text.secondary">→</Typography>
                        <Chip label={r.requested_plan} size="small" sx={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.7rem' }} />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.status} size="small"
                        color={r.status === 'approved' ? 'success' : 'error'}
                        sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{r.denial_reason ?? '—'}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* View Request Modal */}
      <ViewRequestModal open={viewModal} request={selectedRequest} onClose={() => { setViewModal(false); setSelectedRequest(null); }} />

      {/* Deny Dialog */}
      <Dialog open={denyDialog} onClose={() => setDenyDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight={800}>Deny Upgrade Request</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" mb={3}>
            Provide a reason for denying this plan upgrade request from <b>{selectedRequest?.tenant_name}</b>.
          </Typography>
          <TextField
            fullWidth multiline rows={3} placeholder="Enter denial reason..."
            value={denyReason} onChange={(e) => setDenyReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setDenyDialog(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" color="error" disabled={!denyReason.trim() || processingId === selectedRequest?.id} onClick={handleDeny} sx={{ fontWeight: 800, borderRadius: 2 }}>
            {processingId === selectedRequest?.id ? <CircularProgress size={20} color="inherit" /> : 'Deny Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
