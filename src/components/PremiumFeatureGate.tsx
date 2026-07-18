import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Lock, Crown } from 'lucide-react';
import { useTheme, alpha } from '@mui/material/styles';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import type { Feature } from '../types/rbac';
import type { PlanTier } from '../types/tenant';
import { useUpgradeStore } from '../store/useUpgradeStore';

interface PremiumFeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
  requiredTier?: PlanTier;
  featureName: string;
}

export default function PremiumFeatureGate({ feature, children, requiredTier = 'pro', featureName }: PremiumFeatureGateProps) {
  const theme = useTheme();
  const hasAccess = useSubscriptionStore(state => state.hasAccess(feature));
  const openUpgradeModal = useUpgradeStore(state => state.openModal);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 300 }}>
      {/* Blurred out content */}
      <Box sx={{ filter: 'blur(8px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none', width: '100%', height: '100%' }}>
        {children}
      </Box>

      {/* Upgrade Overlay */}
      <Box sx={{ 
        position: 'absolute', inset: 0, 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 10
      }}>
        <Paper elevation={0} sx={{ 
          p: 5, borderRadius: 6, maxWidth: 400, textAlign: 'center',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          bgcolor: alpha('#ffffff', 0.9),
          backdropFilter: 'blur(10px)',
          boxShadow: `0 20px 40px -10px ${alpha(theme.palette.primary.main, 0.15)}`
        }}>
          <Box sx={{ 
            width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Lock size={32} />
          </Box>
          <Typography variant="h5" fontWeight={900} mb={1}>
            Upgrade Required
          </Typography>
          <Typography color="text.secondary" mb={4}>
            The <b>{featureName}</b> feature is exclusively available on the <b>{requiredTier}</b> plan and above. Upgrade your workspace to unlock advanced capabilities.
          </Typography>
          
          <Button 
            variant="contained" 
            size="large" 
            fullWidth
            startIcon={<Crown size={20} />}
            onClick={() => openUpgradeModal(requiredTier)}
            sx={{ 
               py: 1.5, borderRadius: 3, fontWeight: 800,
               background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
               boxShadow: `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.4)}`
            }}
          >
            Upgrade to {requiredTier}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
