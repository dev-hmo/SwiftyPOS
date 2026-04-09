import { useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, Switch, FormControlLabel,
  Divider, Avatar, alpha, useTheme, Alert, Chip
} from '@mui/material';
import { 
  Store, Receipt, Palette, Save, RestartAlt, Print, 
  CreditCard, WorkspacePremium
} from '@mui/icons-material';
import { useSubscriptionStore, type PlanTier } from '../../store/useSubscriptionStore';
import { useUpgradeStore } from '../../store/useUpgradeStore';

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  taxRate: string;
  currency: string;
  receiptFooter: string;
  enableSound: boolean;
  enableAnimations: boolean;
  enableAutoLock: boolean;
  autoLockTimeout: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Swifty POS',
  storeAddress: '123 Coffee Lane, Brew City, BC 10001',
  storePhone: '+1 234 567 890',
  storeEmail: 'hello@swiftypos.com',
  taxRate: '8',
  currency: 'USD',
  receiptFooter: 'Thank you for your visit! ☕',
  enableSound: true,
  enableAnimations: true,
  enableAutoLock: false,
  autoLockTimeout: '5',
};

export default function SettingsPage() {
  const theme = useTheme();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  
  const { currentPlan, setPlan } = useSubscriptionStore();
  const openUpgradeModal = useUpgradeStore(state => state.openModal);

  const handleChange = (field: keyof StoreSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('pos-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSaved(false);
  };

  const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 44, height: 44, borderRadius: 3 }}>
        {icon}
      </Avatar>
      <Box>
        <Typography variant="h6" fontWeight={800}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Global Settings</Typography>
          <Typography color="text.secondary">Configure your store, receipt, and system preferences.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RestartAlt />} onClick={handleReset} sx={{ borderRadius: 3 }}>Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} sx={{ borderRadius: 3, px: 3 }}>Save Changes</Button>
        </Box>
      </Box>

      {saved && <Alert severity="success" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>Settings saved successfully!</Alert>}

      <Grid container spacing={3}>
        {/* Store Information */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, height: '100%' }}>
            <SectionHeader icon={<Store />} title="Store Information" subtitle="Your business profile and branding" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField fullWidth label="Store Name" value={settings.storeName} onChange={e => handleChange('storeName', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              <TextField fullWidth label="Address" value={settings.storeAddress} onChange={e => handleChange('storeAddress', e.target.value)} multiline rows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField fullWidth label="Phone" value={settings.storePhone} onChange={e => handleChange('storePhone', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                <TextField fullWidth label="Email" value={settings.storeEmail} onChange={e => handleChange('storeEmail', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Tax & Currency */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, height: '100%' }}>
            <SectionHeader icon={<CreditCard />} title="Tax & Currency" subtitle="Configure tax rates and regional settings" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField fullWidth label="Tax Rate (%)" type="number" value={settings.taxRate} onChange={e => handleChange('taxRate', e.target.value)} InputProps={{ endAdornment: <Chip label="%" size="small" /> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                <TextField fullWidth label="Currency" value={settings.currency} onChange={e => handleChange('currency', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Quick Presets</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { label: 'US (8%)', tax: '8', currency: 'USD' },
                  { label: 'UK (20%)', tax: '20', currency: 'GBP' },
                  { label: 'SG (9%)', tax: '9', currency: 'SGD' },
                  { label: 'MM (5%)', tax: '5', currency: 'MMK' },
                ].map(preset => (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    clickable
                    onClick={() => { handleChange('taxRate', preset.tax); handleChange('currency', preset.currency); }}
                    variant="outlined"
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  />
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Receipt Configuration */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
            <SectionHeader icon={<Receipt />} title="Receipt Configuration" subtitle="Customize printable receipt content" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField fullWidth label="Receipt Footer Message" value={settings.receiptFooter} onChange={e => handleChange('receiptFooter', e.target.value)} multiline rows={2} helperText="This message appears at the bottom of every receipt" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" fullWidth startIcon={<Print />} sx={{ borderRadius: 3 }}>Test Print</Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Subscription & Billing */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, height: '100%' }}>
            <SectionHeader icon={<WorkspacePremium />} title="Workspace Subscription" subtitle="Manage your Swifty POS billing tier" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ p: 3, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Typography variant="overline" color="text.secondary" fontWeight={800}>Current Plan</Typography>
                <Typography variant="h4" color="primary.main" fontWeight={900}>{currentPlan}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Manage Plan Enrollment</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(['Starter', 'Pro', 'Enterprise'] as PlanTier[]).map(plan => (
                  <Chip
                    key={plan}
                    label={plan}
                    clickable
                    onClick={() => {
                      // If it's the current plan, do nothing
                      if (currentPlan === plan) return;
                      // Trigger upgrade modal
                      openUpgradeModal(plan);
                    }}
                    onDelete={() => {
                      // Secret Admin Shortcut to force switch plan instantly without payment
                      setPlan(plan);
                    }}
                    deleteIcon={currentPlan !== plan ? <Store sx={{ fontSize: 16 }} titleAccess="Developer Force Switch" /> : undefined}
                    variant={currentPlan === plan ? 'filled' : 'outlined'}
                    color={currentPlan === plan ? 'primary' : 'default'}
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  />
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* System Preferences */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
            <SectionHeader icon={<Palette />} title="System Preferences" subtitle="Control behavior and UI settings" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel 
                control={<Switch checked={settings.enableSound} onChange={e => handleChange('enableSound', e.target.checked)} color="primary" />} 
                label={<Box><Typography fontWeight={700}>Sound Effects</Typography><Typography variant="caption" color="text.secondary">Play audio on scan, payment, and errors</Typography></Box>}
                sx={{ ml: 0, py: 1 }}
              />
              <Divider />
              <FormControlLabel 
                control={<Switch checked={settings.enableAnimations} onChange={e => handleChange('enableAnimations', e.target.checked)} color="primary" />} 
                label={<Box><Typography fontWeight={700}>Animations</Typography><Typography variant="caption" color="text.secondary">Enable smooth transitions and micro-interactions</Typography></Box>}
                sx={{ ml: 0, py: 1 }}
              />
              <Divider />
              <FormControlLabel 
                control={<Switch checked={settings.enableAutoLock} onChange={e => handleChange('enableAutoLock', e.target.checked)} color="primary" />} 
                label={<Box><Typography fontWeight={700}>Auto-Lock Terminal</Typography><Typography variant="caption" color="text.secondary">Lock the POS screen after inactivity</Typography></Box>}
                sx={{ ml: 0, py: 1 }}
              />
              {settings.enableAutoLock && (
                <TextField 
                  size="small" 
                  label="Lock after (minutes)" 
                  type="number" 
                  value={settings.autoLockTimeout} 
                  onChange={e => handleChange('autoLockTimeout', e.target.value)} 
                  sx={{ mt: 1, width: 200, '& .MuiOutlinedInput-root': { borderRadius: 3 } }} 
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
