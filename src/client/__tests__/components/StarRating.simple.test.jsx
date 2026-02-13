import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StarRating from '../../components/StarRating';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock ThemeContext
const MockThemeProvider = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const renderWithTheme = (component) => {
  return render(
    <MockThemeProvider>
      {component}
    </MockThemeProvider>
  );
};

describe('StarRating Component', () => {
  const defaultProps = {
    rating: 0,
    onRatingChange: jest.fn(),
    readonly: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render star rating component', () => {
    renderWithTheme(<StarRating {...defaultProps} />);
    
    const starRating = screen.getByTestId('user-rating');
    expect(starRating).toBeInTheDocument();
  });

  it('should render 5 stars', () => {
    const { container } = renderWithTheme(<StarRating {...defaultProps} />);
    
    const stars = Array.from(container.querySelectorAll('svg'));
    expect(stars).toHaveLength(5);
  });

  it('should display correct rating with filled stars', () => {
    const { container } = renderWithTheme(<StarRating {...defaultProps} rating={3} />);
    
    const stars = Array.from(container.querySelectorAll('svg'));
    expect(stars).toHaveLength(5);
    
    // Check that stars have correct yellow color class
    const filledStars = stars.slice(0, 3);
    filledStars.forEach(star => {
      expect(star).toHaveClass('text-yellow-400');
    });
  });

  it('should call onRatingChange when star is clicked', () => {
    const mockOnRatingChange = jest.fn();
    const { container } = renderWithTheme(<StarRating {...defaultProps} onRatingChange={mockOnRatingChange} />);
    
    const thirdStar = Array.from(container.querySelectorAll('svg'))[2];
    fireEvent.click(thirdStar);
    
    expect(mockOnRatingChange).toHaveBeenCalledWith(3);
  });

  it('should not call onRatingChange when readonly', () => {
    const mockOnRatingChange = jest.fn();
    const { container } = renderWithTheme(<StarRating {...defaultProps} readonly={true} onRatingChange={mockOnRatingChange} />);
    
    // Readonly component should have testid="average-rating"
    const starRating = screen.getByTestId('average-rating');
    expect(starRating).toBeInTheDocument();
    
    const thirdStar = Array.from(container.querySelectorAll('svg'))[2];
    fireEvent.click(thirdStar);
    
    expect(mockOnRatingChange).not.toHaveBeenCalled();
  });

  it('should show rating text for interactive rating', () => {
    renderWithTheme(<StarRating {...defaultProps} rating={4} />);
    
    // Non-readonly should show rating text
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('should show "Oceń" text when rating is 0', () => {
    renderWithTheme(<StarRating {...defaultProps} rating={0} />);
    
    expect(screen.getByText('Oceń')).toBeInTheDocument();
  });

  it('should support different sizes', () => {
    const { container } = renderWithTheme(<StarRating {...defaultProps} size="lg" />);
    
    const stars = Array.from(container.querySelectorAll('svg'));
    stars.forEach(star => {
      expect(star).toHaveClass('w-6', 'h-6');
    });
  });

  it('should support half stars when enabled', () => {
    renderWithTheme(<StarRating {...defaultProps} rating={3.5} showHalfStars={true} />);
    
    // Should show rating as 3.5
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('should not show rating text in readonly mode', () => {
    renderWithTheme(<StarRating {...defaultProps} rating={4} readonly={true} />);
    
    // Readonly mode should not show rating text
    expect(screen.queryByText('4')).not.toBeInTheDocument();
    expect(screen.queryByText('Oceń')).not.toBeInTheDocument();
  });
});
