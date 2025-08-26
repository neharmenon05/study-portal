// components/ui/star-rating.tsx - Interactive star rating component
'use client';

import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showValue = false,
  className
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const StarComponent = isFilled ? StarIconSolid : StarIcon;
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={cn(
                sizeClasses[size],
                'transition-colors duration-150',
                readonly 
                  ? 'cursor-default' 
                  : 'cursor-pointer hover:scale-110 transform transition-transform',
                isFilled 
                  ? 'text-yellow-400' 
                  : 'text-gray-300 hover:text-yellow-300'
              )}
            >
              <StarComponent className="w-full h-full" />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm text-gray-600 ml-2">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Display-only star rating for showing average ratings
export function StarDisplay({ 
  rating, 
  count, 
  size = 'md',
  className 
}: {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.round(rating);
          const StarComponent = isFilled ? StarIconSolid : StarIcon;
          
          return (
            <StarComponent
              key={star}
              className={cn(
                sizeClasses[size],
                isFilled ? 'text-yellow-400' : 'text-gray-300'
              )}
            />
          );
        })}
      </div>
      
      <span className="text-sm text-gray-600">
        ({rating.toFixed(1)})
        {count !== undefined && ` • ${count} reviews`}
      </span>
    </div>
  );
}