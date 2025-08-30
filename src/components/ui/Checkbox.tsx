import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <label className={`flex items-start space-x-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="flex-shrink-0 pt-0.5">
        <div
          className={`
            ${sizeClasses[size]}
            border-2 rounded flex items-center justify-center transition-colors
            ${checked
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          onClick={() => !disabled && onChange(!checked)}
        >
          {checked && (
            <Check className={`${iconSizeClasses[size]} stroke-current`} />
          )}
        </div>
      </div>
      
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <div className="text-sm font-medium text-gray-900">
              {label}
            </div>
          )}
          {description && (
            <div className="text-sm text-gray-500">
              {description}
            </div>
          )}
        </div>
      )}
    </label>
  );
};