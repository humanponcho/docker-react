import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Hello, Vite! heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Hello, Vite!/i);
  expect(headingElement).toBeInTheDocument();
});