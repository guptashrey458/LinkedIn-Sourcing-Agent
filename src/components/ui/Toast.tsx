import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import type { ExtendedNotification } from '../../services/notificationService';
import notificationService from '../../services/notificationService';
import Button from './Button';

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
  className?: string;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  maxToasts = 3,
  className = ''
}) => {
  const [toasts, setToasts] = useState<ExtendedNotification[]>([]);
  
  // Subscribe to notifications and show only recent ones as toasts
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifications) => {
      // Show only the most recent notifications as toasts
      const recentToasts = notifications
        .filter(n => {
          // Show toasts for notifications created in the last 10 seconds
          const tenSecondsAgo = new Date(Date.now() - 10000);
          return new Date(n.timestamp) > tenSecondsAgo;
        })
        .slice(0, maxToasts);
      
      setToasts(recentToasts);
    });
    
    return unsubscribe;
  }, [maxToasts]);
  
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };
  
  if (toasts.length === 0) return null;
  
  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      <div className="space-y-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            notification={toast}
            onClose={() => notificationService.remove(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface ToastItemProps {
  notification: ExtendedNotification;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Animation effect
  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };
  
  const getIcon = (type: ExtendedNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };
  
  const getBorderColor = (type: ExtendedNotification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };
  
  return (
    <div
      className={`
        w-96 max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
        rounded-lg shadow-lg border-l-4 ${getBorderColor(notification.type)}
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {notification.message}
            </p>
            
            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex items-center space-x-2 mt-3">
                {notification.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.style === 'primary' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      action.action();
                      handleClose();
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            icon={<X className="w-4 h-4" />}
            className="flex-shrink-0"
          />
        </div>
      </div>
    </div>
  );
};

// Toast utility functions
export const Toast = {
  success: (message: string, options?: { duration?: number }) => {
    notificationService.addNotification({
      type: 'success',
      title: 'Success',
      message,
      duration: options?.duration || 3000,
    });
  },
  
  error: (message: string, options?: { duration?: number }) => {
    notificationService.addNotification({
      type: 'error',
      title: 'Error',
      message,
      duration: options?.duration || 5000,
    });
  },
  
  warning: (message: string, options?: { duration?: number }) => {
    notificationService.addNotification({
      type: 'warning',
      title: 'Warning',
      message,
      duration: options?.duration || 4000,
    });
  },
  
  info: (message: string, options?: { duration?: number }) => {
    notificationService.addNotification({
      type: 'info',
      title: 'Info',
      message,
      duration: options?.duration || 3000,
    });
  },
};

export { ToastContainer };
export default ToastContainer;