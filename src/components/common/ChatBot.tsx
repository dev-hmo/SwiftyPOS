import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box, Typography, TextField, IconButton, Paper, Avatar, Chip,
  useTheme, alpha, Slide,
} from '@mui/material';
import { Close, Send, SmartToy, Person, Forum } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const FAQ: { keywords: string[]; answer: string }[] = [
  { keywords: ['price', 'pricing', 'cost', 'plan', 'plans', 'how much', 'fee', 'subscription'],
    answer: 'We offer 3 plans:\n• Standard — 9,000 Ks/mo (1 register, basic analytics)\n• Pro — 29,000 Ks/mo (unlimited registers, KDS, recipe inventory, stock tracking)\n• Enterprise — 79,000 Ks/mo (custom RBAC, multi-store, 24/7 support)\n\nAll plans require contacting our sales team to get started.' },
  { keywords: ['trial', 'free trial', 'demo', 'try', 'test drive'],
    answer: 'We don\'t offer a self-service free trial. Contact our sales team and we\'ll set up a personalized demo for your business.' },
  { keywords: ['variant', 'variants', 'size', 'sugar', 'option', 'options', 'customization'],
    answer: 'SwiftyPOS supports product variants like Size, Sugar Level, and more. Each option can have its own price modifier — e.g., Large +$0.50. Variants are fully configurable from the admin dashboard.' },
  { keywords: ['recipe', 'ingredient', 'bom', 'bill of material', 'inventory', 'stock', 'deduct'],
    answer: 'Define recipes (Bill of Materials) per product. When a sale is made, ingredients are automatically deducted from stock. You get low-stock alerts, cost tracking, and a full stock history.' },
  { keywords: ['kds', 'kitchen', 'display', 'order', 'ticket'],
    answer: 'The Kitchen Display System shows incoming orders in real time with color-coded SLA tracking. Kitchen staff can update order status and the POS terminal reflects changes instantly.' },
  { keywords: ['pos', 'checkout', 'register', 'barcode', 'scan', 'payment'],
    answer: 'SwiftyPOS features a blazing-fast checkout — barcode scanning, multi-item cart, hold/recall orders, and receipt printing. It runs on any modern browser, iPad, or touchscreen kiosk.' },
  { keywords: ['rbac', 'role', 'permission', 'access', 'security', 'admin', 'cashier'],
    answer: 'Built-in role-based access control with 3 default roles: Admin (full access), Cashier (POS + sales), and Kitchen (KDS only). Enterprise plans support fully custom roles.' },
  { keywords: ['logo', 'brand', 'branding', 'receipt', 'settings', 'customize'],
    answer: 'Upload your store logo, set custom receipt footer messages, configure tax rates, and more — all from the Global Settings page.' },
  { keywords: ['report', 'analytics', 'insight', 'data', 'margin', 'sales report'],
    answer: 'Enterprise-grade analytics covering inventory valuations, gross margins, cashier performance, and daily sales reports — all exportable to Excel.' },
  { keywords: ['payment', 'kbz', 'wave', 'aya', 'wallet', 'local'],
    answer: 'We support local Myanmar digital wallets including KBZPay, WavePay, AYA Pay, and Citizen Pay alongside standard cash and card payments.' },
  { keywords: ['support', 'help', 'contact', 'reach', 'email', 'phone'],
    answer: 'Reach us at:\n• Email: hello@swiftypos.com\n• Phone: +1 234 567 890\nStandard plans get standard support; Pro and Enterprise include priority and 24/7 dedicated support.' },
  { keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
    answer: 'Hello! Welcome to SwiftyPOS. I can help with questions about pricing, features, inventory, variants, KDS, and more. What would you like to know?' },
  { keywords: ['who', 'what is swifty', 'about', 'about swifty', 'tell me about'],
    answer: 'SwiftyPOS is a modern cloud-based point-of-sale system built for cafés, restaurants, and retail stores. It includes POS, Kitchen Display, inventory with recipes & variants, RBAC, and analytics — all in one beautiful interface.' },
];

function matchFAQ(input: string): string | null {
  const lower = input.toLowerCase();
  for (const item of FAQ) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return item.answer;
    }
  }
  return null;
}

const FALLBACK = "I'm not sure about that. Try asking about pricing, features, variants, recipes, KDS, or support. You can also reach our team at hello@swiftypos.com.";

let msgId = 0;
function nextId() { return String(++msgId); }

export default function ChatBot() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: nextId(), role: 'bot', text: 'Hi there! I\'m the SwiftyPOS assistant. Ask me about pricing, features, variants, recipes, or support.' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useMemo(() => (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: nextId(), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const answer = matchFAQ(trimmed) ?? FALLBACK;
      setMessages(prev => [...prev, { id: nextId(), role: 'bot', text: answer }]);
    }, 400);
  }, []);

  const quickActions = ['Pricing', 'Features', 'Inventory', 'KDS', 'Support'];

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1400 }}
          >
            <Box
              onClick={() => setOpen(true)}
              sx={{
                width: 60, height: 60, borderRadius: '50%',
                bgcolor: 'primary.main', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: `0 8px 24px -4px ${alpha(theme.palette.primary.main, 0.5)}`,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.08)' },
              }}
            >
              <Forum sx={{ fontSize: 28 }} />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={20}
          sx={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 1400,
            width: { xs: 'calc(100vw - 32px)', sm: 400 },
            height: { xs: 'calc(100vh - 120px)', sm: 540 },
            maxHeight: 540,
            borderRadius: 5, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          {/* Header */}
          <Box sx={{
            p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            bgcolor: 'primary.main', color: 'white',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: alpha('#fff', 0.2), width: 36, height: 36 }}>
                <SmartToy sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography fontWeight={800} fontSize="0.95rem">Swifty Assistant</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Ask me anything</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#f8fafc' }}>
            {messages.map(msg => (
              <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <Box sx={{
                  display: 'flex', gap: 1, alignItems: 'flex-end',
                  maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}>
                  {msg.role === 'bot' && (
                    <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28 }}>
                      <SmartToy sx={{ fontSize: 16 }} />
                    </Avatar>
                  )}
                  {msg.role === 'user' && (
                    <Avatar sx={{ bgcolor: '#94a3b8', width: 28, height: 28 }}>
                      <Person sx={{ fontSize: 16 }} />
                    </Avatar>
                  )}
                  <Box sx={{
                    px: 2, py: 1.5, borderRadius: 3,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    border: msg.role === 'bot' ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                  }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {msg.text}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
            <div ref={bottomRef} />
          </Box>

          {/* Quick Actions */}
          <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 0.8, flexWrap: 'wrap', bgcolor: '#f8fafc', borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}` }}>
            {quickActions.map(qa => (
              <Chip
                key={qa}
                label={qa}
                size="small"
                onClick={() => send(qa)}
                sx={{
                  fontWeight: 600, fontSize: '0.72rem',
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  color: 'primary.main',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.14) },
                  cursor: 'pointer',
                }}
              />
            ))}
          </Box>

          {/* Input */}
          <Box sx={{ p: 1.5, display: 'flex', gap: 1, bgcolor: 'white', borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}` }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3, fontSize: '0.9rem',
                  bgcolor: alpha(theme.palette.action.hover, 0.02),
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={() => send(input)}
              disabled={!input.trim()}
              sx={{
                bgcolor: 'primary.main', color: 'white', borderRadius: 3,
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
              }}
            >
              <Send sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Paper>
      </Slide>
    </>
  );
}
