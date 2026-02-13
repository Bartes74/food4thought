import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, login, register, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button 
        data-testid="login-btn" 
        onClick={() => login('test@example.com', 'password')}
      >
        Login
      </button>
      <button 
        data-testid="register-btn" 
        onClick={() => register('test@example.com', 'password', 'password')}
      >
        Register
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.get.mockReset();
    axios.post.mockReset();
  });

  it('should provide initial loading state', () => {
    axios.get.mockResolvedValue({ data: { user: null } });
    
    renderWithAuth(<TestComponent />);
    
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('should authenticate user on mount if token exists', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    localStorage.setItem('token', 'mock-token');
    axios.get.mockResolvedValue({ data: { user: mockUser } });

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    expect(axios.get).toHaveBeenCalledWith('/api/auth/me');
  });

  it('should handle failed authentication on mount', async () => {
    localStorage.setItem('token', 'invalid-token');
    axios.get.mockRejectedValue(new Error('Unauthorized'));

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should handle successful login', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    const mockResponse = { data: { token: 'new-token', user: mockUser } };
    axios.get.mockResolvedValue({ data: { user: null } });
    axios.post.mockResolvedValue(mockResponse);

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password'
    });
    expect(localStorage.getItem('token')).toBe('new-token');
  });

  it('should handle failed login', async () => {
    axios.get.mockResolvedValue({ data: { user: null } });
    axios.post.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } }
    });

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should handle successful registration', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    const mockResponse = { 
      data: { 
        success: true, 
        user: mockUser, 
        message: 'Registration successful',
        verificationToken: 'verify-token'
      } 
    };
    axios.get.mockResolvedValue({ data: { user: null } });
    axios.post.mockResolvedValue(mockResponse);

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      screen.getByTestId('register-btn').click();
    });

    expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
      email: 'test@example.com',
      password: 'password',
      confirmPassword: 'password'
    });
  });

  it('should handle logout', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    localStorage.setItem('token', 'mock-token');
    axios.get.mockResolvedValue({ data: { user: mockUser } });

    renderWithAuth(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});