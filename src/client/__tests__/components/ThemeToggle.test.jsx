import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../../components/ThemeToggle';

// Mock the useTheme hook
const mockUseTheme = {
  isDarkMode: false,
  toggleTheme: jest.fn()
};

jest.mock('../../contexts/ThemeContext', () => ({
  ...jest.requireActual('../../contexts/ThemeContext'),
  useTheme: () => mockUseTheme
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.isDarkMode = false;
  });

  it('should render theme toggle button', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should show sun icon in light mode', () => {
    mockUseTheme.isDarkMode = false;
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', expect.stringMatching(/ciemny/i));
  });

  it('should show moon icon in dark mode', () => {
    mockUseTheme.isDarkMode = true;
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', expect.stringMatching(/jasny/i));
  });

  it('should call toggleTheme when clicked', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockUseTheme.toggleTheme).toHaveBeenCalledTimes(1);
  });

  it('should be accessible', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title');
  });

  it('should have proper styling classes', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-2');
    expect(button).toHaveClass('rounded-lg');
  });
});
