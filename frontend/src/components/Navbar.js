import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton,
  Avatar, Menu, MenuItem, Divider, ListItemIcon, Stack,
  Drawer, List, ListItem, ListItemButton, ListItemText,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  CardGiftcard as ReferralIcon,
  AttachMoney as PricingIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
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

const ACCOUNT_LINKS = [
  { label: 'Dashboard',      to: '/dashboard', Icon: DashboardIcon },
  { label: 'Profile',        to: '/profile',   Icon: PersonIcon },
  { label: 'Settings',       to: '/settings',  Icon: SettingsIcon },
  { label: 'Refer & earn',   to: '/referral',  Icon: ReferralIcon },
  { label: 'Plans & pricing',to: '/pricing',   Icon: PricingIcon },
];

const Navbar = ({ isLoggedIn, onLogout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigate = useNavigate();
  const location = useLocation();

  // Desktop dropdown
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [profile, setProfile] = useState(null);

  const handleAvatarClick = (e) => {
    if (isMobile) {
      setDrawerOpen(true);
    } else {
      setAnchorEl(e.currentTarget);
    }
  };
  const handleClose = () => setAnchorEl(null);
  const handleDrawerClose = () => setDrawerOpen(false);

  // ------------------------------------------------------------------
  // Load the profile so we can show the avatar
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isLoggedIn) {
      setProfile(null);
      return;
    }
    let active = true;
    videoService
      .getProfile()
      .then((r) => active && setProfile(r.data))
      .catch(() => {});

    const refresh = () => {
      videoService
        .getProfile()
        .then((r) => active && setProfile(r.data))
        .catch(() => {});
    };
    window.addEventListener('profile-updated', refresh);

    return () => {
      active = false;
      window.removeEventListener('profile-updated', refresh);
    };
  }, [isLoggedIn]);

  const getInitial = () => {
    if (profile?.first_name) return profile.first_name[0].toUpperCase();
    if (profile?.username) return profile.username[0].toUpperCase();
    return '?';
  };

  const go = (path) => {
    handleClose();
    handleDrawerClose();
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
    <>
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
              fontSize: { xs: '1rem', md: '1.25rem' },
            }}
          >
            🎬 Video Annotator
          </Typography>

          {/* Center nav links — desktop only */}
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

          {/* Spacer on mobile */}
          <Box sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }} />

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

              {/* Desktop dropdown */}
              {!isMobile && (
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  slotProps={{
                    paper: { sx: { minWidth: 220, mt: 1, mr: 1 } },
                  }}
                >
                  {ACCOUNT_LINKS.map(({ label, to, Icon }) => (
                    <MenuItem key={to} onClick={() => go(to)}>
                      <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
                      {label}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem onClick={() => { handleClose(); onLogout(); }}>
                    <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              )}
            </>
          ) : (
            <>
              {isMobile ? (
                <IconButton onClick={() => setDrawerOpen(true)} size="large" color="inherit">
                  <MenuIcon />
                </IconButton>
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
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* ============================================================ */}
      {/* Mobile drawer                                                 */}
      {/* ============================================================ */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            width: { xs: '85%', sm: 320 },
            bgcolor: 'background.paper',
          },
        }}
      >
        {/* Header with user info */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {isLoggedIn && (
              <Avatar
                src={profile?.avatar_url || undefined}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'primary.main',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {getInitial()}
              </Avatar>
            )}
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {profile?.first_name
                  ? `${profile.first_name} ${profile.last_name || ''}`.trim()
                  : profile?.username || 'Account'}
              </Typography>
              {profile?.email && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {profile.email}
                </Typography>
              )}
            </Box>
            <IconButton onClick={handleDrawerClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Links */}
        <List sx={{ pt: 1 }}>
          {isLoggedIn ? (
            <>
              {ACCOUNT_LINKS.map(({ label, to, Icon }) => (
                <ListItem key={to} disablePadding>
                  <ListItemButton
                    onClick={() => go(to)}
                    sx={{
                      borderLeft: '3px solid',
                      borderColor: location.pathname === to ? 'primary.main' : 'transparent',
                    }}
                  >
                    <ListItemIcon><Icon /></ListItemIcon>
                    <ListItemText primary={label} />
                  </ListItemButton>
                </ListItem>
              ))}
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton onClick={() => { handleDrawerClose(); onLogout(); }}>
                  <ListItemIcon><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </>
          ) : (
            <>
              {NAV_LINKS_PUBLIC.map((link) => (
                <ListItem key={link.to} disablePadding>
                  <ListItemButton onClick={() => go(link.to)}>
                    <ListItemText primary={link.label} />
                  </ListItemButton>
                </ListItem>
              ))}
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton onClick={() => go('/login')}>
                  <ListItemText primary="Sign in" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding sx={{ px: 2, pt: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => go('/register')}
                  sx={{ textTransform: 'none' }}
                >
                  Get started
                </Button>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
    </>
  );
};

export default Navbar;