import { useState, useEffect, memo } from 'react';
import {
  Box, Typography, Grid, Paper, Chip, Button,
  alpha, Avatar, LinearProgress
} from '@mui/material';
import { 
  Restaurant, Timer, CheckCircle, LocalCafe, 
  NotificationsActive, AccessTime 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumFeatureGate from '../../components/PremiumFeatureGate';
import { useKDSStore, type KDSOrder } from '../../store/useKDSStore';

// Orders now managed via global useKDSStore

function getElapsedTime(createdAt: number) {
  const diff = Math.floor((Date.now() - createdAt) / 1000);
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getStatusColor(status: KDSOrder['status']) {
  switch (status) {
    case 'NEW': return '#ef4444';
    case 'IN_PROGRESS': return '#f59e0b';
    case 'READY': return '#10b981';
  }
}

function getStatusIcon(status: KDSOrder['status']) {
  switch (status) {
    case 'NEW': return <NotificationsActive />;
    case 'IN_PROGRESS': return <Timer />;
    case 'READY': return <CheckCircle />;
  }
}

// ⚡ CRITICAL: OrderCard is defined OUTSIDE of KitchenDisplayPage
// and wrapped in React.memo so the 1-second timer tick doesn't
// destroy/recreate it and replay Framer Motion animations.
const OrderCard = memo(({ order, onAdvance }: { order: KDSOrder; onAdvance: (id: string) => void }) => {
  const statusColor = getStatusColor(order.status);
  const [elapsed, setElapsed] = useState(getElapsedTime(order.createdAt));
  const [isUrgent, setIsUrgent] = useState(false);

  // Each card manages its own timer — no parent re-render needed
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedTime(order.createdAt));
      setIsUrgent(Math.floor((Date.now() - order.createdAt) / 1000) > 300);
    }, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5, 
          borderRadius: 4, 
          border: `2px solid ${isUrgent && order.status !== 'READY' ? '#ef4444' : alpha(statusColor, 0.3)}`,
          bgcolor: isUrgent && order.status !== 'READY' ? alpha('#ef4444', 0.03) : alpha('#fff', 0.06),
          transition: 'border-color 0.3s ease, background-color 0.3s ease',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: alpha(statusColor, 0.15), color: statusColor, width: 36, height: 36 }}>
              {getStatusIcon(order.status)}
            </Avatar>
            <Box>
              <Typography fontWeight={800} variant="subtitle2" color="white">{order.receiptNumber}</Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.5) }}>{order.cashier}</Typography>
            </Box>
          </Box>
          <Chip 
            icon={<AccessTime sx={{ fontSize: 14, color: isUrgent ? '#ef4444' : alpha('#fff', 0.5) }} />}
            label={elapsed} 
            size="small" 
            sx={{ 
              fontWeight: 900, 
              bgcolor: isUrgent ? alpha('#ef4444', 0.15) : alpha('#fff', 0.08),
              color: isUrgent ? '#ef4444' : alpha('#fff', 0.7),
              borderRadius: 2 
            }} 
          />
        </Box>

        {/* Progress bar for in-progress */}
        {order.status === 'IN_PROGRESS' && (
          <LinearProgress 
            variant="indeterminate" 
            sx={{ mb: 2, borderRadius: 2, height: 4, bgcolor: alpha('#f59e0b', 0.15), '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' } }} 
          />
        )}

        {/* Items */}
        <Box sx={{ mb: 2 }}>
          {order.items.map((item, idx) => (
            <Box key={idx} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={700} color="white">{item.name}</Typography>
                <Chip label={`x${item.quantity}`} size="small" sx={{ fontWeight: 900, height: 22, minWidth: 32, bgcolor: alpha('#fff', 0.1), color: 'white' }} />
              </Box>
              {item.notes && (
                <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, pl: 1 }}>
                  ⚠ {item.notes}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Action */}
        <Button
          fullWidth
          variant="contained"
          onClick={() => onAdvance(order.id)}
          sx={{ 
            borderRadius: 3, 
            fontWeight: 800, 
            py: 1.2,
            bgcolor: statusColor,
            color: 'white',
            '&:hover': { bgcolor: statusColor, filter: 'brightness(0.85)' }
          }}
        >
          {order.status === 'NEW' ? '🔥 START PREPARING' : order.status === 'IN_PROGRESS' ? '✅ MARK READY' : '🎉 SERVED'}
        </Button>
      </Paper>
    </motion.div>
  );
});

