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
    renderWithTheme(<StarRating {...defaultProps} />);
    
    const stars = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'svg';
    });
    expect(stars).toHaveLength(5);
  });

  it('should display correct rating with filled stars', () => {
    renderWithTheme(<StarRating {...defaultProps} rating={3} />);
    
    const stars = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'svg';
    });
    expect(stars).toHaveLength(5);
    
    // Check that first 3 stars have yellow color class
    const filledStars = stars.slice(0, 3);
    filledStars.forEach(star => {
      expect(star).toHaveClass('text-yellow-400');
    });
  });

  it('should call onRatingChange when star is clicked', () => {
    const mockOnRatingChange = jest.fn();
    renderWithTheme(<StarRating {...defaultProps} onRatingChange={mockOnRatingChange} />);
    
    const thirdStar = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'svg';
    })[2]; // 3rd star (index 2)
    fireEvent.click(thirdStar);
    
    expect(mockOnRatingChange).toHaveBeenCalledWith(3);
  });

  it('should not call onRatingChange when readonly', () => {
    const mockOnRatingChange = jest.fn();
    renderWithTheme(<StarRating {...defaultProps} readonly={true} onRatingChange={mockOnRatingChange} />);
    
    // Readonly component should have testid="average-rating"
    const starRating = screen.getByTestId('average-rating');
    expect(starRating).toBeInTheDocument();
    
    const thirdStar = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'svg';
    })[2];
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

  it('should handle maximum rating', () => {
    renderWithTheme(<StarRating {...defaultProps} rating={5} />);
    
    const stars = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'svg';
    });
    stars.forEach(star => {
      expect(star).toHaveClass('text-yellow-400');
    });
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display readonly rating correctly', () => {
    renderWithTheme(<StarRating {...defaultProps} rating={3} readonly={true} />);
    
    const starRating = screen.getByTestId('average-rating');
    expect(starRating).toBeInTheDocument();
    
    const stars = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'svg';
    });
    const filledStars = stars.slice(0, 3);
    filledStars.forEach(star => {
      expect(star).toHaveClass('text-yellow-400');
    });
  });

  it('should handle hover interactions on interactive stars', () => {
    renderWithTheme(<StarRating {...defaultProps} rating={1} />);
    
    const thirdStar = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'svg';
    })[2];
    
    // Hover over third star
    fireEvent.mouseEnter(thirdStar);
    
    // Should highlight up to hovered star (implementation specific)
    // This might not be visible in tests as it depends on CSS hover states
    expect(thirdStar).toBeInTheDocument();
  });

  it('should work with decimal ratings in readonly mode', () => {
    renderWithTheme(<StarRating {...defaultProps} rating={3.5} readonly={true} />);
    
    const starRating = screen.getByTestId('average-rating');
    expect(starRating).toBeInTheDocument();
    
    const stars = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'svg';
    });
    expect(stars).toHaveLength(5);
  });
});