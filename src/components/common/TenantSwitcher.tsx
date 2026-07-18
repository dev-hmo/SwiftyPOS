import { useState } from 'react';
import {
  Typography,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import { Business as BusinessIcon, Check, SwapHoriz } from '@mui/icons-material';
import { useAuthStore } from '../../store/useAuthStore';
import { useTenantStore } from '../../store/useTenantStore';

export default function TenantSwitcher() {
  const theme = useTheme();
  const { user, switchTenant } = useAuthStore();
  const { membershipDetails, switchTenant: switchTenantContext } = useTenantStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (membershipDetails.length <= 1) return null;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSwitch = async (tenantId: string) => {
    if (tenantId === user?.tenantId) { handleClose(); return; }
    await switchTenantContext(tenantId);
    await switchTenant(tenantId);
    handleClose();
  };

  return (
    <>
      <Chip
        icon={<SwapHoriz sx={{ fontSize: 16 }} />}
        label={membershipDetails.find((m) => m.tenant_id === user?.tenantId)?.tenant_name ?? 'Switch Workspace'}
        onClick={handleOpen}
        size="small"
        sx={{
          borderRadius: 3,
          fontWeight: 700,
          cursor: 'pointer',
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
        }}
      />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 260, mt: 1, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.08)}` } } }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" sx={{ px: 2.5, py: 1.5, display: 'block' }}>
          Workspaces
        </Typography>
        <Divider sx={{ mb: 0.5 }} />
        {membershipDetails.map((m) => {
          const isActive = m.tenant_id === user?.tenantId;
          return (
            <MenuItem
              key={m.tenant_id}
              onClick={() => handleSwitch(m.tenant_id)}
              selected={isActive}
              sx={{ py: 1.5, px: 2.5, borderRadius: 2, mx: 1, mb: 0.25 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Avatar
                  sx={{
                    width: 32, height: 32, borderRadius: 2,
                    bgcolor: isActive ? 'primary.main' : alpha(theme.palette.action.active, 0.08),
                    color: isActive ? 'white' : 'text.secondary',
                    fontSize: '0.75rem', fontWeight: 800,
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 16 }} />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={m.tenant_name}
                secondary={m.role.replace('_', ' ')}
                primaryTypographyProps={{ fontWeight: isActive ? 800 : 600, fontSize: '0.9rem' }}
                secondaryTypographyProps={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}
              />
              {isActive && <Check sx={{ ml: 1, color: 'primary.main', fontSize: 18 }} />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
