import React, { forwardRef } from 'react';
import { cn } from '../../utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const baseClasses = 'block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:opacity-50';
    
    const variantClasses = {
      default: 'bg-white ring-gray-300 placeholder:text-gray-400 focus:ring-blue-600',
      filled: 'bg-gray-50 ring-gray-300 placeholder:text-gray-400 focus:ring-blue-600 focus:bg-white'
    };
    
    const errorClasses = error
      ? 'ring-red-300 focus:ring-red-500 text-red-900 placeholder:text-red-300'
      : '';
    
    const paddingClasses = cn(
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      !leftIcon && !rightIcon ? 'px-3' : ''
    );
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium leading-6 text-gray-900 mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <div className={cn('h-5 w-5', error ? 'text-red-400' : 'text-gray-400')}>
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseClasses,
              variantClasses[variant],
              errorClasses,
              paddingClasses,
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <div className={cn('h-5 w-5', error ? 'text-red-400' : 'text-gray-400')}>
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className="mt-2">
            {error && (
              <p className="text-sm text-red-600" id={`${inputId}-error`}>
                {error}
              </p>
            )}
            {helperText && !error && (
              <p className="text-sm text-gray-500" id={`${inputId}-description`}>
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;