import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  className, 
  showHome = true 
}) => {
  const allItems = showHome 
    ? [{ label: 'Home', href: '/dashboard', icon: Home }, ...items]
    : items;

  return (
    <nav 
      className={cn('flex items-center space-x-2 text-sm', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const ItemIcon = item.icon;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              )}
              
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {ItemIcon && (
                    <ItemIcon className="w-4 h-4 mr-1" />
                  )}
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center',
                    isLast 
                      ? 'text-gray-900 font-medium' 
                      : 'text-gray-600'
                  )}
                >
                  {ItemIcon && (
                    <ItemIcon className="w-4 h-4 mr-1" />
                  )}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;