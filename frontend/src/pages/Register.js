import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import {
  Container, Box, TextField, Button, Typography, Paper, Alert, Link as MuiLink,
} from '@mui/material';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.register(username, email, password);
      await authService.login(username, password);
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 10 }}>
        <Paper elevation={4} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Join Video Annotator
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Username" margin="normal"
              value={username} onChange={(e) => setUsername(e.target.value)} required
            />
            <TextField
              fullWidth label="Email" type="email" margin="normal"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              fullWidth label="Password" type="password" margin="normal"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required inputProps={{ minLength: 6 }}
            />
            <Button
              type="submit" fullWidth variant="contained" size="large"
              sx={{ mt: 3 }} disabled={loading}
            >
              {loading ? 'Creating...' : 'Register'}
            </Button>
          </form>
          <Typography align="center" sx={{ mt: 3 }}>
            Already have an account?{' '}
            <MuiLink component={Link} to="/login">Sign In</MuiLink>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;