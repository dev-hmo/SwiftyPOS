import { useState } from 'react';
import { 
  Box, Typography, Paper, Button, Chip, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormGroup, FormControlLabel, Checkbox, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  useTheme, alpha
} from '@mui/material';
import { Add, Edit, Delete, Security, VerifiedUser } from '@mui/icons-material';
import { useRolesStore } from '../../store/useRolesStore';
import { SYSTEM_MODULES } from '../../types/rbac';
import type { Role } from '../../types/rbac';
import { useLanguage } from '../../i18n/LanguageContext';


export default function RolesPage() {
  const { t } = useLanguage();
  const theme = useTheme();
  const { roles, addRole, updateRole, deleteRole } = useRolesStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  const [formData, setFormData] = useState<{name: string, description: string, permissions: string[]}>({
    name: '',
    description: '',
    permissions: []
  });

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const handleTogglePermission = (moduleName: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(moduleName)
        ? prev.permissions.filter(p => p !== moduleName)
        : [...prev.permissions, moduleName]
    }));
  };

  const handleSave = () => {
    if (editingRole) {
      updateRole(editingRole.id, formData);
    } else {
      addRole({
        id: formData.name.toLowerCase().replace(/\s+/g, '-'),
        isCustom: true,
        ...formData
      });
    }
    handleCloseModal();
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Security color="primary" /> {t('roles.title')}
          </Typography>
          <Typography color="text.secondary">
            {t('roles.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: 3, px: 3, py: 1 }}
        >
          {t('roles.createRole')}
        </Button>
      </Box>

      {/* Roles Table - Visible to everyone */}
      <Box>
        {/* Roles Table */}
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>{t('roles.col.name')}</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>{t('roles.col.description')}</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>{t('roles.col.type')}</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>{t('roles.col.modules')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{t('roles.col.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <Typography fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {!role.isCustom && <VerifiedUser fontSize="small" color="primary" />}
                      {role.name}
                    </Typography>
                  </TableCell>
                  <TableCell color="text.secondary">{role.description}</TableCell>
                  <TableCell>
                    <Chip 
                      label={role.isCustom ? t('roles.custom') : t('roles.systemDefault')} 
                      size="small"
                      color={role.isCustom ? 'default' : 'primary'}
                      variant={role.isCustom ? 'outlined' : 'filled'}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {role.id === 'admin' ? (
                        <Chip label={t('roles.allModules')} size="small" color="success" sx={{ borderRadius: 1.5, fontWeight: 700 }} />
                      ) : (
                        role.permissions.map(p => (
                          <Chip key={p} label={p} size="small" sx={{ borderRadius: 1.5, bgcolor: alpha(theme.palette.divider, 0.05) }} />
                        ))
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpenModal(role)} disabled={role.id === 'admin'}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => deleteRole(role.id)} disabled={!role.isCustom}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingRole ? 'Edit Role Permissions' : 'Create Custom Role'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderBottom: 'none' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label={t('roles.dialog.name')} 
                fullWidth 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                disabled={editingRole !== null && !editingRole.isCustom}
                autoFocus
              />
              <TextField 
                label={t('roles.dialog.desc')} 
                fullWidth 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 2 }}>
                {t('roles.dialog.permissions')}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                <FormGroup row sx={{ gap: 2 }}>
                  {SYSTEM_MODULES.map(module => (
                    <FormControlLabel
                      key={module}
                      control={
                        <Checkbox 
                          checked={formData.permissions.includes(module)}
                          onChange={() => handleTogglePermission(module)}
                          color="primary"
                        />
                      }
                      label={module}
                      sx={{ minWidth: 200 }}
                    />
                  ))}
                </FormGroup>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseModal} sx={{ borderRadius: 3 }}>{t('common.cancel')}</Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={!formData.name.trim()}
            sx={{ borderRadius: 3, px: 4 }}
          >
            {editingRole ? t('common.save') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
