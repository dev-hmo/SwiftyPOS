import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SentimentVeryDissatisfied, Home, PointOfSale } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#F9F6F3',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha('#E07B39', 0.08)} 0%, transparent 70%)`,
        top: '-10%',
        right: '-5%',
        zIndex: 0,
      }
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1, px: 4 }}>
          <SentimentVeryDissatisfied sx={{
            fontSize: 120,
            color: alpha('#E07B39', 0.3),
            mb: 2,
          }} />
          <Typography
            variant="h1"
            sx={{
              fontFamily: '"Outfit"',
              fontWeight: 900,
              fontSize: { xs: '5rem', md: '8rem' },
              color: '#E07B39',
              letterSpacing: -4,
              lineHeight: 1,
              mb: 1,
            }}
          >
            404
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Outfit"',
              fontWeight: 700,
              color: 'text.primary',
              mb: 1,
            }}
          >
            Page Not Found
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              mb: 5,
              maxWidth: 420,
              mx: 'auto',
            }}
          >
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={() => navigate('/admin')}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                fontSize: '0.95rem',
              }}
            >
              Dashboard
            </Button>
            <Button
              variant="outlined"
              startIcon={<PointOfSale />}
              onClick={() => navigate('/pos')}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                fontSize: '0.95rem',
                borderColor: '#E07B39',
                color: '#E07B39',
                '&:hover': {
                  borderColor: '#B05D28',
                  bgcolor: alpha('#E07B39', 0.05),
                },
              }}
            >
              POS Terminal
            </Button>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
