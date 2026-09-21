import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, TextField, Button, Grid, Avatar,
  Stack, Alert, CircularProgress, Box, Chip, Divider, MenuItem,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Person as PersonIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { videoService } from '../services/api';

const COUNTRIES = [
  'Kenya', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'South Africa', 'Nigeria', 'India', 'Other',
];

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    videoService
      .getProfile()
      .then((r) => {
        setProfile(r.data);
        setAvatarPreview(r.data.avatar_url || null);
      })
      .catch(() => setError('Could not load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field) => (e) =>
    setProfile({ ...profile, [field]: e.target.value });

  const handleAvatarChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setAvatarFile(f);
      setAvatarPreview(URL.createObjectURL(f));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      if (profile.first_name) formData.append('first_name', profile.first_name);
      if (profile.last_name) formData.append('last_name', profile.last_name);
      if (profile.email) formData.append('email', profile.email);
      if (profile.phone) formData.append('phone', profile.phone);
      if (profile.country) formData.append('country', profile.country);
      if (profile.dob) formData.append('dob', profile.dob);
      if (profile.bio) formData.append('bio', profile.bio);
      if (avatarFile) formData.append('avatar', avatarFile);

      const r = await videoService.updateProfile(formData);
      setProfile(r.data);
      setAvatarFile(null);
      setSuccess('Profile saved successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const userPlan = (profile?.plan || 'free').toLowerCase();

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <PersonIcon color="primary" sx={{ fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Profile
        </Typography>
        <Chip
          label={userPlan.toUpperCase()}
          color={userPlan === 'free' ? 'default' : 'primary'}
          size="small"
        />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* Avatar column */}
          <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
            <Avatar
              src={avatarPreview || undefined}
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: 48,
              }}
            >
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <input
              type="file"
              accept="image/*"
              id="avatar-upload"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <label htmlFor="avatar-upload">
              <Button
                component="span"
                variant="outlined"
                size="small"
                startIcon={<UploadIcon />}
                sx={{ textTransform: 'none' }}
              >
                Change photo
              </Button>
            </label>
            <Typography
              variant="caption"
              display="block"
              sx={{ mt: 1 }}
              color="text.secondary"
            >
              JPG or PNG, max 2 MB
            </Typography>
          </Grid>

          {/* Form column */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First name"
                  value={profile?.first_name || ''}
                  onChange={handleChange('first_name')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last name"
                  value={profile?.last_name || ''}
                  onChange={handleChange('last_name')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={profile?.username || ''}
                  disabled
                  helperText="Username cannot be changed"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profile?.email || ''}
                  onChange={handleChange('email')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone number"
                  value={profile?.phone || ''}
                  onChange={handleChange('phone')}
                  placeholder="+254 700 000 000"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Country"
                  value={profile?.country || ''}
                  onChange={handleChange('country')}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {COUNTRIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of birth"
                  type="date"
                  value={profile?.dob || ''}
                  onChange={handleChange('dob')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={3}
                  value={profile?.bio || ''}
                  onChange={handleChange('bio')}
                  placeholder="Tell us a bit about yourself…"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={saving}
              startIcon={
                saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
              }
              sx={{ textTransform: 'none' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile;