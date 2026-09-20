import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VideoDetail from './pages/VideoDetail';
import Landing from './pages/Landing';
import { authService } from './services/auth';

const darkBlueTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0A1929',
      paper: '#132F4C',
    },
    text: {
      primary: '#ffffff',
      secondary: '#B2BAC2',
    },
    primary: {
      main: '#3399FF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function Navbar({ isLoggedIn, onLogout }) {
  const navigate = useNavigate();
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
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to={isLoggedIn ? '/dashboard' : '/'}
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 700,
          }}
        >
          🎬 Video Annotator
        </Typography>
        {isLoggedIn ? (
          <>
            <Button color="inherit" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={onLogout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button
              color="primary"
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{ ml: 1, textTransform: 'none' }}
            >
              Get started
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(authService.isLoggedIn());

  useEffect(() => {
    setIsLoggedIn(authService.isLoggedIn());
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <ThemeProvider theme={darkBlueTheme}>
      <CssBaseline />
      <Router>
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <Routes>
          {/* Public landing page */}
          <Route
            path="/"
            element={isLoggedIn ? <Navigate to="/dashboard" /> : <Landing />}
          />

          {/* Auth pages */}
          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={() => setIsLoggedIn(true)} />}
          />
          <Route
            path="/register"
            element={isLoggedIn ? <Navigate to="/dashboard" /> : <Register />}
          />

          {/* Protected app pages */}
          <Route
            path="/dashboard"
            element={isLoggedIn ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/videos/:id"
            element={isLoggedIn ? <VideoDetail /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;