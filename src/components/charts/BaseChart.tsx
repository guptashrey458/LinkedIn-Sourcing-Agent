import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '../../utils';
import Loading from '../ui/Loading';

export interface BaseChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

const BaseChart: React.FC<BaseChartProps> = ({
  data,
  loading = false,
  error,
  height = 300,
  className,
  children,
  ...props
}) => {
  if (loading) {
    return (
      <div 
        className={cn('flex items-center justify-center bg-gray-50 rounded-lg', className)}
        style={{ height }}
      >
        <Loading size="lg" text="Loading chart..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className={cn('flex items-center justify-center bg-red-50 rounded-lg border border-red-200', className)}
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading chart</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div 
        className={cn('flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200', className)}
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-gray-500 font-medium">No data available</p>
          <p className="text-gray-400 text-sm mt-1">Chart will appear when data is loaded</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('w-full', className)} style={{ height }} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
};

export default BaseChart;