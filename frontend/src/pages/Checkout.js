import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Grid, Stack,
  Alert, CircularProgress, Divider, Box, Chip,
} from '@mui/material';
import { Lock as LockIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { videoService } from '../services/api';

const PLAN_INFO = {
  pro:  { name: 'Pro',  price: '$9',  features: ['Unlimited videos', '2 GB per video', 'Priority AI'] },
  team: { name: 'Team', price: '$29', features: ['Everything in Pro', '5 team members', 'API access'] },
};

const Checkout = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const planId = params.get('plan') || 'pro';
  const plan = PLAN_INFO[planId] || PLAN_INFO.pro;

  const [card, setCard] = useState({
    number: '4242 4242 4242 4242',
    name: '',
    expiry: '12/29',
    cvc: '123',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) =>
    setCard({ ...card, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await videoService.upgradePlan(planId, card);
      navigate('/dashboard?upgraded=1');
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Button startIcon={<BackIcon />} component={Link} to="/pricing" sx={{ mb: 2 }}>
        Back to pricing
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Complete your upgrade
      </Typography>

      <Grid container spacing={3}>
        {/* Left: form */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <LockIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Secure checkout (simulated)
              </Typography>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Card number" margin="normal"
                value={card.number} onChange={handleChange('number')}
                placeholder="4242 4242 4242 4242"
              />
              <TextField
                fullWidth label="Name on card" margin="normal"
                value={card.name} onChange={handleChange('name')}
                placeholder="Jane Doe"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Expiry" value={card.expiry}
                  onChange={handleChange('expiry')} margin="normal"
                  placeholder="MM/YY" sx={{ flex: 1 }}
                />
                <TextField
                  label="CVC" value={card.cvc}
                  onChange={handleChange('cvc')} margin="normal"
                  placeholder="123" sx={{ flex: 1 }}
                />
              </Stack>

              <Button
                type="submit" variant="contained" fullWidth size="large"
                disabled={loading} sx={{ mt: 3, textTransform: 'none' }}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
              >
                {loading ? 'Processing…' : `Pay ${plan.price} and upgrade`}
              </Button>

              <Typography variant="caption" color="text.secondary"
                sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                This is a demo — no real charge. Any 12+ digit number works.
              </Typography>
            </form>
          </Paper>
        </Grid>

        {/* Right: order summary */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Order summary
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {plan.name} plan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Billed monthly
                </Typography>
              </Box>
              <Chip label={plan.price} color="primary" />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1}>
              {plan.features.map((f) => (
                <Typography key={f} variant="body2" color="text.secondary">
                  ✓ {f}
                </Typography>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total due today</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{plan.price}</Typography>
            </Stack>

            <Typography variant="caption" color="text.secondary"
              sx={{ display: 'block', mt: 1 }}>
              Renews in 30 days. Cancel anytime from Settings.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;