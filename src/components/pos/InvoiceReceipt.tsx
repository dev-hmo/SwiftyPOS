import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import Barcode from 'react-barcode';
import { useCartStore } from '../../store/useCartStore';

const TAX_RATE = 8; // GST 8%

// Wrap in React.forwardRef so react-to-print can grab the DOM node
export const InvoiceReceipt = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { items, customer } = useCartStore();

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountTotal = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  const afterDiscount = subtotal - discountTotal;
  const tax = Math.round(afterDiscount * (TAX_RATE / 100) * 100) / 100;
  const total = Math.max(0, Math.round((afterDiscount + tax) * 100) / 100);
  
  const receiptNumber = `SML-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  const dateStr = new Date().toLocaleString();

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
        <Typography variant="h5" fontWeight={900} sx={{ color: 'black' }}>SWIFTY POS</Typography>
        <Typography variant="body2" sx={{ color: 'black' }}>123 Coffee Lane, Brew City</Typography>
        <Typography variant="body2" sx={{ color: 'black' }}>Tel: +1 234 567 890</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'black' }}>Receipt: {receiptNumber}</Typography>
        <Typography variant="body2" sx={{ color: 'black' }}>{dateStr}</Typography>
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
          <Typography variant="body2" sx={{ color: 'black' }}>Tax (GST {TAX_RATE}%):</Typography>
          <Typography variant="body2" sx={{ color: 'black' }}>${tax.toFixed(2)}</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1, borderStyle: 'dashed', borderColor: '#333' }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>TOTAL:</Typography>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>${total.toFixed(2)}</Typography>
      </Box>

      <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: 'black' }}>Thank you for your visit!</Typography>
        <Barcode value={receiptNumber} width={1.5} height={40} fontSize={12} displayValue={true} />
      </Box>
    </Box>
  );
});

InvoiceReceipt.displayName = 'InvoiceReceipt';
