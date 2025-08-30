import React from 'react';
import { cn } from '../../utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
  animation = 'pulse',
  ...props
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Could be enhanced with a wave animation
    none: ''
  };
  
  const getDefaultDimensions = () => {
    switch (variant) {
      case 'circular':
        return { width: '2rem', height: '2rem' };
      case 'rectangular':
        return { width: '100%', height: '1rem' };
      default:
        return { width: '100%', height: '1rem' };
    }
  };
  
  const defaultDimensions = getDefaultDimensions();
  
  const style = {
    width: width || defaultDimensions.width,
    height: height || defaultDimensions.height,
  };
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              animationClasses[animation]
            )}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width, // Last line is shorter
            }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      {...props}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-4 border border-gray-200 rounded-lg', className)}>
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton variant="circular" width="3rem" height="3rem" />
      <div className="flex-1">
        <Skeleton width="60%" height="1rem" className="mb-2" />
        <Skeleton width="40%" height="0.75rem" />
      </div>
    </div>
    <Skeleton lines={3} className="mb-4" />
    <div className="flex space-x-2">
      <Skeleton width="5rem" height="2rem" variant="rectangular" />
      <Skeleton width="5rem" height="2rem" variant="rectangular" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string 
}> = ({ 
  rows = 5, 
  columns = 4, 
  className 
}) => (
  <div className={cn('space-y-4', className)}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={`header-${index}`} height="1.5rem" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div 
        key={`row-${rowIndex}`} 
        className="grid gap-4" 
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="1rem" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ 
  items?: number; 
  className?: string 
}> = ({ 
  items = 5, 
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
        <div className="flex-1">
          <Skeleton width="70%" height="1rem" className="mb-1" />
          <Skeleton width="50%" height="0.75rem" />
        </div>
        <Skeleton width="4rem" height="1.5rem" variant="rectangular" />
      </div>
    ))}
  </div>
);

export default Skeleton;