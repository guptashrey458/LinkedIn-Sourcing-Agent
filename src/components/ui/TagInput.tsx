import React, { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';
import Tag from './Tag';

export interface TagInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
  allowDuplicates?: boolean;
  className?: string;
  disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
  label,
  error,
  helperText,
  value = [],
  onChange,
  placeholder = 'Type and press Enter to add tags...',
  suggestions = [],
  maxTags,
  allowDuplicates = false,
  className,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      (allowDuplicates || !value.includes(suggestion))
  );
  
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    
    if (maxTags && value.length >= maxTags) return;
    if (!allowDuplicates && value.includes(trimmedTag)) return;
    
    onChange([...value, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
  };
  
  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };
  
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div
          className={cn(
            'min-h-[42px] w-full rounded-md border-0 py-1.5 px-3 shadow-sm ring-1 ring-inset focus-within:ring-2 focus-within:ring-inset sm:text-sm sm:leading-6',
            error
              ? 'ring-red-300 focus-within:ring-red-500'
              : 'ring-gray-300 focus-within:ring-blue-600',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
          )}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {value.map((tag, index) => (
              <Tag
                key={index}
                size="sm"
                variant="filled"
                color="blue"
                removable={!disabled}
                onRemove={() => removeTag(index)}
                className="flex-shrink-0"
              >
                {tag}
              </Tag>
            ))}
            
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? placeholder : ''}
              disabled={disabled || Boolean(maxTags && value.length >= maxTags)}
              className="flex-1 min-w-[120px] border-0 bg-transparent p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 outline-none"
            />
          </div>
        </div>
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-600 hover:text-white"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="mt-2">
          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="text-sm text-gray-500">
              {helperText}
            </p>
          )}
        </div>
      )}
      
      {maxTags && (
        <div className="mt-1 text-xs text-gray-500">
          {value.length}/{maxTags} tags
        </div>
      )}
    </div>
  );
};

export default TagInput;