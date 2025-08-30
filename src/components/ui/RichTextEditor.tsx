import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Eye,
  Edit3
} from 'lucide-react';
import { cn } from '../../utils';
import Button from './Button';

export interface RichTextEditorProps {
  label?: string;
  error?: string;
  helperText?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  error,
  helperText,
  value,
  onChange,
  placeholder = 'Enter job description...',
  minHeight = '200px',
  maxHeight = '400px',
  disabled = false,
  className,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  useEffect(() => {
    if (editorRef.current && !isPreview) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isPreview]);
  
  const execCommand = (command: string, value?: string) => {
    if (disabled) return;
    document.execCommand(command, false, value);
    handleContentChange();
  };
  
  const handleContentChange = () => {
    if (editorRef.current && !disabled) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  };
  
  const formatButtons = [
    { command: 'bold', icon: Bold, title: 'Bold (Ctrl+B)' },
    { command: 'italic', icon: Italic, title: 'Italic (Ctrl+I)' },
    { command: 'underline', icon: Underline, title: 'Underline (Ctrl+U)' },
    { command: 'insertUnorderedList', icon: List, title: 'Bullet List' },
    { command: 'insertOrderedList', icon: ListOrdered, title: 'Numbered List' },
    { command: 'justifyLeft', icon: AlignLeft, title: 'Align Left' },
    { command: 'justifyCenter', icon: AlignCenter, title: 'Align Center' },
    { command: 'justifyRight', icon: AlignRight, title: 'Align Right' },
  ];
  
  const handleLinkInsert = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };
  
  const convertToPlainText = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };
  
  const formatPreviewText = (html: string): string => {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<div>/gi, '')
      .replace(/<strong>/gi, '**')
      .replace(/<\/strong>/gi, '**')
      .replace(/<b>/gi, '**')
      .replace(/<\/b>/gi, '**')
      .replace(/<em>/gi, '*')
      .replace(/<\/em>/gi, '*')
      .replace(/<i>/gi, '*')
      .replace(/<\/i>/gi, '*')
      .replace(/<u>/gi, '_')
      .replace(/<\/u>/gi, '_')
      .replace(/<ul>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '');
  };
  
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
          {label}
        </label>
      )}
      
      <div
        className={cn(
          'border rounded-md overflow-hidden',
          error ? 'border-red-300' : 'border-gray-300',
          isFocused && !error && 'ring-2 ring-blue-600 border-blue-600',
          disabled && 'opacity-50 bg-gray-50'
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
          {formatButtons.map(({ command, icon: Icon, title }) => (
            <Button
              key={command}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand(command)}
              disabled={disabled || isPreview}
              title={title}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLinkInsert}
            disabled={disabled || isPreview}
            title="Insert Link"
            className="h-8 w-8 p-0"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <Button
            type="button"
            variant={isPreview ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            disabled={disabled}
            title={isPreview ? 'Edit Mode' : 'Preview Mode'}
            className="h-8 px-2"
          >
            {isPreview ? (
              <>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </>
            )}
          </Button>
        </div>
        
        {/* Editor/Preview Area */}
        <div
          style={{ minHeight, maxHeight }}
          className="overflow-y-auto"
        >
          {isPreview ? (
            <div className="p-3 whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">
              {value ? formatPreviewText(value) : 'No content to preview'}
            </div>
          ) : (
            <div
              ref={editorRef}
              contentEditable={!disabled}
              onInput={handleContentChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              className={cn(
                'p-3 text-sm text-gray-900 leading-relaxed outline-none',
                'prose prose-sm max-w-none',
                '[&_ul]:list-disc [&_ul]:ml-6',
                '[&_ol]:list-decimal [&_ol]:ml-6',
                '[&_li]:mb-1',
                '[&_p]:mb-2',
                '[&_strong]:font-semibold',
                '[&_em]:italic',
                '[&_u]:underline',
                '[&_a]:text-blue-600 [&_a]:underline',
                disabled && 'cursor-not-allowed'
              )}
              style={{ minHeight: `calc(${minHeight} - 2rem)` }}
              suppressContentEditableWarning={true}
            >
              {!value && (
                <div className="text-gray-400 pointer-events-none">
                  {placeholder}
                </div>
              )}
            </div>
          )}
        </div>
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
    </div>
  );
};

export default RichTextEditor;