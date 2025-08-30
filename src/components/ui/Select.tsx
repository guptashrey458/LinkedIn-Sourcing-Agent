import React, { forwardRef } from 'react';
import { cn } from '../../utils';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'default' | 'filled';
  searchable?: boolean;
  onChange?: (value: string | number) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      variant = 'default',
      searchable = false,
      onChange,
      className,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    const baseClasses = 'block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:opacity-50';
    
    const variantClasses = {
      default: 'bg-white ring-gray-300 focus:ring-blue-600',
      filled: 'bg-gray-50 ring-gray-300 focus:ring-blue-600 focus:bg-white'
    };
    
    const errorClasses = error
      ? 'ring-red-300 focus:ring-red-500 text-red-900'
      : '';

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = e.target.value;
      const option = options.find(opt => String(opt.value) === selectedValue);
      if (onChange && option) {
        onChange(option.value);
      }
    };
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium leading-6 text-gray-900 mb-2"
          >
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={handleChange}
          className={cn(
            baseClasses,
            variantClasses[variant],
            errorClasses,
            'px-3 pr-10',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {(error || helperText) && (
          <div className="mt-2">
            {error && (
              <p className="text-sm text-red-600" id={`${selectId}-error`}>
                {error}
              </p>
            )}
            {helperText && !error && (
              <p className="text-sm text-gray-500" id={`${selectId}-description`}>
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;