import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

// Test component to access theme context
const TestComponent = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme">{isDarkMode ? 'dark' : 'light'}</div>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset document class
    document.documentElement.className = '';
  });

  it('should provide default light theme', () => {
    renderWithTheme(<TestComponent />);
    
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('should load dark theme from localStorage', () => {
    localStorage.setItem('darkMode', 'true');
    
    renderWithTheme(<TestComponent />);
    
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('should toggle theme and update localStorage', () => {
    renderWithTheme(<TestComponent />);
    
    // Initially light
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(localStorage.getItem('darkMode')).toBe('false');
    
    // Toggle to dark
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(localStorage.getItem('darkMode')).toBe('true');
    expect(document.documentElement).toHaveClass('dark');
    
    // Toggle back to light
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(localStorage.getItem('darkMode')).toBe('false');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('should handle invalid localStorage value', () => {
    localStorage.setItem('darkMode', 'invalid-theme');
    
    renderWithTheme(<TestComponent />);
    
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('should default to light mode regardless system preference when darkMode is unset', () => {
    // Mock matchMedia to return dark mode preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    renderWithTheme(<TestComponent />);
    
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('should throw error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});
