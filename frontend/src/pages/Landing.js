import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Stack, Chip, Divider, Paper,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  AutoAwesome as AutoAwesomeIcon,
  PlayCircleOutline as PlayIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CloudQueue as CloudIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

const Landing = () => {
  return (
    <Box>
      {/* ========================================================= */}
      {/* HERO                                                      */}
      {/* ========================================================= */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: 'linear-gradient(180deg, #0A1929 0%, #132F4C 100%)',
        }}
      >
        <Container maxWidth="md">
          <Chip
            label="Powered by Google Gemini"
            color="primary"
            variant="outlined"
            sx={{ mb: 3 }}
          />
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '3.5rem' },
              mb: 2,
              lineHeight: 1.1,
            }}
          >
            Turn any video into a
            <Box component="span" sx={{ color: 'primary.main' }}> described timeline</Box>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 4, fontWeight: 400, maxWidth: 700 }}
          >
            Upload a video. Our AI detects scene changes and writes a
            one-sentence caption for every moment — so you can search,
            skim, and share without watching the whole thing.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              startIcon={<AutoAwesomeIcon />}
              sx={{ px: 4, py: 1.5, textTransform: 'none', fontSize: '1rem' }}
            >
              Try it free
            </Button>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5, textTransform: 'none', fontSize: '1rem' }}
            >
              Sign in
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            No credit card required · Free forever for personal use
          </Typography>
        </Container>
      </Box>

      {/* ========================================================= */}
      {/* HOW IT WORKS                                              */}
      {/* ========================================================= */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 1 }}>
          How it works
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Three steps from raw footage to a fully annotated timeline.
        </Typography>

        <Grid container spacing={4}>
          {[
            {
              icon: <CloudUploadIcon sx={{ fontSize: 40 }} />,
              step: '01',
              title: 'Upload your video',
              desc: 'Drag in any MP4, MOV, or WEBM file. We handle the rest — no codecs to configure, no formats to convert.',
            },
            {
              icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
              step: '02',
              title: 'AI analyzes it',
              desc: 'Scene detection splits the video into natural segments, then Gemini writes a caption for each one.',
            },
            {
              icon: <PlayIcon sx={{ fontSize: 40 }} />,
              step: '03',
              title: 'Review and refine',
              desc: 'Jump to any scene with one click, edit captions, delete what you don\'t need. Export when you\'re happy.',
            },
          ].map((s) => (
            <Grid item xs={12} md={4} key={s.step}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>{s.icon}</Box>
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', letterSpacing: 2 }}
                >
                  Step {s.step}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Divider />

      {/* ========================================================= */}
      {/* FEATURES                                                  */}
      {/* ========================================================= */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 1 }}>
          Everything you need
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Built for researchers, editors, journalists, and anyone who works with video.
        </Typography>

        <Grid container spacing={3}>
          {[
            { icon: <AutoAwesomeIcon />, title: 'AI captions', desc: 'Gemini describes every scene in plain English.' },
            { icon: <SpeedIcon />, title: 'Scene detection', desc: 'OpenCV finds transitions automatically — no manual scrubbing.' },
            { icon: <EditIcon />, title: 'Edit anything', desc: 'Fix timestamps and rewrite captions in one click.' },
            { icon: <PlayIcon />, title: 'Click to seek', desc: 'Jump straight to any moment from the clip list.' },
            { icon: <CloudIcon />, title: 'Cloud storage', desc: 'Videos and annotations stay available across sessions.' },
            { icon: <SecurityIcon />, title: 'Private by default', desc: 'Only you can see your videos. JWT-protected API.' },
            { icon: <DownloadIcon />, title: 'Export ready', desc: 'Annotations stored as structured data — export as JSON or SRT.' },
            { icon: <CheckIcon />, title: 'Free to start', desc: 'No credit card. Personal accounts are free forever.' },
          ].map((f) => (
            <Grid item xs={12} sm={6} md={3} key={f.title}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>{f.icon}</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {f.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Divider />

      {/* ========================================================= */}
      {/* PRICING                                                   */}
      {/* ========================================================= */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 1 }}>
          Simple pricing
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Start free. Upgrade when you need more room.
        </Typography>

        <Grid container spacing={3} alignItems="stretch">
          {[
            {
              name: 'Free',
              price: '$0',
              period: 'forever',
              tagline: 'For personal projects',
              features: [
                '5 videos per month',
                'Up to 40 MB per video',
                'AI captions in English',
                'Manual clip editing',
                'Community support',
              ],
              cta: 'Get started',
              highlight: false,
            },
            {
              name: 'Pro',
              price: '$9',
              period: 'per month',
              tagline: 'For creators and researchers',
              features: [
                'Unlimited videos',
                'Up to 2 GB per video',
                'Priority AI processing',
                'Export as JSON / SRT',
                'Email support',
                'Custom scene sensitivity',
              ],
              cta: 'Start free trial',
              highlight: true,
            },
            {
              name: 'Team',
              price: '$29',
              period: 'per month',
              tagline: 'For teams and studios',
              features: [
                'Everything in Pro',
                '5 team members',
                'Shared workspaces',
                'Role-based permissions',
                'API access',
                'Priority support',
              ],
              cta: 'Contact sales',
              highlight: false,
            },
          ].map((plan) => (
            <Grid item xs={12} md={4} key={plan.name}>
              <Paper
                elevation={plan.highlight ? 6 : 0}
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.paper',
                  border: '2px solid',
                  borderColor: plan.highlight ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <Chip
                    label="Most popular"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {plan.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.tagline}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <Typography variant="h3" sx={{ fontWeight: 800 }}>
                    {plan.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {plan.period}
                  </Typography>
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
                  component={Link}
                  to="/register"
                  variant={plan.highlight ? 'contained' : 'outlined'}
                  fullWidth
                  size="large"
                  sx={{ mt: 4, textTransform: 'none' }}
                >
                  {plan.cta}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          sx={{ mt: 4 }}
        >
          Prices shown are for demonstration. This is a portfolio project.
        </Typography>
      </Container>

      {/* ========================================================= */}
      {/* FOOTER                                                    */}
      {/* ========================================================= */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          py: 4,
          mt: 6,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary">
              🎬 Video Annotator — built with Django, React, and Gemini
            </Typography>
            <Stack direction="row" spacing={3}>
              <Button
                component="a"
                href="https://github.com/Fremal2024/video_annotator"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ textTransform: 'none' }}
              >
                GitHub
              </Button>
              <Button
                component={Link}
                to="/login"
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Sign in
              </Button>
              <Button
                component={Link}
                to="/register"
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Get started
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;