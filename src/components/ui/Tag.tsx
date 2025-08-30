import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';

export interface TagProps {
  variant?: 'default' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  children: React.ReactNode;
}

const Tag: React.FC<TagProps> = ({
  variant = 'default',
  size = 'md',
  color = 'gray',
  removable = false,
  onRemove,
  className,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center gap-1 font-medium rounded-md transition-colors';
  
  const variantClasses = {
    default: {
      gray: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      green: 'bg-green-100 text-green-700 hover:bg-green-200',
      yellow: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      red: 'bg-red-100 text-red-700 hover:bg-red-200',
      purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      pink: 'bg-pink-100 text-pink-700 hover:bg-pink-200'
    },
    outline: {
      gray: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
      blue: 'border border-blue-300 text-blue-700 hover:bg-blue-50',
      green: 'border border-green-300 text-green-700 hover:bg-green-50',
      yellow: 'border border-yellow-300 text-yellow-700 hover:bg-yellow-50',
      red: 'border border-red-300 text-red-700 hover:bg-red-50',
      purple: 'border border-purple-300 text-purple-700 hover:bg-purple-50',
      pink: 'border border-pink-300 text-pink-700 hover:bg-pink-50'
    },
    filled: {
      gray: 'bg-gray-600 text-white hover:bg-gray-700',
      blue: 'bg-blue-600 text-white hover:bg-blue-700',
      green: 'bg-green-600 text-white hover:bg-green-700',
      yellow: 'bg-yellow-600 text-white hover:bg-yellow-700',
      red: 'bg-red-600 text-white hover:bg-red-700',
      purple: 'bg-purple-600 text-white hover:bg-purple-700',
      pink: 'bg-pink-600 text-white hover:bg-pink-700'
    }
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  const removeButtonClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant][color],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'ml-1 rounded-full hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current',
            removeButtonClasses[size]
          )}
        >
          <X className="h-full w-full" />
        </button>
      )}
    </span>
  );
};

export default Tag;