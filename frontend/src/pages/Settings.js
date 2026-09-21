import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Stack, Alert,
  Divider, Box, Chip, Switch, FormControlLabel, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
} from '@mui/material';
import {
  Lock as LockIcon,
  DeleteForever as DeleteIcon,
  CreditCard as CardIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { videoService } from '../services/api';
import { authService } from '../services/auth';

const Settings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  // Password change
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Preferences
  const [prefs, setPrefs] = useState({
    marketing_emails: true,
    product_updates: true,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Danger zone
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);

  useEffect(() => {
    videoService.getProfile().then((r) => {
      setProfile(r.data);
      setPrefs({
        marketing_emails: r.data.marketing_emails,
        product_updates: r.data.product_updates,
      });
    });
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPw.length < 8) {
      return setPwError('New password must be at least 8 characters');
    }
    if (newPw !== confirmPw) {
      return setPwError('Passwords do not match');
    }

    setPwLoading(true);
    try {
      await videoService.changePassword(oldPw, newPw);
      setPwSuccess('Password changed successfully');
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwError(err.response?.data?.error || 'Could not change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSavePrefs = async () => {
    setPrefsSaving(true);
    try {
      const formData = new FormData();
      formData.append('marketing_emails', prefs.marketing_emails);
      formData.append('product_updates', prefs.product_updates);
      await videoService.updateProfile(formData);
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleCancelPlan = async () => {
    await videoService.cancelPlan();
    setCancelDialog(false);
    navigate('/dashboard');
  };

  const handleDeleteAccount = async () => {
    await videoService.deleteAccount();
    authService.logout();
    window.location.href = '/';
  };

  const userPlan = (profile?.plan || 'free').toLowerCase();

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        ⚙️ Settings
      </Typography>

      {/* ============ Plan & Billing ============ */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <CardIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Plan &amp; billing
          </Typography>
        </Stack>

        {profile && (
          <>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Typography variant="body1">Current plan:</Typography>
              <Chip
                label={userPlan.toUpperCase()}
                color={userPlan === 'free' ? 'default' : 'primary'}
              />
            </Stack>

            {profile.has_payment_method && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                💳 {profile.card_brand || 'Card'} ending in {profile.card_last4 || '••••'}
                {profile.plan_renews_at && (
                  <>
                    {' '}
                    · renews on{' '}
                    {new Date(profile.plan_renews_at).toLocaleDateString()}
                  </>
                )}
              </Typography>
            )}

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/pricing')}
                sx={{ textTransform: 'none' }}
              >
                {userPlan === 'free' ? 'Upgrade' : 'Change plan'}
              </Button>
              {userPlan !== 'free' && (
                <Button
                  color="warning"
                  startIcon={<CancelIcon />}
                  onClick={() => setCancelDialog(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Cancel plan
                </Button>
              )}
            </Stack>
          </>
        )}
      </Paper>

      {/* ============ Change Password ============ */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <LockIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Change password
          </Typography>
        </Stack>

        {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
        {pwSuccess && <Alert severity="success" sx={{ mb: 2 }}>{pwSuccess}</Alert>}

        <form onSubmit={handleChangePassword}>
          <TextField
            fullWidth
            type="password"
            label="Current password"
            margin="normal"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            required
          />
          <TextField
            fullWidth
            type="password"
            label="New password"
            margin="normal"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            helperText="At least 8 characters"
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm new password"
            margin="normal"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            disabled={pwLoading}
            sx={{ mt: 2, textTransform: 'none' }}
            startIcon={
              pwLoading ? <CircularProgress size={18} color="inherit" /> : <LockIcon />
            }
          >
            {pwLoading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Paper>

      {/* ============ Preferences ============ */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          📧 Email preferences
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={prefs.marketing_emails}
              onChange={(e) =>
                setPrefs({ ...prefs, marketing_emails: e.target.checked })
              }
            />
          }
          label="Marketing emails and product news"
        />
        <br />
        <FormControlLabel
          control={
            <Switch
              checked={prefs.product_updates}
              onChange={(e) =>
                setPrefs({ ...prefs, product_updates: e.target.checked })
              }
            />
          }
          label="Product updates and feature announcements"
        />

        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={handleSavePrefs}
            disabled={prefsSaving}
            sx={{ textTransform: 'none' }}
          >
            {prefsSaving ? 'Saving…' : 'Save preferences'}
          </Button>
        </Box>
      </Paper>

      {/* ============ Danger Zone ============ */}
      <Paper sx={{ p: 4, border: '1px solid', borderColor: 'error.main' }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'error.main', mb: 2 }}
        >
          ⚠️ Danger zone
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Deleting your account permanently removes all your videos and annotations.
          This action cannot be undone.
        </Typography>
        <Button
          color="error"
          variant="outlined"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialog(true)}
          sx={{ textTransform: 'none' }}
        >
          Delete my account
        </Button>
      </Paper>

      {/* ============ Dialogs ============ */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle>Cancel your subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You'll be downgraded to the Free plan immediately. Your existing
            videos will remain, but new uploads will be limited to 5 per month.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Keep subscription</Button>
          <Button color="warning" variant="contained" onClick={handleCancelPlan}>
            Cancel subscription
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle color="error">Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This is permanent. All your videos, clips, and annotations will be
            deleted and cannot be recovered.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteAccount}>
            Yes, delete everything
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;