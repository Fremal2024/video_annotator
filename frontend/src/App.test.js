import { render, screen } from '@testing-library/react';
import Navbar from './components/Navbar';

test('renders the app logo in the navbar', () => {
  render(<Navbar isLoggedIn={false} onLogout={() => {}} />);
  const logoElement = screen.getByText(/Video Annotator/i);
  expect(logoElement).toBeInTheDocument();
});