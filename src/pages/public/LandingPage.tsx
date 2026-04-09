import { Box, Container, Typography, Button, Grid, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Terminal, BarChart3, ChefHat, ShieldCheck, 
  ArrowRight, Store, Zap, Layers 
} from 'lucide-react';
import { useTheme, alpha } from '@mui/material/styles';

const FEATURES = [
  {
    title: 'Lightning Fast POS',
    description: 'Intercept physical barcode scans globally. 100ms multi-item checkout flows.',
    icon: Zap,
    color: '#f59e0b'
  },
  {
    title: 'Kitchen Display System',
    description: 'Keep your line cooks in sync with SLA-bound color-coded digital tickets.',
    icon: ChefHat,
    color: '#ef4444'
  },
  {
    title: 'Recipe & Ingredient Engine',
    description: 'Bill of Materials tracking. Sell an espresso, automatically deduct 18g of beans.',
    icon: Layers,
    color: '#10b981'
  },
  {
    title: 'Enterprise Analytics',
    description: 'Data-driven insights into inventory valuations, gross margins, and cashier performance.',
    icon: BarChart3,
    color: '#6366f1'
  },
  {
    title: 'RBAC Security',
    description: 'Granular permissions isolating your cashiers from your store managers and accountants.',
    icon: ShieldCheck,
    color: '#8b5cf6'
  },
  {
    title: 'Hardware Agnostic',
    description: 'Runs flawlessly on iPads, standard desktop web browsers, and touch-screen kiosks.',
    icon: Terminal,
    color: '#3b82f6'
  }
];

const PRICING = [
  { name: 'Standard', price: '9,000 Ks', desc: 'Perfect for single-location cafes.', feat: ['1 Register', 'Basic Analytics', 'Standard Support'], trial: true },
  { name: 'Pro', price: '29,000 Ks', desc: 'For growing multi-location restaurants.', feat: ['Unlimited Registers', 'KDS Screen', 'Recipe Inventory (BOM)', 'Priority Support'], popular: true, trial: true },
  { name: 'Enterprise', price: '79,000 Ks', desc: 'High-volume institutional setups.', feat: ['Custom RBAC', 'Multi-Store Management', '24/7 Priority Support', 'Dedicated Account Manager'], trial: false }
];

