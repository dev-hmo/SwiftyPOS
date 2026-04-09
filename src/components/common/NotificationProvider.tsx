import { Snackbar, Alert, Slide } from '@mui/material';
import type { SlideProps } from '@mui/material';
import { useNotificationStore } from '../../store/useNotificationStore';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export default function NotificationProvider() {
  const { queue, dequeue } = useNotificationStore();
  const current = queue[0];

  if (!current) return null;

  return (
    <Snackbar
      open={!!current}
      autoHideDuration={4000}
      onClose={dequeue}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
      sx={{ mb: { xs: 8, md: 0 } }}
    >
      <Alert
        onClose={dequeue}
        severity={current.severity}
        variant="filled"
        sx={{
          borderRadius: 3,
          fontWeight: 700,
          fontSize: '0.9rem',
          boxShadow: '0 8px 32px -8px rgba(0,0,0,0.3)',
          minWidth: 300,
        }}
      >
        {current.message}
      </Alert>
    </Snackbar>
  );
}
