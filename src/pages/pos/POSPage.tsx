import { 
  useState, 
  useMemo,
  useCallback,
  useRef
} from 'react';
import { 
  Box, Typography, Button, IconButton, Grid, 
  Dialog, DialogContent, DialogTitle, DialogActions,
  Card, CardActionArea, TextField,
  Avatar, Chip, Paper, Tooltip,
  useTheme, alpha, useMediaQuery, SwipeableDrawer, Fab, Badge,
  List, ListItem, Drawer
} from '@mui/material';
import { 
  Delete, ShoppingCart, PointOfSale, Person, LocalAtm, CreditCard,
  Search, Close, Description, InfoOutlined, EmojiFoodBeverage, Cake, Handyman,
  PauseCircle, PlayCircle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, type Customer } from '../../store/useCartStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useHeldOrdersStore } from '../../store/useHeldOrdersStore';
import { useActivityStore } from '../../store/useActivityStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useDebounce } from '../../hooks/useDebounce';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { InvoiceReceipt } from '../../components/pos/InvoiceReceipt';
import { useReactToPrint } from 'react-to-print';
import { useSalesStore } from '../../store/useSalesStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateSubtotal } from '../../utils/calculations';

import { useInventoryStore } from '../../store/useInventoryStore';
import { useKDSStore } from '../../store/useKDSStore';
import type { ProductVariantGroup, ProductVariantOption } from '../../store/useInventoryStore';

// --- UPDATED MOCK DATA FOR CAFE ---
const MOCK_CATEGORIES = [
  { name: 'All', icon: <ShoppingCart /> },
  { name: 'Coffee', icon: <EmojiFoodBeverage /> },
  { name: 'Tea', icon: '🍵' },
  { name: 'Pastries', icon: <Cake /> },
  { name: 'Equipment', icon: <Handyman /> }
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', points: 450 },
  { id: '2', name: 'Jane Smith', email: 'jane@world.com', points: 120 },
  { id: '3', name: 'Coffee Club LLC', email: 'biz@coffee.com', points: 2300 },
];