OrderCard.displayName = 'OrderCard';

// ─── MAIN PAGE ────────────────────────────────────────────────────────
export default function KitchenDisplayPage() {
  const { orders, advanceStatus } = useKDSStore();

  const newOrders = orders.filter(o => o.status === 'NEW');
  const inProgress = orders.filter(o => o.status === 'IN_PROGRESS');
  const ready = orders.filter(o => o.status === 'READY');

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh', 
      bgcolor: '#0f172a', 
      color: 'white', 
      p: { xs: 2, md: 4 } 
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: alpha('#E07B39', 0.2), color: '#E07B39', width: 52, height: 52 }}>
            <Restaurant sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -0.5, color: 'white' }}>Kitchen Display</Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.5), fontWeight: 600 }}>
              {orders.length} orders in queue
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip icon={<LocalCafe sx={{ color: '#ef4444 !important' }} />} label={`${newOrders.length} New`} sx={{ fontWeight: 800, bgcolor: alpha('#ef4444', 0.15), color: '#ef4444' }} />
          <Chip icon={<Timer sx={{ color: '#f59e0b !important' }} />} label={`${inProgress.length} Preparing`} sx={{ fontWeight: 800, bgcolor: alpha('#f59e0b', 0.15), color: '#f59e0b' }} />
          <Chip icon={<CheckCircle sx={{ color: '#10b981 !important' }} />} label={`${ready.length} Ready`} sx={{ fontWeight: 800, bgcolor: alpha('#10b981', 0.15), color: '#10b981' }} />
        </Box>
      </Box>

      {/* Order Columns */}
      <PremiumFeatureGate feature="kds" featureName="Kitchen Display System" requiredTier="pro">
        <Grid container spacing={3}>
          {/* NEW ORDERS */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
              <Typography variant="h6" fontWeight={800} color="white">New Orders</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence mode="popLayout">
                {newOrders.map(order => <OrderCard key={order.id} order={order} onAdvance={advanceStatus} />)}
              </AnimatePresence>
              {newOrders.length === 0 && (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: alpha('#fff', 0.03) }}>
                  <Typography sx={{ color: alpha('#fff', 0.3) }}>Waiting for orders...</Typography>
                </Paper>
              )}
            </Box>
          </Grid>

          {/* IN PROGRESS */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
              <Typography variant="h6" fontWeight={800} color="white">In Progress</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence mode="popLayout">
                {inProgress.map(order => <OrderCard key={order.id} order={order} onAdvance={advanceStatus} />)}
              </AnimatePresence>
              {inProgress.length === 0 && (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: alpha('#fff', 0.03) }}>
                  <Typography sx={{ color: alpha('#fff', 0.3) }}>No active preparations</Typography>
                </Paper>
              )}
            </Box>
          </Grid>

          {/* READY */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <Typography variant="h6" fontWeight={800} color="white">Ready to Serve</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AnimatePresence mode="popLayout">
                {ready.map(order => <OrderCard key={order.id} order={order} onAdvance={advanceStatus} />)}
              </AnimatePresence>
              {ready.length === 0 && (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: alpha('#fff', 0.03) }}>
                  <Typography sx={{ color: alpha('#fff', 0.3) }}>No orders ready</Typography>
                </Paper>
              )}
            </Box>
          </Grid>
        </Grid>
      </PremiumFeatureGate>
    </Box>
  );
}
