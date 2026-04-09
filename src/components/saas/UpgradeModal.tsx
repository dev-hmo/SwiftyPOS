import { useState, useEffect } from 'react';
import {
  Dialog, Box, Typography, Button, IconButton,
  Grid, Paper, TextField, useTheme, alpha, CircularProgress,
  Stepper, Step, StepLabel, Avatar
} from '@mui/material';
import {
  Close, CloudUpload, CheckCircle, WorkspacePremium,
  QrCode2, PhoneIphone
} from '@mui/icons-material';
import { useUpgradeStore } from '../../store/useUpgradeStore';
import { useSubscriptionStore, type PlanTier } from '../../store/useSubscriptionStore';
import { motion, AnimatePresence } from 'framer-motion';

const PAYMENT_METHODS = [
  { id: 'kbzpay', name: 'KBZPay', color: '#1B65A6', logo: '/payments/kbzpay.png', account: '09xxxxxxxxx', name_reg: 'Swifty POS Co., Ltd.' },
  { id: 'wavepay', name: 'WavePay', color: '#FEDB00', logo: '/payments/wavepay.png', account: '09xxxxxxxxx', name_reg: 'Swifty POS Co., Ltd.' },
  { id: 'ayapay', name: 'AYA Pay', color: '#DE1F26', logo: '/payments/ayapay.png', account: '09xxxxxxxxx', name_reg: 'Swifty POS Co., Ltd.' },
  { id: 'citizen', name: 'Citizen Pay', color: '#E42313', logo: '/payments/citizenpay.png', account: '09xxxxxxxxx', name_reg: 'Swifty POS Co., Ltd.' },
];

const PLANS: { tier: PlanTier; price: number; features: string[]; trial?: boolean }[] = [
  { tier: 'Standard', price: 9000, features: ['14-Day Free Trial Included', 'Basic POS functionality', 'Standard Reports'], trial: true },
  { tier: 'Pro', price: 29000, features: ['Kitchen Display System (KDS)', 'Recipe Costing Engine (BOM)', 'Advanced Analytics'], trial: true },
  { tier: 'Enterprise', price: 79000, features: ['Custom Role Based Access (RBAC)', 'Multi-Store Franchising', 'Priority 24/7 Support'], trial: false },
];

