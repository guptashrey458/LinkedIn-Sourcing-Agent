import React from 'react';
import { cn } from '../../utils';

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

interface GridItemProps {
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  colStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const Grid: React.FC<GridProps> = ({ 
  children, 
  cols = 12, 
  gap = 'md', 
  className 
}) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div
      className={cn(
        'grid',
        colsClasses[cols],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

const GridItem: React.FC<GridItemProps> = ({ 
  children, 
  colSpan, 
  colStart, 
  rowSpan, 
  className 
}) => {
  const colSpanClasses = colSpan ? {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    12: 'col-span-12'
  }[colSpan] : '';

  const colStartClasses = colStart ? {
    1: 'col-start-1',
    2: 'col-start-2',
    3: 'col-start-3',
    4: 'col-start-4',
    5: 'col-start-5',
    6: 'col-start-6',
    7: 'col-start-7',
    8: 'col-start-8',
    9: 'col-start-9',
    10: 'col-start-10',
    11: 'col-start-11',
    12: 'col-start-12'
  }[colStart] : '';

  const rowSpanClasses = rowSpan ? {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
    4: 'row-span-4',
    5: 'row-span-5',
    6: 'row-span-6'
  }[rowSpan] : '';

  return (
    <div
      className={cn(
        colSpanClasses,
        colStartClasses,
        rowSpanClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

// Responsive Grid component for common layouts
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
        className
      )}
    >
      {children}
    </div>
  );
};

// Auto-fit grid that adjusts based on content
interface AutoGridProps {
  children: React.ReactNode;
  minItemWidth?: string;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AutoGrid: React.FC<AutoGridProps> = ({ 
  children, 
  minItemWidth = '250px', 
  gap = 'md',
  className 
}) => {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div
      className={cn('grid', gapClasses[gap], className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
      }}
    >
      {children}
    </div>
  );
};

export { Grid, GridItem, ResponsiveGrid, AutoGrid };
export default Grid;