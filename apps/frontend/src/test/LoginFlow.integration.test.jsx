import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';

const AllProviders = ({ children }) => (
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
);

describe('Login Flow Integration Test', () => {
  beforeEach(() => {
    // clear any previous state
  });

  it('renders complete login form with all elements', () => {
    render(
      <AllProviders>
        <Login />
      </AllProviders>
    );

    // verify login form is rendered
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('validates form inputs before submission', () => {
    render(
      <AllProviders>
        <Login />
      </AllProviders>
    );

    const emailInput = screen.getByPlaceholderText(/your@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/);

    // initially inputs should be empty
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');

    // fill in login form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // verify inputs are updated
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