export default function POSPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { t } = useLanguage();
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const { items, addItem, updateQuantity, updatePrice, updateDiscount, clearCart, customer, setCustomer } = useCartStore();
  const { enqueue } = useNotificationStore();
  const { orders: heldOrders, holdOrder, recallOrder } = useHeldOrdersStore();
  const { logActivity } = useActivityStore();
  const { addSale } = useSalesStore();
  const { user } = useAuthStore();
  const { products, deductStockFromSale } = useInventoryStore();
  const { addOrder } = useKDSStore();
  const { taxRate } = useSettingsStore();
  
  // Initialize Barcode Scanner (listening globally for rapid typing)
  useBarcodeScanner(products);

  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [numpadMode, setNumpadMode] = useState<'Qty' | 'Disc' | 'Price'>('Qty');
  const [inputValue, setInputValue] = useState('');
  
  const [customerModal, setCustomerModal] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [heldDrawerOpen, setHeldDrawerOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{ number: string; date: string } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const receiptDocRef = useRef<HTMLDivElement>(null);

  // Variant picker state
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<typeof products[number] | null>(null);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, ProductVariantOption>>({});
  
  const handlePrint = useReactToPrint({
    contentRef: receiptDocRef,
    documentTitle: `Receipt-${new Date().getTime()}`,
  });

  const debouncedProductSearch = useDebounce(productSearch, 300);

  // Calculations
  const subtotal = useMemo(() => calculateSubtotal(items), [items]);
  const discountAmount = useMemo(() => items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0), [items]);
  const total = useMemo(() => Math.round((subtotal - discountAmount) * 100) / 100, [subtotal, discountAmount]);
  const tax = useMemo(() => Math.round(total * (taxRate / 100) * 100) / 100, [total, taxRate]);
  const grandTotal = useMemo(() => Math.round((total + tax) * 100) / 100, [total, tax]);

  const filteredProducts = useMemo(() => {
    let prods = activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory);
    if (debouncedProductSearch) {
      const q = debouncedProductSearch.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return prods;
  }, [activeCategory, debouncedProductSearch, products]);
  
  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductClick = (product: typeof products[number]) => {
    const hasVariants = product.variantGroups && product.variantGroups.length > 0;
    if (hasVariants) {
      setSelectedProductForVariants(product);
      setSelectedVariantOptions({});
      setVariantPickerOpen(true);
      return;
    }
    addItem(product);
    setSelectedLineId(product.id);
    setNumpadMode('Qty');
    setInputValue('');
    enqueue(`${product.name} added to cart`, 'success');
  };

  const handleVariantConfirm = () => {
    if (!selectedProductForVariants) return;
    const firstOption = Object.values(selectedVariantOptions)[0];
    const modifier = firstOption?.priceModifier ?? 0;
    const variantName = Object.values(selectedVariantOptions).map((o) => o.name).join(', ');
    addItem({
      ...selectedProductForVariants,
      price: selectedProductForVariants.price,
      variantOptionId: firstOption?.id,
      variantOptionName: variantName || undefined,
      priceModifier: modifier,
    });
    setSelectedLineId(selectedProductForVariants.id);
    setNumpadMode('Qty');
    setInputValue('');
    enqueue(`${selectedProductForVariants.name}${variantName ? ` (${variantName})` : ''} added`, 'success');
    setVariantPickerOpen(false);
    setSelectedProductForVariants(null);
    setSelectedVariantOptions({});
  };

  // Hold current order
  const handleHoldOrder = useCallback(() => {
    if (items.length === 0) { enqueue(t('pos.emptyCart'), 'warning'); return; }
    const heldId = holdOrder(items, customer);
    logActivity('ORDER_HELD', `Held order ${heldId} with ${items.length} items`);
    clearCart();
    enqueue(`Order held (${items.length} items)`, 'info');
    setHeldDrawerOpen(false);
  }, [items, customer, holdOrder, clearCart, enqueue, logActivity, t]);

  // Recall a held order
  const handleRecallOrder = useCallback((id: string) => {
    const order = recallOrder(id);
    if (order) {
      // If current cart has items, hold them first
      if (items.length > 0) {
        holdOrder(items, customer, 'Auto-held on recall');
        clearCart();
      }
      // Add each item with its correct quantity
      order.items.forEach(item => {
        addItem({ ...item, quantity: 1 });
        // Set the correct quantity after adding
        if (item.quantity > 1) {
          updateQuantity(item.id, item.quantity);
        }
      });
      if (order.customer) setCustomer(order.customer);
      logActivity('ORDER_RECALLED', `Recalled order ${id}`);
      enqueue(`Order recalled (${order.items.length} items)`, 'success');
    }
    setHeldDrawerOpen(false);
  }, [recallOrder, items, customer, holdOrder, addItem, updateQuantity, clearCart, setCustomer, enqueue, logActivity]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'F2', description: 'Focus Search', handler: () => searchInputRef.current?.focus() },
    { key: 'F4', description: 'Hold Order', handler: handleHoldOrder },
    { key: 'F8', description: 'Open Payment', handler: () => { if (items.length > 0) setPaymentOpen(true); } },
    { key: 'Escape', description: 'Clear Cart', handler: () => { clearCart(); enqueue('Cart cleared', 'info'); } },
  ]);

  const handleNumpadInput = (val: string) => {
    if (!selectedLineId) return;
    
    let newVal = inputValue;
    if (val === 'C') newVal = '';
    else if (val === 'Backspace') newVal = newVal.slice(0, -1);
    else if (val === '.' && newVal.includes('.')) return;
    else if (val === '+/-') newVal = newVal.startsWith('-') ? newVal.substring(1) : '-' + newVal;
    else newVal += val;

    setInputValue(newVal);
    const numValue = parseFloat(newVal) || 0;

    if (numpadMode === 'Qty') updateQuantity(selectedLineId, numValue);
    if (numpadMode === 'Disc') updateDiscount(selectedLineId, numValue);
    if (numpadMode === 'Price') updatePrice(selectedLineId, numValue);
  };

  const glassStyle = {
    bgcolor: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  };

  // Helper to render the cart content (shared between desktop and mobile)
  const renderCart = () => (
    <>
      {/* Customer & Cart Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 1.5, borderRadius: 4, display: 'flex', gap: 1, 
          bgcolor: 'primary.main', color: 'white', boxShadow: `0 8px 20px -8px ${alpha(theme.palette.primary.main, 0.4)}`
        }}
      >
        <Button 
          fullWidth startIcon={<Person />} 
          onClick={() => setCustomerModal(true)}
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 700, py: 1.2, borderRadius: 3,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }, textTransform: 'none'
          }}
        >
          {customer ? customer.name : t('pos.tableGuest')}
        </Button>
        <IconButton onClick={clearCart} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3, width: 48, height: 48 }}>
          <Delete />
        </IconButton>
      </Paper>

      {/* Cart Container */}
      <Paper elevation={0} sx={{ flex: 1, borderRadius: 5, ...glassStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`, flexShrink: 0 }}>
          <Typography variant="subtitle1" fontWeight={800}>{t('pos.currentOrder')}</Typography>
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, minHeight: 0 }}>
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                  <Box 
                    onClick={() => { setSelectedLineId(item.id); setInputValue(''); }}
                    sx={{ 
                      p: 2, mb: 1, borderRadius: 4, cursor: 'pointer',
                      border: '1px solid',
                      borderColor: selectedLineId === item.id ? 'primary.main' : 'transparent',
                      bgcolor: selectedLineId === item.id ? alpha(theme.palette.primary.main, 0.03) : alpha(theme.palette.background.paper, 0.3),
                      transition: '0.2s'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography fontWeight={700} variant="body2">{item.name}</Typography>
                      <Typography fontWeight={800} color="primary.main">${((item.price - (item.discount || 0)) * item.quantity).toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="caption" fontWeight={700} sx={{ bgcolor: 'white', px: 1, py: 0.2, borderRadius: 1.5, color: 'text.secondary' }}>{item.quantity}x</Typography>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">@ ${item.price.toFixed(2)}</Typography>
                      {item.discount && (
                        <Typography variant="caption" color="error.main" fontWeight={700}>-${item.discount.toFixed(2)}</Typography>
                      )}
                    </Box>
                  </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>

        {/* Checkout Footer */}
        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.background.paper, 0.8), borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, flexShrink: 0 }}>
          <Box sx={{ mb: 1.5 }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">{t('pos.orderTotal')}</Typography>
                <Typography variant="caption" fontWeight={800}>${subtotal.toFixed(2)}</Typography>
             </Box>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Typography variant="subtitle2" fontWeight={800}>{t('pos.amountDue')}</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ letterSpacing: -1 }}>${grandTotal.toFixed(2)}</Typography>
             </Box>
          </Box>

          {/* SWIFTY POS NUMPAD - Compact 4-Column */}
          <Box sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 3, p: 0.5 }}>
             <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5 }}>
                {['7','8','9','⌫','4','5','6','C','1','2','3','+/-'].map(k => (
                  <Button 
                    key={k} onClick={() => handleNumpadInput(k === '⌫' ? 'Backspace' : k)}
                    sx={{ 
                      borderRadius: 2, py: 0.8, minHeight: 36, fontSize: '0.95rem', fontWeight: 700,
                      bgcolor: 'white', color: 'text.primary', boxShadow: theme.shadows[1],
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) }
                    }}
                  >
                    {k}
                  </Button>
                ))}
                {([
                  { key: 'Qty' as const, label: t('pos.qty') },
                  { key: 'Disc' as const, label: t('pos.disc') },
                  { key: 'Price' as const, label: t('pos.price') },
                ]).map(mode => (
                  <Button 
                    key={mode.key}
                    onClick={() => setNumpadMode(mode.key)}
                    sx={{ 
                      borderRadius: 2, py: 0.8, minHeight: 36, fontWeight: 700, fontSize: '0.75rem',
                      bgcolor: numpadMode === mode.key ? 'primary.main' : 'white',
                      color: numpadMode === mode.key ? 'white' : 'text.secondary',
                      boxShadow: numpadMode === mode.key ? theme.shadows[2] : theme.shadows[1],
                      '&:hover': { bgcolor: numpadMode === mode.key ? 'primary.dark' : alpha(theme.palette.primary.main, 0.06) }
                    }}
                  >
                    {mode.label}
                  </Button>
                ))}
                <Button 
                  onClick={() => handleNumpadInput('0')}
                  sx={{ borderRadius: 2, py: 0.8, minHeight: 36, fontSize: '0.95rem', fontWeight: 700, bgcolor: 'white', color: 'text.primary', boxShadow: theme.shadows[1] }}
                >
                  0
                </Button>
                <Button 
                  onClick={() => handleNumpadInput('.')}
                  sx={{ borderRadius: 2, py: 0.8, minHeight: 36, fontSize: '0.95rem', fontWeight: 700, bgcolor: 'white', color: 'text.primary', boxShadow: theme.shadows[1] }}
                >
                  .
                </Button>
                <Button 
                  variant="contained" color="primary"
                  onClick={() => { setPaymentOpen(true); setMobileCartOpen(false); }}
                  disabled={items.length === 0}
                  sx={{ borderRadius: 2, py: 0.8, minHeight: 36, fontWeight: 800, fontSize: '0.85rem', boxShadow: theme.shadows[4] }}
                >
                  {t('pos.pay')}
                </Button>
             </Box>
          </Box>
        </Box>
      </Paper>
    </>
  );

  return (
    <Box sx={{ 
      width: '100%',
      p: { xs: 1.5, md: 3 }, 
      display: 'flex', 
      flexDirection: { xs: 'column', lg: 'row' },
      gap: { xs: 2, lg: 2 }, 
      height: { xs: 'auto', lg: 'calc(100vh - 100px)' },
      bgcolor: 'background.default',
      position: 'relative',
      overflow: { xs: 'auto', lg: 'hidden' }
    }}>
      
      {/* LEFT PANE: PRODUCT EXPLORER */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: { xs: 2, lg: 3 },
        minHeight: 0 // Crucial for inner scroll
      }}>
        
        {/* Category Navigation + Search Bar */}
        <Box sx={{ 
          p: 1, 
          display: 'flex', 
          gap: 1, 
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Search Input */}
          <TextField
            inputRef={searchInputRef}
            size="small"
            placeholder={t('pos.search')}
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
              endAdornment: productSearch ? (
                <IconButton size="small" onClick={() => setProductSearch('')}><Close fontSize="small" /></IconButton>
              ) : null,
            }}
            sx={{ 
              minWidth: { xs: '100%', md: 240 },
              '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' }
            }}
          />

          {/* Category Pills */}
          <Box sx={{ 
            display: 'flex', 
            gap: 0.75, 
            overflowX: 'auto', 
            flex: 1,
            py: 0.5,
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            {MOCK_CATEGORIES.map(cat => (
              <Button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                sx={{ 
                  borderRadius: 3, px: { xs: 2, md: 2.5 }, py: 0.75, minWidth: { xs: 80, md: 90 },
                  bgcolor: activeCategory === cat.name ? 'primary.main' : alpha(theme.palette.background.paper, 0.8),
                  color: activeCategory === cat.name ? 'white' : 'text.secondary',
                  border: `1.5px solid ${activeCategory === cat.name ? 'transparent' : alpha(theme.palette.divider, 0.15)}`,
                  boxShadow: activeCategory === cat.name ? `0 4px 14px -4px ${alpha(theme.palette.primary.main, 0.45)}` : 'none',
                  '&:hover': { bgcolor: activeCategory === cat.name ? 'primary.dark' : alpha(theme.palette.primary.main, 0.06), borderColor: activeCategory === cat.name ? 'transparent' : 'primary.main' },
                  textTransform: 'none', fontWeight: 700,
                  display: 'flex', gap: 0.75,
                  fontSize: { xs: '0.78rem', md: '0.85rem' },
                  transition: 'all 0.15s ease'
                }}
              >
                <Typography sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: 15, md: 17 } }}>{cat.icon}</Typography>
                {cat.name}
              </Button>
            ))}
          </Box>

          {/* Hold / Recall Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Hold Order (F4)">
              <Button
                size="small"
                variant="outlined"
                onClick={handleHoldOrder}
                disabled={items.length === 0}
                startIcon={<PauseCircle />}
                sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', minWidth: 'auto' }}
              >
                {t('pos.hold')}
              </Button>
            </Tooltip>
            <Tooltip title="Recall Held Orders">
              <Badge badgeContent={heldOrders.length} color="primary">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setHeldDrawerOpen(true)}
                  startIcon={<PlayCircle />}
                  sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none', minWidth: 'auto' }}
                >
                  {t('pos.recall')}
                </Button>
              </Badge>
            </Tooltip>
          </Box>
        </Box>

        {/* Product Grid - Fluid Layout */}
        <Box sx={{ flex: 1, overflowY: { xs: 'visible', lg: 'auto' }, pr: 0.5, '&::-webkit-scrollbar': { width: 4 } }}>
          <Grid container spacing={{ xs: 1.5, md: 2 }}>
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, idx) => (
                <Grid size={{ xs: 6, sm: 4, md: 3, lg: 3 }} key={product.id}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
                    <Card 
                      onClick={() => handleProductClick(product)}
                      sx={{ 
                        borderRadius: 4, overflow: 'hidden',
                        bgcolor: 'background.paper',
                        boxShadow: '0 4px 16px -8px rgba(0,0,0,0.08)',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[3] }
                      }}
                    >
                      <CardActionArea sx={{ p: 1 }}>
                        <Box sx={{ height: { xs: 120, md: 160 }, borderRadius: 3, overflow: 'hidden', position: 'relative', mb: 1 }}>
                          <img src={product.img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <Box sx={{ position: 'absolute', bottom: 6, right: 6 }}>
                            <Chip 
                              label={`$${product.price.toFixed(2)}`} 
                              sx={{ fontWeight: 800, bgcolor: 'primary.main', color: 'white', px: 0, height: 22, fontSize: '0.7rem', boxShadow: 1 }} 
                            />
                          </Box>
                        </Box>
                        <Box sx={{ px: 0.2, pb: 0.2 }}>
                          <Typography variant="caption" fontWeight={700} noWrap display="block" sx={{ lineHeight: 1.2, mb: 0.2 }}>{product.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{product.sku}</Typography>
                        </Box>
                      </CardActionArea>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        </Box>
      </Box>

      {/* RIGHT PANE: ORDER MANAGEMENT (Desktop) or Mobile Drawer */}
      {!isMobile ? (
        <Box sx={{ width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0, height: '100%' }}>
          {renderCart()}
        </Box>
      ) : (
        <>
          <Fab 
            color="primary" 
            sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200, width: 60, height: 60, boxShadow: `0 6px 20px -4px ${alpha(theme.palette.primary.main, 0.5)}` }}
            onClick={() => setMobileCartOpen(true)}
          >
            <Badge badgeContent={items.length} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }}>
              <ShoppingCart />
            </Badge>
          </Fab>
          
          <SwipeableDrawer
            anchor="bottom"
            open={mobileCartOpen}
            onClose={() => setMobileCartOpen(false)}
            onOpen={() => setMobileCartOpen(true)}
            PaperProps={{ 
              sx: { height: '85vh', borderTopLeftRadius: 28, borderTopRightRadius: 28, bgcolor: 'background.default', px: 2, pt: 1, overflow: 'hidden' } 
            }}
          >
            <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 1 }} onClick={() => setMobileCartOpen(false)} />
            <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 20px)', overflow: 'hidden' }}>
               {renderCart()}
            </Box>
          </SwipeableDrawer>
        </>
      )}

      {/* --- CAFE MODALS --- */}

      {/* VARIANT PICKER */}
      <Dialog
        open={variantPickerOpen}
        onClose={() => { setVariantPickerOpen(false); setSelectedProductForVariants(null); setSelectedVariantOptions({}); }}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 6 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {t('pos.variantPicker')}
            <Typography component="span" color="primary.main" sx={{ ml: 1 }}>{selectedProductForVariants?.name}</Typography>
          </Box>
          <IconButton onClick={() => { setVariantPickerOpen(false); setSelectedProductForVariants(null); setSelectedVariantOptions({}); }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedProductForVariants?.variantGroups?.map((vg: ProductVariantGroup) => (
            <Box key={vg.id} sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={800} mb={1.5}>{vg.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {vg.options.map((opt: ProductVariantOption) => {
                  const isSelected = selectedVariantOptions[vg.id]?.id === opt.id;
                  return (
                    <Button
                      key={opt.id}
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => setSelectedVariantOptions((prev) => ({ ...prev, [vg.id]: opt }))}
                      sx={{
                        borderRadius: 3, px: 3, py: 1.5, fontWeight: 700, textTransform: 'none',
                        border: `2px solid ${isSelected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3)}`,
                        bgcolor: isSelected ? 'primary.main' : 'background.paper',
                        color: isSelected ? 'white' : 'text.primary',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      {opt.name}
                      {opt.priceModifier !== 0 && (
                        <Typography variant="caption" sx={{ ml: 0.5, opacity: 0.8 }}>
                          ({opt.priceModifier > 0 ? '+' : ''}${opt.priceModifier.toFixed(2)})
                        </Typography>
                      )}
                    </Button>
                  );
                })}
              </Box>
            </Box>
          ))}

          {selectedProductForVariants?.variantGroups?.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>{t('pos.noVariants')}</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => { setVariantPickerOpen(false); setSelectedProductForVariants(null); setSelectedVariantOptions({}); }} sx={{ fontWeight: 700, borderRadius: 3 }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleVariantConfirm}
            sx={{ borderRadius: 3, fontWeight: 800, px: 4 }}
          >
            {t('pos.addToCart')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CUSTOMER SELECTION - SWIFTY STYLE */}
      <Dialog open={customerModal} onClose={() => setCustomerModal(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 9, p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.6rem', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('pos.customerTitle')}
          <IconButton onClick={() => setCustomerModal(false)} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.05) }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <TextField 
            fullWidth placeholder={t('pos.customerSearch')} 
            variant="outlined" 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            InputProps={{ 
              startAdornment: <Search sx={{ mr: 1, color: 'primary.main' }} />, 
              sx: { borderRadius: 5, bgcolor: '#F9F6F3', '& fieldset': { border: 'none' } } 
            }}
            sx={{ mb: 4 }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
             {filteredCustomers.map(c => (
                <Button 
                  key={c.id} fullWidth
                  onClick={() => { setCustomer(c); setCustomerModal(false); }}
                  sx={{ 
                    justifyContent: 'flex-start', p: 2.5, borderRadius: 6, border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'white', transition: '0.2s',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03), borderColor: 'primary.main', transform: 'translateX(4px)' }
                  }}
                >
                  <Avatar sx={{ mr: 2.5, width: 52, height: 52, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 900, borderRadius: 4 }}>{c.name[0]}</Avatar>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography fontWeight={900} variant="subtitle1">{c.name}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{c.email} • <span style={{ color: theme.palette.primary.main }}>{c.points} Pts</span></Typography>
                  </Box>
                </Button>
             ))}
             <Button fullWidth variant="outlined" sx={{ borderRadius: 6, py: 2.5, borderStyle: 'dashed', borderWidth: 2, fontWeight: 900 }}>
               + Register New Member
             </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* PAYMENT PROCESSOR - SWIFTY STYLE */}
      <Dialog open={paymentOpen} onClose={() => { setPaymentOpen(false); setSelectedPaymentMethod(null); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 10, bgcolor: '#F9F6F3', maxHeight: '90vh', overflow: 'hidden' } }}>
        <Box sx={{ display: 'flex', height: { xs: 'auto', md: '70vh' }, flexDirection: { xs: 'column', md: 'row' } }}>
           {/* LEFT: PAYMENT CONTROL */}
           <Box sx={{ flex: 1, p: 6, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 6 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={900} sx={{ letterSpacing: 2 }}>{t('pos.settlement')}</Typography>
                <Typography variant="h1" fontWeight={900} color="primary.main" sx={{ mb: 1, letterSpacing: -2 }}>${grandTotal.toFixed(2)}</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', opacity: 0.6 }}>
                  <InfoOutlined fontSize="small" />
                  <Typography variant="body2" fontWeight={700}>Including {taxRate}% Sales Tax</Typography>
                </Box>
              </Box>

              <Typography variant="h6" fontWeight={900} mb={3}>Settlement Channel</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 6 }}>
                {[
                  { id: 'cash', label: t('pos.cash'), icon: <LocalAtm /> },
                  { id: 'card', label: t('pos.card'), icon: <CreditCard /> },
                  { id: 'account', label: t('pos.memberCredit'), icon: <Person /> },
                  { id: 'qr', label: t('pos.qrMobile'), icon: <PointOfSale /> }
                ].map(m => (
                  <Button 
                    key={m.id} fullWidth variant="outlined" 
                    startIcon={m.icon}
                    onClick={() => setSelectedPaymentMethod(m.id)}
                    sx={{ 
                      p: 3, borderRadius: 6, justifyContent: 'flex-start', borderWidth: 2, fontWeight: 900, 
                      bgcolor: selectedPaymentMethod === m.id ? alpha(theme.palette.primary.main, 0.08) : 'white', 
                      borderColor: selectedPaymentMethod === m.id ? 'primary.main' : alpha(theme.palette.divider, 0.5),
                      color: selectedPaymentMethod === m.id ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {m.label}
                  </Button>
                ))}
              </Box>

              <Box sx={{ flex: 1 }} />
              
              <Button 
                variant="contained" fullWidth
                disabled={!selectedPaymentMethod || items.length === 0}
                    onClick={() => {
                      // Deduct stock FIRST — if this fails, don't record the sale
                      try {
                        deductStockFromSale(items.map(i => ({ productId: i.id, quantity: i.quantity })));
                      } catch (err) {
                        enqueue(err instanceof Error ? err.message : 'Insufficient stock', 'error');
                        return;
                      }

                      // Record the sale (generates receipt number atomically)
                      const sale = addSale({
                    items: items.map(i => ({ name: i.name, sku: i.sku, quantity: i.quantity, price: i.price, discount: i.discount })),
                    subtotal,
                    tax,
                    discount: discountAmount,
                    total: grandTotal,
                    paymentMethod: selectedPaymentMethod || 'cash',
                    cashier: user?.email || 'Unknown',
                    cashierId: user?.id || undefined,
                    customer: customer?.name || null,
                  });
                  
                  // Set receipt data from the sale record (no random collision)
                  setReceiptData({ number: sale.receiptNumber, date: sale.createdAt });
                  
                  // Push to KDS if any items are prepared (Coffee, Tea, Pastries)
                  const kitchenItems = items
                    .filter(i => i.category != null && ['Coffee', 'Tea', 'Pastries'].includes(i.category))
                    .map(i => ({ name: i.name, quantity: i.quantity, notes: '' }));

                  if (kitchenItems.length > 0) {
                    addOrder({
                      id: `kds-${sale.receiptNumber}`,
                      receiptNumber: sale.receiptNumber,
                      items: kitchenItems,
                      cashier: user?.email?.split('@')[0] || 'Cashier'
                    });
                  }
                  
                  logActivity('SALE_COMPLETED', `Sale ${sale.receiptNumber} for $${grandTotal.toFixed(2)} via ${selectedPaymentMethod}`);
                  enqueue(`Sale completed: ${sale.receiptNumber} — $${grandTotal.toFixed(2)}`, 'success');
                  setPaymentOpen(false);
                  setSelectedPaymentMethod(null);
                  clearCart();
                  setCustomer(null);
                }}
                sx={{ py: 3, borderRadius: 7, fontSize: '1.4rem', fontWeight: 900, boxShadow: theme.shadows[15] }}
              >
                {t('pos.authorize')}
              </Button>
           </Box>

           {/* RIGHT: TACTILE RECEIPT PREVIEW */}
           <Box sx={{ width: 440, bgcolor: 'white', p: 4, display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${theme.palette.divider}`, alignItems: 'center', overflowY: 'auto' }}>
              
              {/* The Actual Printable Receipt Node */}
              <Box sx={{ flex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ boxShadow: theme.shadows[3], border: '1px solid #e0e0e0', p: 1, mb: 3 }}>
                  <InvoiceReceipt ref={receiptDocRef} receiptNumber={receiptData?.number} saleDate={receiptData?.date} />
                </Box>
              </Box>

              <Button 
                variant="outlined" fullWidth sx={{ py: 2, borderRadius: 5, fontWeight: 900, borderStyle: 'dashed', borderWidth: 2 }}
                startIcon={<Description />}
                onClick={() => handlePrint()}
               >
                 {t('pos.printReceipt')}
              </Button>
           </Box>
        </Box>
      </Dialog>
      
      {/* Held Orders Drawer */}
      <Drawer anchor="right" open={heldDrawerOpen} onClose={() => setHeldDrawerOpen(false)}>
        <Box sx={{ width: 350, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PauseCircle color="primary" /> Held Orders ({heldOrders.length})
          </Typography>
          
          {heldOrders.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>{t('pos.noHeld')}</Typography>
          ) : (
            <List sx={{ flex: 1, overflowY: 'auto' }}>
              {heldOrders.map((order) => (
                <ListItem 
                  key={order.id} 
                  sx={{ 
                    mb: 2, 
                    border: `1px solid ${theme.palette.divider}`, 
                    borderRadius: 3,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                    <Typography fontWeight={700}>{order.customer?.name || t('pos.walkinCustomer')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {order.items.length} items • ${calculateSubtotal(order.items).toFixed(2)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <Button 
                      variant="contained" 
                      size="small" 
                      fullWidth 
                      startIcon={<PlayCircle />}
                      onClick={() => handleRecallOrder(order.id)}
                      sx={{ borderRadius: 2 }}
                    >
                      Recall
                    </Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
