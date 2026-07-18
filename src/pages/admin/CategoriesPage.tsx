import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  IconButton, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  Folder,
  ChevronRight,
  MoreVert
} from '@mui/icons-material';
import React from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CategoriesPage() {
  const { t } = useLanguage();
  const theme = useTheme();
  const { categories, addCategory } = useConfigStore();
  const [open, setOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewCatName('');
  };

  const handleCreate = () => {
    if (newCatName.trim()) {
      addCategory(newCatName);
      handleClose();
    }
  };

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4 } }}>
      
      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: -1.5, mb: 1, color: 'text.primary' }}>
            {t('categories.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            {t('categories.subtitle')}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          size="large"
          sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 700, boxShadow: theme.shadows[2] }} 
          onClick={handleOpen}
        >
          {t('categories.add')}
        </Button>
      </Box>

      {/* CATEGORIES GRID */}
      <AnimatePresence mode="popLayout">
        <Grid container spacing={3}>
          {categories.map((cat, idx) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={cat.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 4, 
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, 
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(10px)',
                    transition: '0.2s ease-in-out',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      borderColor: 'primary.main',
                      boxShadow: `0 8px 24px -12px ${alpha(theme.palette.primary.main, 0.25)}`
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 52, height: 52, 
                          borderRadius: 3, 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          color: 'primary.main' 
                        }}
                      >
                        <Folder />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={800} noWrap sx={{ letterSpacing: -0.5 }}>
                          {cat.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          {cat.productCount} Items Linked
                        </Typography>
                      </Box>
                      <Tooltip title="Options">
                        <IconButton size="small"><MoreVert /></IconButton>
                      </Tooltip>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" sx={{ borderRadius: 2.5, border: `1px solid ${theme.palette.divider}` }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" sx={{ borderRadius: 2.5, border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      <Button 
                        endIcon={<ChevronRight />} 
                        size="small" 
                        sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
                      >
                        {t('categories.viewProducts')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </AnimatePresence>

      {/* CREATE DIALOG - REPLACING window.prompt */}
      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: { borderRadius: 4, p: 1.5, maxWidth: 450, width: '100%' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.4rem', pb: 1 }}>
          Create Category
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" mb={2} variant="body2" fontWeight={500}>
            {t('categories.dialog.desc')}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={t('categories.dialog.name')}
            fullWidth
            variant="outlined"
            size="medium"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            sx={{ 
              '& .MuiOutlinedInput-root': { borderRadius: 3 },
              '& .MuiInputLabel-root': { fontWeight: 600 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleClose} sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleCreate} 
            variant="contained" 
            sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, py: 1 }}
            disabled={!newCatName.trim()}
          >
          {t('categories.dialog.title')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
