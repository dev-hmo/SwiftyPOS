import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Avatar, alpha, IconButton } from '@mui/material';
import { Lock, Fingerprint } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';

interface LockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export default function LockScreen({ isLocked, onUnlock }: LockScreenProps) {
  const { user } = useAuthStore();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePinInput = useCallback((digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    
    if (newPin.length === 4) {
      // Simple PIN check (in production, validate against backend)
      if (newPin === '1234') {
        setTimeout(() => {
          setPin('');
          onUnlock();
        }, 300);
      } else {
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin('');
        }, 600);
      }
    }
  }, [pin, onUnlock]);

  const handleClear = () => setPin('');

  if (!isLocked) return null;

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Background */}
          <Box sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '20%',
              left: '10%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha('#E07B39', 0.08)} 0%, transparent 70%)`,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '10%',
              right: '15%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha('#3b82f6', 0.05)} 0%, transparent 70%)`,
            }
          }} />

          {/* Clock */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 48 }}
          >
            <Typography sx={{ 
              fontSize: { xs: '4rem', md: '6rem' }, 
              fontWeight: 200, 
              color: 'white', 
              letterSpacing: 8,
              lineHeight: 1 
            }}>
              {hours}:{minutes}
            </Typography>
            <Typography sx={{ 
              color: alpha('#fff', 0.4), 
              fontWeight: 600, 
              fontSize: '1.1rem',
              letterSpacing: 2,
              mt: 1
            }}>
              {dateStr}
            </Typography>
          </motion.div>

          {/* User Avatar + Info */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 40 }}
          >
            <Avatar sx={{ 
              width: 80, height: 80, mx: 'auto', mb: 2,
              bgcolor: alpha('#E07B39', 0.2), 
              color: '#E07B39',
              fontSize: '2rem',
              fontWeight: 800,
              border: `3px solid ${alpha('#E07B39', 0.3)}`
            }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
              {user?.email || 'User'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
              <Lock sx={{ fontSize: 14, color: alpha('#fff', 0.3) }} />
              <Typography sx={{ color: alpha('#fff', 0.3), fontWeight: 600, fontSize: '0.85rem' }}>
                Terminal Locked
              </Typography>
            </Box>
          </motion.div>

          {/* PIN Dots */}
          <motion.div
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            style={{ position: 'relative', zIndex: 1, marginBottom: 32 }}
          >
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: i < pin.length ? 1.2 : 1,
                    backgroundColor: i < pin.length ? '#E07B39' : alpha('#fff', 0.15)
                  }}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: `2px solid ${alpha('#fff', 0.2)}`,
                  }}
                />
              ))}
            </Box>
          </motion.div>

          {/* Numpad */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 1.5,
              maxWidth: 280
            }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'C'].map((key) => (
                key === '' ? <Box key="empty" /> :
                <IconButton
                  key={key}
                  onClick={() => key === 'C' ? handleClear() : handlePinInput(key)}
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    bgcolor: key === 'C' ? alpha('#ef4444', 0.1) : alpha('#fff', 0.05),
                    color: key === 'C' ? '#ef4444' : 'white',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    border: `1px solid ${alpha('#fff', 0.08)}`,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: key === 'C' ? alpha('#ef4444', 0.2) : alpha('#fff', 0.12),
                      transform: 'scale(1.05)',
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                    }
                  }}
                >
                  {key === 'C' ? 'C' : key}
                </IconButton>
              ))}
            </Box>
          </motion.div>

          {/* Fingerprint hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ position: 'relative', zIndex: 1, marginTop: 32 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Fingerprint sx={{ color: alpha('#fff', 0.2), fontSize: 20 }} />
              <Typography sx={{ color: alpha('#fff', 0.2), fontSize: '0.8rem', fontWeight: 600 }}>
                Default PIN: 1234
              </Typography>
            </Box>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
