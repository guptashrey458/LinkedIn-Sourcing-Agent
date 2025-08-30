import React from 'react';
import { Button } from '../ui/Button';
import { Download, FileText, Table, Code } from 'lucide-react';
import { useExport } from '../../hooks/useExport';

interface ExportButtonProps {
  type: 'candidates' | 'jobs' | 'pipelines' | 'messages';
  filters?: Record<string, any>;
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onExportComplete?: (downloadUrl: string) => void;
  onExportError?: (error: string) => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  type,
  filters = {},
  variant = 'button',
  size = 'md',
  className = '',
  onExportComplete,
  onExportError
}) => {
  const { openExportDialog, quickExport } = useExport({
    onExportComplete,
    onExportError
  });

  const handleQuickExport = async (format: 'csv' | 'excel' | 'json') => {
    try {
      await quickExport(type, format, filters);
    } catch (error) {
      console.error('Quick export failed:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'candidates':
        return 'Candidates';
      case 'jobs':
        return 'Jobs';
      case 'pipelines':
        return 'Pipelines';
      case 'messages':
        return 'Messages';
      default:
        return 'Data';
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block text-left ${className}`}>
        <div className="group">
          <Button
            variant="outline"
            size={size}
            icon={<Download className="w-4 h-4" />}
            className="group-hover:bg-gray-50"
          >
            Export {getTypeLabel(type)}
          </Button>
          
          <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="py-1" role="menu">
              <button
                onClick={() => openExportDialog(type, filters)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <Download className="w-4 h-4 mr-3" />
                Custom Export...
              </button>
              
              <div className="border-t border-gray-100 my-1" />
              
              <button
                onClick={() => handleQuickExport('csv')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <Table className="w-4 h-4 mr-3" />
                Quick Export CSV
              </button>
              
              <button
                onClick={() => handleQuickExport('excel')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <FileText className="w-4 h-4 mr-3" />
                Quick Export Excel
              </button>
              
              <button
                onClick={() => handleQuickExport('json')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <Code className="w-4 h-4 mr-3" />
                Quick Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      icon={<Download className="w-4 h-4" />}
      onClick={() => openExportDialog(type, filters)}
      className={className}
    >
      Export {getTypeLabel(type)}
    </Button>
  );
};