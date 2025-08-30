import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Trash2
} from 'lucide-react';
import type { ExtendedNotification } from '../../services/notificationService';
import notificationService from '../../services/notificationService';
import Button from './Button';
import Badge from './Badge';
import Card from './Card';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = ''
}) => {
  const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Subscribe to notification changes
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });
    
    // Initialize with current notifications
    setNotifications(notificationService.getAll());
    setUnreadCount(notificationService.getUnread().length);
    
    return unsubscribe;
  }, []);
  
  // Handle notification click
  const handleNotificationClick = (notification: ExtendedNotification) => {
    // Mark as read
    notificationService.markAsRead(notification.id);
    
    // Call onClick handler if provided
    if (notification.onClick) {
      notification.onClick();
    }
  };
  
  // Handle notification removal
  const handleRemoveNotification = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    notificationService.remove(id);
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };
  
  // Handle clear all
  const handleClearAll = () => {
    notificationService.clear();
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        icon={<Bell className="w-5 h-5" />}
      >
        {unreadCount > 0 && (
          <Badge
            variant="error"
            size="sm"
            className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 z-50 shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="info" size="sm">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                {notifications.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      icon={<CheckCircle className="w-4 h-4" />}
                      title="Mark all as read"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      icon={<Trash2 className="w-4 h-4" />}
                      title="Clear all"
                    />
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  icon={<X className="w-4 h-4" />}
                />
              </div>
            </div>
            
            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onRemove={(e) => handleRemoveNotification(notification.id, e)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

interface NotificationItemProps {
  notification: ExtendedNotification;
  onClick: () => void;
  onRemove: (event: React.MouseEvent) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onRemove
}) => {
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
  
  return (
    <div
      className={`
        p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800
        ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {notification.message}
              </p>
              
              {/* Actions */}
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  {notification.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.style === 'primary' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.action();
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Remove button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              icon={<X className="w-4 h-4" />}
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          
          {/* Timestamp */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {formatDistanceToNow(new Date(notification.timestamp))} ago
          </p>
          
          {/* Unread indicator */}
          {!notification.read && (
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;