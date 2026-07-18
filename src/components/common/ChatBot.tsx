import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, TextField, IconButton, Paper, Avatar, Chip,
  useTheme, alpha, Slide,
} from '@mui/material';
import { Close, Send, SmartToy, Person, Forum } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const FAQ_KEYWORDS: { key: string; keywords: string[] }[] = [
  { key: 'chat.faq.pricing', keywords: ['price', 'pricing', 'cost', 'plan', 'plans', 'how much', 'fee', 'subscription'] },
  { key: 'chat.faq.trial', keywords: ['trial', 'free trial', 'demo', 'try', 'test drive'] },
  { key: 'chat.faq.variants', keywords: ['variant', 'variants', 'size', 'sugar', 'option', 'options', 'customization'] },
  { key: 'chat.faq.recipe', keywords: ['recipe', 'ingredient', 'bom', 'bill of material', 'inventory', 'stock', 'deduct'] },
  { key: 'chat.faq.kds', keywords: ['kds', 'kitchen', 'display', 'order', 'ticket'] },
  { key: 'chat.faq.pos', keywords: ['pos', 'checkout', 'register', 'barcode', 'scan', 'payment'] },
  { key: 'chat.faq.rbac', keywords: ['rbac', 'role', 'permission', 'access', 'security', 'admin', 'cashier'] },
  { key: 'chat.faq.branding', keywords: ['logo', 'brand', 'branding', 'receipt', 'settings', 'customize'] },
  { key: 'chat.faq.reports', keywords: ['report', 'analytics', 'insight', 'data', 'margin', 'sales report'] },
  { key: 'chat.faq.payments', keywords: ['payment', 'kbz', 'wave', 'aya', 'wallet', 'local'] },
  { key: 'chat.faq.support', keywords: ['support', 'help', 'contact', 'reach', 'email', 'phone'] },
  { key: 'chat.faq.greeting', keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening'] },
  { key: 'chat.faq.about', keywords: ['who', 'what is swifty', 'about', 'about swifty', 'tell me about'] },
];

let msgId = 0;
function nextId() { return String(++msgId); }

export default function ChatBot() {
  const theme = useTheme();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const greetingMsg = useMemo(() => ({ id: nextId(), role: 'bot' as const, text: t('chat.greeting') }), [t]);
  const [messages, setMessages] = useState<Message[]>(() => [greetingMsg]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const matchFAQ = useCallback((input: string): string | null => {
    const lower = input.toLowerCase();
    for (const item of FAQ_KEYWORDS) {
      if (item.keywords.some(kw => lower.includes(kw))) {
        return t(item.key);
      }
    }
    return null;
  }, [t]);

  const send = useMemo(() => (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: nextId(), role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const answer = matchFAQ(trimmed) ?? t('chat.fallback');
      setMessages(prev => [...prev, { id: nextId(), role: 'bot', text: answer }]);
    }, 400);
  }, [matchFAQ, t]);

  const quickActions = useMemo(() => [
    { label: t('chat.quick.pricing'), query: 'pricing' },
    { label: t('chat.quick.features'), query: 'features' },
    { label: t('chat.quick.inventory'), query: 'inventory' },
    { label: t('chat.quick.kds'), query: 'kds' },
    { label: t('chat.quick.support'), query: 'support' },
  ], [t]);

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
                <Typography fontWeight={800} fontSize="0.95rem">{t('chat.title')}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>{t('chat.subtitle')}</Typography>
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
                key={qa.query}
                label={qa.label}
                size="small"
                onClick={() => send(qa.query)}
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
              placeholder={t('chat.placeholder')}
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