const LOCAL_PAYMENTS = [
  { name: 'KBZPay', color: '#1B65A6', logo: '/payments/kbzpay.png' },
  { name: 'WavePay', color: '#FEDB00', logo: '/payments/wavepay.png' },
  { name: 'AYA Pay', color: '#DE1F26', logo: '/payments/ayapay.png' },
  { name: 'Citizen Pay', color: '#E42313', logo: '/payments/citizenpay.png' }
];

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', overflowX: 'hidden' }}>
      {/* NAVBAR */}
      <Box component="nav" sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, bgcolor: alpha('#ffffff', 0.8), backdropFilter: 'blur(12px)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="xl" sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: 'primary.main', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', boxShadow: theme.shadows[4] }}>
              <Store size={24} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: -0.5 }}>
              Swifty <span style={{ color: theme.palette.text.secondary, fontWeight: 300 }}>POS</span>
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4, alignItems: 'center' }}>
            {['Features', 'Pricing'].map(item => (
              <Typography key={item} sx={{ fontWeight: 600, color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>{item}</Typography>
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => navigate('/login')} sx={{ display: { xs: 'none', sm: 'flex' }, borderRadius: 3, px: 3, fontWeight: 700, borderColor: 'divider' }}>
              Sign In
            </Button>
            <Button variant="contained" endIcon={<ArrowRight size={18} />} onClick={() => navigate('/login')} sx={{ borderRadius: 3, px: { xs: 2, sm: 3 }, py: 1, fontWeight: 800, boxShadow: `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.4)}` }}>
              Try Free
            </Button>
          </Box>
        </Container>
      </Box>

      {/* HERO SECTION */}
      <Container maxWidth="lg" sx={{ pt: { xs: 20, md: 28 }, pb: 16, textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', px: 2, py: 0.5, borderRadius: 10, mb: 4, fontWeight: 800, fontSize: '0.875rem' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>✨</span> Announcing Swifty POS 2.0
          </Box>
          <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '5.5rem' }, fontWeight: 900, letterSpacing: -2, lineHeight: 1.1, color: '#0f172a', mb: 3 }}>
            The retail OS that moves at the <br/>
            <span style={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              speed of your business.
            </span>
          </Typography>
          <Typography variant="h5" sx={{ color: '#64748b', mb: 6, maxWidth: 700, mx: 'auto', fontWeight: 400, lineHeight: 1.5 }}>
            Enterprise-grade point of sale, kitchen display systems, and automated inventory logistics wrapped in a stunningly simple interface.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button variant="contained" size="large" onClick={() => navigate('/login')} sx={{ py: 2, px: 5, borderRadius: 4, fontSize: '1.1rem', fontWeight: 800, boxShadow: `0 20px 40px -10px ${alpha(theme.palette.primary.main, 0.5)}` }}>
              Start 14-Day Free Trial
            </Button>
            <Button variant="outlined" size="large" onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} sx={{ py: 2, px: 5, borderRadius: 4, fontSize: '1.1rem', fontWeight: 700, color: '#334155', borderColor: '#cbd5e1' }}>
              Explore Features
            </Button>
          </Box>
        </motion.div>
      </Container>

      {/* FEATURE GRID */}
      <Box sx={{ bgcolor: 'white', py: 16, borderTop: '1px solid #f1f5f9' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" fontWeight={900} mb={2} color="#0f172a">Everything you need to scale</Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" mb={10} fontWeight={400}>Ditch the legacy hardware. Run your entire store from the cloud.</Typography>
          
          <Grid container spacing={4}>
            {FEATURES.map((feat, i) => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <Paper elevation={0} sx={{ p: 5, borderRadius: 5, height: '100%', bgcolor: '#f8fafc', border: '1px solid #f1f5f9', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', borderColor: feat.color, boxShadow: `0 12px 24px -8px ${alpha(feat.color, 0.2)}` } }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: alpha(feat.color, 0.1), color: feat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                      <feat.icon size={28} />
                    </Box>
                    <Typography variant="h6" fontWeight={800} mb={1} color="#0f172a">{feat.title}</Typography>
                    <Typography color="#64748b" lineHeight={1.6}>{feat.description}</Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* PRICING */}
      <Box sx={{ py: 16, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
           <Typography variant="h3" textAlign="center" fontWeight={900} mb={2} color="#0f172a">Simple, transparent pricing</Typography>
           <Typography variant="h6" textAlign="center" color="text.secondary" mb={10} fontWeight={400}>No hidden fees. Cancel anytime.</Typography>

           <Grid container spacing={4} alignItems="stretch">
              {PRICING.map((plan, i) => (
                <Grid size={{ xs: 12, md: 4 }} key={i} sx={{ display: 'flex' }}>
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ display: 'flex', width: '100%' }}>
                    <Paper elevation={plan.popular ? 8 : 0} sx={{ p: 5, borderRadius: 6, position: 'relative', border: plan.popular ? `2px solid ${theme.palette.primary.main}` : '1px solid #e2e8f0', bgcolor: 'white', display: 'flex', flexDirection: 'column', width: '100%' }}>
                      {plan.popular && (
                        <Box sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', bgcolor: 'primary.main', color: 'white', px: 2, py: 0.5, borderRadius: 10, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                          Most Popular
                        </Box>
                      )}
                      <Typography variant="h5" fontWeight={800} color={plan.popular ? 'primary.main' : '#0f172a'} mb={1}>{plan.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                        <Typography variant="h3" fontWeight={900}>{plan.price}</Typography>
                        {plan.price !== 'Custom' && <Typography color="text.secondary" fontWeight={600} ml={1}>/mo</Typography>}
                      </Box>
                      <Typography color="text.secondary" mb={4}>{plan.desc}</Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4, flex: 1 }}>
                        {plan.feat.map(f => (
                          <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShieldCheck size={14} />
                            </Box>
                            <Typography fontWeight={600} color="#334155">{f}</Typography>
                          </Box>
                        ))}
                      </Box>

                      <Button fullWidth variant={plan.popular ? 'contained' : 'outlined'} size="large" onClick={() => navigate('/login')} sx={{ py: 1.5, borderRadius: 3, fontWeight: 800 }}>
                        {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start 14-Day Free Trial'}
                      </Button>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
           </Grid>

           {/* Local Payment Trust Section */}
           <Box sx={{ mt: 12, textAlign: 'center' }}>
             <Typography variant="overline" fontWeight={800} color="primary" sx={{ letterSpacing: 2 }}>
               Localized for Myanmar SMEs
             </Typography>
             <Typography variant="h4" fontWeight={900} mt={1} mb={4} color="#0f172a">
               Pay with local digital wallets
             </Typography>
             <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, md: 5 }, flexWrap: 'wrap' }}>
               {LOCAL_PAYMENTS.map(pay => (
                 <Paper 
                  key={pay.name} 
                  elevation={0} 
                  sx={{ 
                    px: 3, py: 1.5, borderRadius: 4, 
                    border: '1px solid #e2e8f0', 
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: pay.color, bgcolor: alpha(pay.color, 0.03) }
                  }}
                 >
                   <Box component="img" src={pay.logo} alt={pay.name} sx={{ width: 28, height: 28, borderRadius: 1, objectFit: 'contain' }} />
                   <Typography fontWeight={800} color="#334155">{pay.name}</Typography>
                 </Paper>
               ))}
             </Box>
           </Box>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ bgcolor: '#0f172a', py: 8, color: '#94a3b8' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: alpha('#ffffff', 0.1), display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
              <Store size={18} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'white' }}>Swifty POS</Typography>
          </Box>
          <Typography variant="body2">© 2026 Swifty Technologies Inc. All rights reserved.</Typography>
        </Container>
      </Box>
    </Box>
  );
}
