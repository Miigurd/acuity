import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navigation links', () => {
  render(<App />);
  const linkElements = screen.getAllByText(/City of Cabuyao/i);
  expect(linkElements.length).toBeGreaterThan(0);
});



