import React, { useMemo } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import Barcode from 'react-barcode';
import { useCartStore } from '../../store/useCartStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface InvoiceReceiptProps {
  receiptNumber?: string;
  saleDate?: string;
}

// Wrap in React.forwardRef so react-to-print can grab the DOM node
export const InvoiceReceipt = React.forwardRef<HTMLDivElement, InvoiceReceiptProps>(({ receiptNumber, saleDate }, ref) => {
  const { items, customer } = useCartStore();
  const { businessName, receiptHeader, receiptFooter, taxRate } = useSettingsStore();

  const meta = useMemo(() => ({
    number: receiptNumber ?? 'N/A',
    dateStr: saleDate ? new Date(saleDate).toLocaleString() : new Date().toLocaleString(),
  }), [receiptNumber, saleDate]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountTotal = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  const afterDiscount = subtotal - discountTotal;
  const tax = Math.round(afterDiscount * (taxRate / 100) * 100) / 100;
  const total = Math.max(0, Math.round((afterDiscount + tax) * 100) / 100);

  return (
    <Box 
      ref={ref} 
      sx={{ 
        width: '300px',
        p: 2, 
        bgcolor: 'white', 
        color: 'black',
        fontFamily: '"Courier New", Courier, monospace',
        mx: 'auto'
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={900} sx={{ color: 'black' }}>{businessName || 'SWIFTY POS'}</Typography>
        {receiptHeader && <Typography variant="body2" sx={{ color: 'black' }}>{receiptHeader}</Typography>}
        <Typography variant="body2" sx={{ mt: 1, color: 'black' }}>Receipt: {meta.number}</Typography>
        <Typography variant="body2" sx={{ color: 'black' }}>{meta.dateStr}</Typography>
      </Box>

      {customer && (
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'black' }}>Customer: {customer.name}</Typography>
        </Box>
      )}

      <Divider sx={{ my: 1, borderStyle: 'dashed', borderColor: '#333' }} />

      <Box sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ color: 'black' }}>Qty x Item</Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ color: 'black' }}>Total</Typography>
        </Box>
        {items.map((item) => (
          <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: 'black' }}>{item.quantity} x {item.name}</Typography>
            <Typography variant="body2" sx={{ color: 'black' }}>${(item.price * item.quantity).toFixed(2)}</Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 1, borderStyle: 'dashed', borderColor: '#333' }} />

      <Box sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: 'black' }}>Subtotal:</Typography>
          <Typography variant="body2" sx={{ color: 'black' }}>${subtotal.toFixed(2)}</Typography>
        </Box>
        {discountTotal > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: 'black' }}>Discount:</Typography>
            <Typography variant="body2" sx={{ color: 'black' }}>-${discountTotal.toFixed(2)}</Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: 'black' }}>Tax ({taxRate}%):</Typography>
          <Typography variant="body2" sx={{ color: 'black' }}>${tax.toFixed(2)}</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1, borderStyle: 'dashed', borderColor: '#333' }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>TOTAL:</Typography>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>${total.toFixed(2)}</Typography>
      </Box>

      <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: 'black' }}>{receiptFooter || 'Thank you for your visit!'}</Typography>
        <Barcode value={meta.number} width={1.5} height={40} fontSize={12} displayValue={true} />
      </Box>
    </Box>
  );
});

InvoiceReceipt.displayName = 'InvoiceReceipt';
