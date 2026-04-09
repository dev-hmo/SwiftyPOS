import { forwardRef } from 'react';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import { useSettingsStore } from '../../store/useSettingsStore';

interface ReceiptTemplateProps {
  items: any[];
  subtotal: number;
  discountAmt: number;
  finalTotal: number;
  cashierName?: string;
}

// Ensure the print styling conforms strictly to an 80mm thermal receipt
const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>((props, ref) => {
  const { items, subtotal, discountAmt, finalTotal, cashierName = 'Admin' } = props;
  const { businessName, receiptHeader, receiptFooter, currencySymbol } = useSettingsStore();

  return (
    <div style={{ display: 'none' }}>
      <Box 
        ref={ref} 
        sx={{ 
          width: '80mm', // standard thermal receipt width
          padding: '5mm',
          bgcolor: 'white',
          color: 'black',
          fontFamily: 'monospace',
          '@media print': {
            width: '80mm',
            border: 'none',
            margin: 0,
            padding: 0
          }
        }}
      >
        <Typography variant="h6" align="center" sx={{ fontWeight: 800, mb: 1, fontFamily: 'monospace' }}>
          {businessName.toUpperCase()}
        </Typography>
        {receiptHeader && (
          <Typography variant="body2" align="center" sx={{ mb: 2, fontSize: '0.8rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {receiptHeader}
          </Typography>
        )}
        
        <Box sx={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', py: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>Date: {format(new Date(), 'PPpp')}</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>Cashier: {cashierName}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          {items.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace', flex: 1 }}>
                {item.quantity}x {item.name}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                {currencySymbol}{(item.price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ borderTop: '1px dashed black', pt: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>Subtotal:</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{currencySymbol}{subtotal.toFixed(2)}</Typography>
          </Box>
          {discountAmt > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>Discount:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>-{currencySymbol}{discountAmt.toFixed(2)}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>TOTAL:</Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{currencySymbol}{finalTotal.toFixed(2)}</Typography>
          </Box>
        </Box>

        {receiptFooter && (
          <Typography variant="body2" align="center" sx={{ mt: 3, fontSize: '0.8rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {receiptFooter}
          </Typography>
        )}
        <Typography variant="body2" align="center" sx={{ mt: 1, fontSize: '0.7rem', fontFamily: 'monospace' }}>
          -- Powered by EntPOS --
        </Typography>
      </Box>
    </div>
  );
});

export default ReceiptTemplate;
