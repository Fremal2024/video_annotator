import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VideoDetail from './pages/VideoDetail';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Referral from './pages/Referral';
import { authService } from './services/auth';

const darkBlueTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0A1929', paper: '#132F4C' },
    text: { primary: '#ffffff', secondary: '#B2BAC2' },
    primary: { main: '#3399FF' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 10 },
});

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
          {/* Public */}
          <Route
            path="/"
            element={isLoggedIn ? <Navigate to="/dashboard" /> : <Landing />}
          />
          <Route path="/pricing" element={<Pricing />} />

          {/* Auth */}
          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={() => setIsLoggedIn(true)} />}
          />
          <Route
            path="/register"
            element={isLoggedIn ? <Navigate to="/dashboard" /> : <Register />}
          />

          {/* Protected */}
          <Route path="/dashboard" element={isLoggedIn ? <Home /> : <Navigate to="/login" />} />
          <Route path="/videos/:id" element={isLoggedIn ? <VideoDetail /> : <Navigate to="/login" />} />
          <Route path="/profile"   element={isLoggedIn ? <Profile />   : <Navigate to="/login" />} />
          <Route path="/settings"  element={isLoggedIn ? <Settings />  : <Navigate to="/login" />} />
          <Route path="/referral"  element={isLoggedIn ? <Referral />  : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;