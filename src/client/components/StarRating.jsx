import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  readonly = false, 
  size = 'md',
  showHalfStars = false,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };
  
  const handleStarClick = (starValue) => {
    if (readonly || !onRatingChange) return;
    onRatingChange(starValue);
  };
  
  const handleHalfStarClick = (starValue) => {
    if (readonly || !onRatingChange || !showHalfStars) return;
    onRatingChange(starValue);
  };
  
  const renderStar = (index) => {
    const starValue = index + 1;
    const halfStarValue = index + 0.5;
    const isFilled = rating >= starValue;
    const isHalfFilled = showHalfStars && rating >= halfStarValue && rating < starValue;
    
    const starColor = isFilled || isHalfFilled ? 'text-yellow-400' : 'text-gray-300';
    const hoverColor = readonly ? '' : 'hover:text-yellow-400 cursor-pointer';
    
    return (
      <div key={index} className="relative inline-block">
        {/* Pełna gwiazdka */}
        <svg
          className={`${sizeClasses[size]} ${starColor} ${hoverColor} transition-colors ${className}`}
          fill={isFilled ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          onClick={() => handleStarClick(starValue)}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        
        {/* Połówka gwiazdki */}
        {showHalfStars && isHalfFilled && (
          <svg
            className={`${sizeClasses[size]} text-yellow-400 absolute top-0 left-0 transition-colors ${className}`}
            fill="currentColor"
            stroke="currentColor"
            viewBox="0 0 24 24"
            onClick={() => handleHalfStarClick(halfStarValue)}
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex items-center space-x-1" data-testid={readonly ? "average-rating" : "user-rating"}>
      {[0, 1, 2, 3, 4].map(renderStar)}
      {!readonly && (
        <span className={`text-xs ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {rating > 0 ? rating.toFixed(showHalfStars ? 1 : 0) : 'Oceń'}
        </span>
      )}
    </div>
  );
};

export default StarRating; 