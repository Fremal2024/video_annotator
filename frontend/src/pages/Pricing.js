import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Paper, Button, Stack,
  Chip, Divider, Alert,
} from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';
import { authService } from '../services/auth';

const PLANS = [
  {
    name: 'Free', price: '$0', period: 'forever',
    tagline: 'For personal projects',
    features: [
      '5 videos per month', 'Up to 40 MB per video',
      'AI captions (Gemini)', 'Manual clip editing', 'Community support',
    ],
    cta: 'Current plan', planId: 'free', highlight: false,
  },
  {
    name: 'Pro', price: '$9', period: 'per month',
    tagline: 'For creators and researchers',
    features: [
      'Unlimited videos', 'Up to 2 GB per video',
      'Priority AI processing', 'Export as JSON / SRT',
      'Custom scene sensitivity', 'Email support',
    ],
    cta: 'Upgrade to Pro', planId: 'pro', highlight: true,
  },
  {
    name: 'Team', price: '$29', period: 'per month',
    tagline: 'For teams and studios',
    features: [
      'Everything in Pro', '5 team members',
      'Shared workspaces', 'Role-based permissions',
      'REST API access', 'Priority support',
    ],
    cta: 'Upgrade to Team', planId: 'team', highlight: false,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const isLoggedIn = authService.isLoggedIn();

  const handleChoose = (planId) => {
    if (planId === 'free') return;
    if (!isLoggedIn) {
      navigate('/register');
      return;
    }
    navigate(`/checkout?plan=${planId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" align="center" sx={{ fontWeight: 800, mb: 1 }}>
        Plans for every workflow
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary"
        sx={{ mb: 5, maxWidth: 600, mx: 'auto' }}>
        Start free. Upgrade when you need more room, faster processing, or team features.
      </Typography>

      <Grid container spacing={3} alignItems="stretch">
        {PLANS.map((plan) => (
          <Grid item xs={12} md={4} key={plan.name}>
            <Paper elevation={plan.highlight ? 6 : 0} sx={{
              p: 4, height: '100%', display: 'flex', flexDirection: 'column',
              bgcolor: 'background.paper', border: '2px solid',
              borderColor: plan.highlight ? 'primary.main' : 'divider',
              borderRadius: 3, position: 'relative', transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
            }}>
              {plan.highlight && (
                <Chip label="Most popular" color="primary" size="small" sx={{
                  position: 'absolute', top: -12, left: '50%',
                  transform: 'translateX(-50%)', fontWeight: 700,
                }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{plan.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {plan.tagline}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>{plan.price}</Typography>
                <Typography variant="body2" color="text.secondary">{plan.period}</Typography>
              </Stack>
              <Divider sx={{ my: 3 }} />
              <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                {plan.features.map((f) => (
                  <Stack direction="row" spacing={1} key={f} alignItems="flex-start">
                    <CheckIcon color="primary" fontSize="small" sx={{ mt: 0.3 }} />
                    <Typography variant="body2">{f}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Button
                onClick={() => handleChoose(plan.planId)}
                disabled={plan.planId === 'free'}
                variant={plan.highlight ? 'contained' : 'outlined'}
                fullWidth size="large"
                sx={{ mt: 4, textTransform: 'none', fontWeight: 600 }}
              >
                {plan.cta}
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Alert severity="info" sx={{ mt: 5, maxWidth: 600, mx: 'auto' }}>
        <strong>Demo pricing.</strong> No real payments are processed — this is a
        portfolio project. Use card number <code>4242 4242 4242 4242</code> at checkout.
      </Alert>

      <Box sx={{ mt: 8, maxWidth: 720, mx: 'auto' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
          Frequently asked questions
        </Typography>
        <Stack spacing={3}>
          {[
            { q: 'Is the Free plan really free?',
              a: 'Yes. You can upload up to 5 videos per month, forever. No credit card required.' },
            { q: 'What video formats do you support?',
              a: 'Any format modern browsers play: MP4, MOV, WEBM, and most others.' },
            { q: 'Can I export my annotations?',
              a: 'On Pro and Team plans, you can export clips as JSON or SRT subtitles.' },
            { q: 'How long does AI processing take?',
              a: 'Usually 30–90 seconds for a 1-minute video. Longer videos take proportionally longer.' },
          ].map((faq) => (
            <Paper key={faq.q} sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                {faq.q}
              </Typography>
              <Typography variant="body2" color="text.secondary">{faq.a}</Typography>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Container>
  );
};

export default Pricing;