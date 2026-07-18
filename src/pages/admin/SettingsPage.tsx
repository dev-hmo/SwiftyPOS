import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, Switch, FormControlLabel,
  Divider, Avatar, alpha, useTheme, Alert, Chip
} from '@mui/material';
import { 
  Store, Receipt, Palette, Save, RestartAlt, Print, 
  CreditCard, CloudUpload, Delete
} from '@mui/icons-material';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguage } from '../../i18n/LanguageContext';

interface StoreSettings {
  storeName: string;
  storeLogo: string;
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
  storeLogo: '',
  storeAddress: '123 Coffee Lane, Brew City, BC 10001',
  storePhone: '+1 234 567 890',
  storeEmail: 'hello@swiftypos.com',
  taxRate: '8',
  currency: 'USD',
  receiptFooter: 'Thank you for your visit!',
  enableSound: true,
  enableAnimations: true,
  enableAutoLock: false,
  autoLockTimeout: '5',
};

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  const theme = useTheme();
  return (
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
}

function getSettingsKey(): string {
  return 'pos-settings';
}

function loadSettings(): StoreSettings {
  try {
    const saved = localStorage.getItem(getSettingsKey());
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: StoreSettings) {
  localStorage.setItem(getSettingsKey(), JSON.stringify(settings));
}

export default function SettingsPage() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<StoreSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof StoreSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    saveSettings(settings);
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 3000);
  }, [settings]);

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSaved(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      handleChange('storeLogo', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    handleChange('storeLogo', '');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={800}>{t('settings.accessDenied')}</Typography>
        <Typography color="text.secondary">{t('settings.accessDeniedDesc')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{t('settings.title')}</Typography>
          <Typography color="text.secondary">{t('settings.subtitle')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RestartAlt />} onClick={handleReset} sx={{ borderRadius: 3 }}>{t('settings.reset')}</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} sx={{ borderRadius: 3, px: 3 }}>{t('settings.save')}</Button>
        </Box>
      </Box>

      {saved && <Alert severity="success" sx={{ mb: 3, borderRadius: 3, fontWeight: 700 }}>{t('settings.saved')}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, height: '100%' }}>
            <SectionHeader icon={<Store />} title={t('settings.store.title')} subtitle={t('settings.store.subtitle')} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Logo upload */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box
                  onClick={() => !settings.storeLogo && logoInputRef.current?.click()}
                  sx={{
                    width: 100, height: 100, borderRadius: 4, cursor: settings.storeLogo ? 'default' : 'pointer',
                    border: `2px dashed ${settings.storeLogo ? 'transparent' : alpha(theme.palette.primary.main, 0.4)}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative',
                    '&:hover': settings.storeLogo ? {} : { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) },
                  }}
                >
                  {settings.storeLogo ? (
                    <Box component="img" src={settings.storeLogo} alt="Store logo" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <CloudUpload sx={{ fontSize: 36, color: 'primary.main', opacity: 0.6 }} />
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{t('settings.store.logo')}</Typography>
                  <Typography variant="caption" color="text.secondary">{t('settings.store.logoHelper')}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined" size="small"
                      onClick={() => logoInputRef.current?.click()}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      {settings.storeLogo ? t('settings.store.change') : t('settings.store.upload')}
                    </Button>
                    {settings.storeLogo && (
                      <Button
                        variant="outlined" size="small" color="error"
                        startIcon={<Delete />}
                        onClick={handleLogoRemove}
                        sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                      >
                        {t('settings.store.remove')}
                      </Button>
                    )}
                  </Box>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    hidden
                    onChange={handleLogoUpload}
                  />
                </Box>
              </Box>
              {/* Text fields */}
              <TextField fullWidth label={t('settings.store.name')} value={settings.storeName} onChange={e => handleChange('storeName', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              <TextField fullWidth label={t('settings.store.address')} value={settings.storeAddress} onChange={e => handleChange('storeAddress', e.target.value)} multiline rows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField fullWidth label={t('settings.store.phone')} value={settings.storePhone} onChange={e => handleChange('storePhone', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                <TextField fullWidth label={t('settings.store.email')} value={settings.storeEmail} onChange={e => handleChange('storeEmail', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, height: '100%' }}>
            <SectionHeader icon={<CreditCard />} title={t('settings.tax.title')} subtitle={t('settings.tax.subtitle')} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField fullWidth label={t('settings.tax.rate')} type="number" value={settings.taxRate} onChange={e => handleChange('taxRate', e.target.value)} InputProps={{ endAdornment: <Chip label="%" size="small" /> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                <TextField fullWidth label={t('settings.tax.currency')} value={settings.currency} onChange={e => handleChange('currency', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>{t('settings.tax.presets')}</Typography>
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

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
            <SectionHeader icon={<Receipt />} title={t('settings.receipt.title')} subtitle={t('settings.receipt.subtitle')} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField fullWidth label={t('settings.receipt.footer')} value={settings.receiptFooter} onChange={e => handleChange('receiptFooter', e.target.value)} multiline rows={2} helperText={t('settings.receipt.footerHelper')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" fullWidth startIcon={<Print />} sx={{ borderRadius: 3 }}>{t('settings.receipt.testPrint')}</Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
            <SectionHeader icon={<Palette />} title={t('settings.system.title')} subtitle={t('settings.system.subtitle')} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel 
                control={<Switch checked={settings.enableSound} onChange={e => handleChange('enableSound', e.target.checked)} color="primary" />} 
                label={<Box><Typography fontWeight={700}>{t('settings.system.sound')}</Typography><Typography variant="caption" color="text.secondary">{t('settings.system.soundDesc')}</Typography></Box>}
                sx={{ ml: 0, py: 1 }}
              />
              <Divider />
              <FormControlLabel 
                control={<Switch checked={settings.enableAnimations} onChange={e => handleChange('enableAnimations', e.target.checked)} color="primary" />} 
                label={<Box><Typography fontWeight={700}>{t('settings.system.animations')}</Typography><Typography variant="caption" color="text.secondary">{t('settings.system.animationsDesc')}</Typography></Box>}
                sx={{ ml: 0, py: 1 }}
              />
              <Divider />
              <FormControlLabel 
                control={<Switch checked={settings.enableAutoLock} onChange={e => handleChange('enableAutoLock', e.target.checked)} color="primary" />} 
                label={<Box><Typography fontWeight={700}>{t('settings.system.autoLock')}</Typography><Typography variant="caption" color="text.secondary">{t('settings.system.autoLockDesc')}</Typography></Box>}
                sx={{ ml: 0, py: 1 }}
              />
              {settings.enableAutoLock && (
                <TextField 
                  size="small" 
                  label={t('settings.system.lockAfter')} 
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
