import React, { forwardRef } from 'react';
import { cn } from '../../utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      resize = 'vertical',
      className,
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    const baseClasses = 'block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:opacity-50';
    
    const variantClasses = {
      default: 'bg-white ring-gray-300 placeholder:text-gray-400 focus:ring-blue-600',
      filled: 'bg-gray-50 ring-gray-300 placeholder:text-gray-400 focus:ring-blue-600 focus:bg-white'
    };
    
    const errorClasses = error
      ? 'ring-red-300 focus:ring-red-500 text-red-900 placeholder:text-red-300'
      : '';
    
    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium leading-6 text-gray-900 mb-2"
          >
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            baseClasses,
            variantClasses[variant],
            errorClasses,
            resizeClasses[resize],
            'px-3',
            className
          )}
          {...props}
        />
        
        {(error || helperText) && (
          <div className="mt-2">
            {error && (
              <p className="text-sm text-red-600" id={`${textareaId}-error`}>
                {error}
              </p>
            )}
            {helperText && !error && (
              <p className="text-sm text-gray-500" id={`${textareaId}-description`}>
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;