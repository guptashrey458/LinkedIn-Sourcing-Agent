import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useSettings } from '../../hooks/useSettings';

export interface LayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  sidebarCollapsed: controlledCollapsed,
  onSidebarToggle 
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const { preferences } = useSettings();
  
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  
  // Enable keyboard shortcuts based on user preferences
  useKeyboardShortcuts(preferences?.accessibility?.keyboardNavigation ?? true);
  
  const handleSidebarToggle = (newCollapsed: boolean) => {
    if (onSidebarToggle) {
      onSidebarToggle(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  };



  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        collapsed={collapsed} 
        onToggle={handleSidebarToggle}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;