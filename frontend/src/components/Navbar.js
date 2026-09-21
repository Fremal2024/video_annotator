import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton,
  Avatar, Menu, MenuItem, Divider, ListItemIcon, Stack,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  CardGiftcard as ReferralIcon,
  AttachMoney as PricingIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { authService } from '../services/auth';
import { videoService } from '../services/api';

const NAV_LINKS_PUBLIC = [
  { label: 'How it works', to: '/#how' },
  { label: 'Features',     to: '/#features' },
  { label: 'Pricing',      to: '/pricing' },
];

const NAV_LINKS_AUTHED = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Pricing',   to: '/pricing' },
];

const Navbar = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [profile, setProfile] = useState(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // ------------------------------------------------------------------
  // Load profile so we can show the real avatar in the top-right
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isLoggedIn) {
      setProfile(null);
      return;
    }
    let active = true;
    videoService
      .getProfile()
      .then((r) => {
        if (active) setProfile(r.data);
      })
      .catch(() => {});

    // Refresh avatar whenever another page dispatches this event
    const refresh = () => {
      videoService.getProfile().then((r) => active && setProfile(r.data)).catch(() => {});
    };
    window.addEventListener('profile-updated', refresh);

    return () => {
      active = false;
      window.removeEventListener('profile-updated', refresh);
    };
  }, [isLoggedIn]);

  // ------------------------------------------------------------------
  // Avatar fallback logic — same as the Profile page
  // ------------------------------------------------------------------
  const getInitial = () => {
    if (profile?.first_name) return profile.first_name[0].toUpperCase();
    if (profile?.username) return profile.username[0].toUpperCase();
    return '?';
  };

  const go = (path) => {
    handleClose();
    if (path.startsWith('/#')) {
      const id = path.replace('/#', '');
      if (location.pathname === '/') {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } else {
      navigate(path);
    }
  };

  const links = isLoggedIn ? NAV_LINKS_AUTHED : NAV_LINKS_PUBLIC;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Typography
          variant="h6"
          component={Link}
          to={isLoggedIn ? '/dashboard' : '/'}
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          🎬 Video Annotator
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}
        >
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Button
                key={link.to}
                onClick={() => go(link.to)}
                sx={{
                  color: active ? 'primary.main' : 'text.secondary',
                  textTransform: 'none',
                  fontWeight: active ? 600 : 500,
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {link.label}
              </Button>
            );
          })}
        </Stack>

        {isLoggedIn ? (
          <>
            <IconButton onClick={handleAvatarClick} size="small">
              <Avatar
                src={profile?.avatar_url || undefined}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {getInitial()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}
            >
              <MenuItem onClick={() => go('/dashboard')}>
                <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                Dashboard
              </MenuItem>
              <MenuItem onClick={() => go('/profile')}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={() => go('/settings')}>
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
              <MenuItem onClick={() => go('/referral')}>
                <ListItemIcon><ReferralIcon fontSize="small" /></ListItemIcon>
                Refer &amp; earn
              </MenuItem>
              <MenuItem onClick={() => go('/pricing')}>
                <ListItemIcon><PricingIcon fontSize="small" /></ListItemIcon>
                Plans &amp; pricing
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleClose(); onLogout(); }}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button onClick={() => navigate('/login')} sx={{ textTransform: 'none' }}>
              Sign in
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{ textTransform: 'none' }}
            >
              Get started
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;