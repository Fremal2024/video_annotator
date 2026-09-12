import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { authService } from './services/auth';
import VideoDetail from './pages/VideoDetail';

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
});

function Navbar({ isLoggedIn, onLogout }) {
  const navigate = useNavigate();
  return (
    <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'background.paper' }}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 600 }}
        >
          🎬 Video Annotator
        </Typography>
        {isLoggedIn ? (
          <Button color="inherit" onClick={onLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
            <Button color="inherit" onClick={() => navigate('/register')}>Register</Button>
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
    window.location.href = '/login';
  };

  return (
    <ThemeProvider theme={darkBlueTheme}>
      <CssBaseline />
      <Router>
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <Routes>
          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/" /> : <Login onLogin={() => setIsLoggedIn(true)} />}
          />
          <Route
            path="/register"
            element={isLoggedIn ? <Navigate to="/" /> : <Register />}
          />
          <Route
            path="/"
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