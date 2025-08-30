import React, { useState, useMemo, memo, useCallback } from 'react';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';
import { cn } from '../../utils';
import Button from './Button';
import Input from './Input';
import Skeleton from './Skeleton';

export interface Column<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
    onChange?: (page: number, pageSize: number) => void;
  };
  sorting?: {
    field?: string;
    direction?: 'asc' | 'desc';
    onChange?: (field: string, direction: 'asc' | 'desc') => void;
  };
  filtering?: {
    filters?: Record<string, any>;
    onChange?: (filters: Record<string, any>) => void;
  };
  selection?: {
    selectedRowKeys?: React.Key[];
    onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean };
  };
  rowKey?: keyof T | ((record: T) => React.Key);
  onRow?: (record: T, index: number) => {
    onClick?: () => void;
    onDoubleClick?: () => void;
    className?: string;
  };
  emptyText?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DataTable = memo(<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  filtering,
  selection,
  rowKey = 'id',
  onRow,
  emptyText = 'No data available',
  className,
  size = 'md',
}: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localFilters] = useState<Record<string, any>>({});
  const [localSorting, setLocalSorting] = useState<{
    field?: string;
    direction?: 'asc' | 'desc';
  }>({
    field: sorting?.field,
    direction: sorting?.direction,
  });

  // Get row key function
  const getRowKey = (record: T, index: number): React.Key => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index;
  };

  // Handle sorting
  const handleSort = useCallback((field: string) => {
    const newDirection = 
      localSorting.field === field && localSorting.direction === 'asc' 
        ? 'desc' 
        : 'asc';
    
    setLocalSorting({ field, direction: newDirection });
    sorting?.onChange?.(field, newDirection);
  }, [localSorting.field, localSorting.direction, sorting]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        Object.values(record).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(record =>
          String(record[key]).toLowerCase().includes(String(value).toLowerCase())
        );
      }
    });

    // Apply sorting
    if (localSorting.field) {
      filtered.sort((a, b) => {
        const aVal = a[localSorting.field!];
        const bVal = b[localSorting.field!];
        
        if (aVal < bVal) {
          return localSorting.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return localSorting.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, localFilters, localSorting]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return processedData.slice(start, end);
  }, [processedData, pagination]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const cellPadding = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4'
  };

  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
        <div className="p-4">
          <Skeleton height="2rem" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, colIndex) => (
                  <Skeleton key={colIndex} height="1.5rem" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          
          {filtering && (
            <Button
              variant="outline"
              icon={<Filter className="h-4 w-4" />}
              onClick={() => {
                // Toggle filter panel or open filter modal
              }}
            >
              Filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selection && (
                <th className={cn('text-left font-medium text-gray-900', cellPadding[size])}>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allKeys = paginatedData.map((record, index) => getRowKey(record, index));
                        selection.onChange?.(allKeys, paginatedData);
                      } else {
                        selection.onChange?.([], []);
                      }
                    }}
                    checked={
                      selection.selectedRowKeys?.length === paginatedData.length &&
                      paginatedData.length > 0
                    }
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = 
                          (selection.selectedRowKeys?.length || 0) > 0 &&
                          (selection.selectedRowKeys?.length || 0) < paginatedData.length;
                      }
                    }}
                  />
                </th>
              )}
              
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'font-medium text-gray-900',
                    cellPadding[size],
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer hover:bg-gray-100'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={cn(
                            'h-3 w-3',
                            localSorting.field === column.key && localSorting.direction === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 -mt-1',
                            localSorting.field === column.key && localSorting.direction === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selection ? 1 : 0)}
                  className={cn('text-center text-gray-500', cellPadding[size])}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              paginatedData.map((record, index) => {
                const key = getRowKey(record, index);
                const rowProps = onRow?.(record, index) || {};
                const isSelected = selection?.selectedRowKeys?.includes(key);
                
                return (
                  <tr
                    key={key}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      isSelected && 'bg-blue-50',
                      rowProps.className
                    )}
                    onClick={rowProps.onClick}
                    onDoubleClick={rowProps.onDoubleClick}
                  >
                    {selection && (
                      <td className={cellPadding[size]}>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentSelected = selection.selectedRowKeys || [];
                            let newSelected: React.Key[];
                            
                            if (e.target.checked) {
                              newSelected = [...currentSelected, key];
                            } else {
                              newSelected = currentSelected.filter(k => k !== key);
                            }
                            
                            const selectedRecords = paginatedData.filter((_, idx) =>
                              newSelected.includes(getRowKey(paginatedData[idx], idx))
                            );
                            
                            selection.onChange?.(newSelected, selectedRecords);
                          }}
                          {...selection.getCheckboxProps?.(record)}
                        />
                      </td>
                    )}
                    
                    {columns.map((column) => {
                      const value = column.dataIndex ? record[column.dataIndex] : record[column.key];
                      const cellContent = column.render
                        ? column.render(value, record, index)
                        : value;
                      
                      return (
                        <td
                          key={column.key}
                          className={cn(
                            'text-gray-900',
                            cellPadding[size],
                            sizeClasses[size],
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            
            <div className="flex items-center gap-2">
              {pagination.showSizeChanger && (
                <select
                  value={pagination.pageSize}
                  onChange={(e) => pagination.onChange?.(1, Number(e.target.value))}
                  className="rounded border-gray-300 text-sm"
                >
                  {(pagination.pageSizeOptions || [10, 20, 50, 100]).map(size => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </select>
              )}
              
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current <= 1}
                onClick={() => pagination.onChange?.(pagination.current - 1, pagination.pageSize)}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-700">
                Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => pagination.onChange?.(pagination.current + 1, pagination.pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}) as <T extends Record<string, any>>(props: DataTableProps<T>) => React.ReactElement;

(DataTable as any).displayName = 'DataTable';

export default DataTable;