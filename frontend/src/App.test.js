import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './components/Navbar';

test('renders the app logo in the navbar', () => {
  // We wrap the Navbar in MemoryRouter so useNavigate() works in the test
  render(
    <MemoryRouter>
      <Navbar isLoggedIn={false} onLogout={() => {}} />
    </MemoryRouter>
  );
  
  const logoElement = screen.getByText(/Video Annotator/i);
  expect(logoElement).toBeInTheDocument();
});