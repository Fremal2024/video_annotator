import React, { useState } from 'react';
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
  Menu as MenuIcon,
} from '@mui/icons-material';
import { authService } from '../services/auth';

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
  const open = Boolean(anchorEl);

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const go = (path) => {
    handleClose();
    if (path.startsWith('/#')) {
      navigate('/');
      // Let the browser scroll after render
      setTimeout(() => {
        const id = path.replace('/#', '');
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
        backdropFilter: 'blur(8px)',
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        {/* Logo */}
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

        {/* Center nav links */}
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

        {/* Right side */}
        {isLoggedIn ? (
          <>
            <IconButton onClick={handleAvatarClick} size="small">
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {authService.getToken() ? 'U' : '?'}
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
                Refer & earn
              </MenuItem>
              <MenuItem onClick={() => go('/pricing')}>
                <ListItemIcon><PricingIcon fontSize="small" /></ListItemIcon>
                Plans & pricing
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
            <Button
              onClick={() => navigate('/login')}
              sx={{ textTransform: 'none' }}
            >
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