export default function UpgradeModal() {
  const theme = useTheme();
  const { isOpen, targetTier, closeModal } = useUpgradeStore();
  const { currentPlan, setPlan } = useSubscriptionStore();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [transactionId, setTransactionId] = useState('');
  const [screenshotSelected, setScreenshotSelected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
      setSelectedPlan(targetTier || 'Pro');
      setSelectedMethod(PAYMENT_METHODS[0]);
      setTransactionId('');
      setScreenshotSelected(false);
      setIsSuccess(false);
      setIsProcessing(false);
    }
  }, [isOpen, targetTier]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    
    // Simulate API Verification
    setTimeout(() => {
      setPlan(selectedPlan);
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Auto close after success
      setTimeout(() => {
        closeModal();
      }, 3000);
    }, 2000);
  };

  const steps = ['Select Plan', 'Payment Provider', 'Verification'];

  return (
    <Dialog open={isOpen} onClose={(!isProcessing && !isSuccess) ? closeModal : undefined} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
      <Box sx={{ position: 'relative', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
        
        {/* Header Ribbon */}
        <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <WorkspacePremium color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={800}>Upgrade Workspace Subscription</Typography>
          </Box>
          {(!isProcessing && !isSuccess) && (
            <IconButton onClick={closeModal} size="small" sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1) }}>
              <Close />
            </IconButton>
          )}
        </Box>

        <Box sx={{ px: 5, py: 4, flex: 1 }}>
          {!isSuccess ? (
            <>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* STEP 0: SELECT PLAN */}
                  {activeStep === 0 && (
                    <Grid container spacing={3}>
                      {PLANS.map((plan) => (
                        <Grid size={{ xs: 12, md: 4 }} key={plan.tier}>
                          <Paper
                            elevation={selectedPlan === plan.tier ? 4 : 0}
                            onClick={() => setSelectedPlan(plan.tier)}
                            sx={{
                              p: 3, height: '100%', borderRadius: 4, cursor: 'pointer',
                              border: `2px solid ${selectedPlan === plan.tier ? theme.palette.primary.main : alpha(theme.palette.divider, 0.1)}`,
                              bgcolor: selectedPlan === plan.tier ? alpha(theme.palette.primary.main, 0.02) : 'background.paper',
                              transition: 'all 0.2s ease', position: 'relative',
                            }}
                          >
                            {plan.tier === currentPlan && (
                              <Box sx={{ position: 'absolute', top: -12, right: 16, bgcolor: 'text.secondary', color: 'white', px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.75rem', fontWeight: 800 }}>
                                CURRENT
                              </Box>
                            )}
                            <Typography variant="h5" fontWeight={900} mb={1}>{plan.tier}</Typography>
                            <Typography variant="h4" color="primary" fontWeight={900} mb={3}>
                              {plan.price === 0 ? 'Free' : `${plan.price.toLocaleString()} Ks`}
                              {plan.price !== 0 && <Typography component="span" variant="body2" color="text.secondary"> /mo</Typography>}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              {plan.features.map((f, i) => (
                                <Typography key={i} variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} /> {f}
                                </Typography>
                              ))}
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {/* STEP 1: PAYMENT PROVIDER */}
                  {activeStep === 1 && (
                    <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={800} mb={1}>Select Myanmar Local Gateway</Typography>
                      <Typography color="text.secondary" mb={4}>We accept manual transfers via your preferred digital wallet. Please prepare your app to scan or copy the payment number.</Typography>
                      
                      <Grid container spacing={2}>
                        {PAYMENT_METHODS.map((method) => (
                          <Grid size={{ xs: 6 }} key={method.id}>
                            <Paper
                              elevation={selectedMethod.id === method.id ? 2 : 0}
                              onClick={() => setSelectedMethod(method)}
                              sx={{
                                p: 2, borderRadius: 3, cursor: 'pointer',
                                border: `2px solid ${selectedMethod.id === method.id ? method.color : alpha(theme.palette.divider, 0.1)}`,
                                bgcolor: selectedMethod.id === method.id ? alpha(method.color, 0.05) : 'background.paper',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                                '&:hover': { borderColor: method.color }
                              }}
                            >
                              <Box component="img" src={method.logo} alt={method.name} sx={{ width: 32, height: 32, borderRadius: 1.5, objectFit: 'contain' }} />
                              <Typography fontWeight={800} sx={{ color: method.color }}>{method.name}</Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* STEP 2: VERIFICATION UPLOAD */}
                  {activeStep === 2 && (
                    <Grid container spacing={4}>
                      {/* Left: Instructions */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: alpha(selectedMethod.color, 0.05), border: `1px dashed ${alpha(selectedMethod.color, 0.3)}`, height: '100%' }}>
                          <Typography variant="overline" fontWeight={800} sx={{ color: selectedMethod.color }}>1. Transfer Funds</Typography>
                          <Typography variant="h5" fontWeight={900} mb={3}>Pay {PLANS.find(p => p.tier === selectedPlan)?.price.toLocaleString()} Ks</Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: selectedMethod.color }}><PhoneIphone /></Avatar>
                            <Box>
                              <Typography variant="body2" color="text.secondary" fontWeight={600}>Transfer Phone Number</Typography>
                              <Typography variant="h6" fontWeight={800}>{selectedMethod.account}</Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                            <Avatar sx={{ bgcolor: selectedMethod.color }}><QrCode2 /></Avatar>
                            <Box>
                              <Typography variant="body2" color="text.secondary" fontWeight={600}>Registered Name</Typography>
                              <Typography variant="h6" fontWeight={800}>{selectedMethod.name_reg}</Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Open your {selectedMethod.name} app, send the exact amount, and take a screenshot of the successful transaction.
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* Right: Upload Form */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', justifyContent: 'center' }}>
                          <Typography variant="overline" fontWeight={800} color="primary">2. Submit Verification</Typography>
                          
                          <TextField
                            fullWidth
                            label="Transaction ID (Last 6 Digits)"
                            variant="outlined"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            InputProps={{ sx: { borderRadius: 3, fontWeight: 700 } }}
                          />

                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{
                              p: 3, borderRadius: 3, borderStyle: 'dashed', borderWidth: 2,
                              color: screenshotSelected ? 'success.main' : 'text.secondary',
                              borderColor: screenshotSelected ? 'success.main' : 'divider'
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <CloudUpload fontSize="large" color={screenshotSelected ? "success" : "inherit"} />
                              <Typography fontWeight={700}>
                                {screenshotSelected ? 'Screenshot Uploaded.png' : 'Upload Payment Screenshot'}
                              </Typography>
                            </Box>
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  setScreenshotSelected(true);
                                }
                              }}
                            />
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            /* SUCCESS STATE */
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
              </motion.div>
              <Typography variant="h4" fontWeight={900} mb={1}>Upgrade Successful!</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
                Your payment screenshot has been submitted and your account has been instantly upgraded to the <b>{selectedPlan}</b> plan. Welcome to the next level of Swifty POS.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer Actions */}
        {!isSuccess && (
          <Box sx={{ p: 3, bgcolor: alpha(theme.palette.action.hover, 0.05), borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', justifyContent: 'space-between' }}>
            <Button disabled={activeStep === 0 || isProcessing} onClick={handleBack} sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}>
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!transactionId || !screenshotSelected || isProcessing}
                sx={{ borderRadius: 3, fontWeight: 800, px: 4 }}
              >
                {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'Submit & Upgrade'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={selectedPlan === 'Enterprise' ? closeModal : handleNext}
                disabled={!selectedPlan || (selectedPlan === currentPlan)}
                sx={{ borderRadius: 3, fontWeight: 800, px: 4 }}
              >
                {selectedPlan === 'Enterprise' ? 'Contact Sales' : 'Continue'}
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
