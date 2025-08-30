import React from 'react';
import { Button, Card } from '../ui';
import { QuickAction } from '../../types';

interface QuickActionsProps {
  actions: QuickAction[];
  loading?: boolean;
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  loading = false,
  className,
}) => {
  if (loading) {
    return (
      <Card title="Quick Actions" className={className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Quick Actions" className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'outline'}
            size="md"
            disabled={action.disabled}
            onClick={action.action}
            icon={action.icon}
            className="justify-start h-auto p-4 text-left"
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{action.title}</span>
              <span className="text-xs text-gray-500 mt-1">{action.description}</span>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;