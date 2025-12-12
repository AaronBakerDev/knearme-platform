/**
 * StarRating component for displaying business ratings.
 *
 * Renders filled, half, and empty stars based on rating value.
 * Supports multiple sizes and displays review count.
 *
 * @see /src/types/directory.ts for DirectoryPlace type
 */

import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  /** Rating value (0-5). Null shows no rating. */
  rating: number | null;
  /** Number of reviews. Null hides count. */
  count: number | null;
  /** Visual size of the stars */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'size-3',
  md: 'size-4',
  lg: 'size-5',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Displays a 5-star rating with filled/half/empty stars.
 *
 * @example
 * <StarRating rating={4.5} count={123} size="md" />
 * // Output: ★★★★☆ 4.5 (123 reviews)
 */
export function StarRating({
  rating,
  count,
  size = 'md',
  className,
}: StarRatingProps) {
  // No rating provided
  if (rating === null) {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <span className={textSizeClasses[size]}>No reviews yet</span>
      </div>
    );
  }

  // Generate star display
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Filled stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star
        key={`full-${i}`}
        className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
      />
    );
  }

  // Half star
  if (hasHalfStar) {
    stars.push(
      <StarHalf
        key="half"
        className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
      />
    );
  }

  // Empty stars
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Star
        key={`empty-${i}`}
        className={cn(sizeClasses[size], 'text-gray-300 dark:text-gray-600')}
      />
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {stars}
      </div>
      <span className={cn('font-medium', textSizeClasses[size])}>
        {rating.toFixed(1)}
      </span>
      {count !== null && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          ({count.toLocaleString()} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
