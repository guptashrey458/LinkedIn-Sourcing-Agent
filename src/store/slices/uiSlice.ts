import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, Notification } from '../../types';

// Extended UI state interface
export interface ExtendedUIState extends UIState {
  modals: {
    candidateProfile: boolean;
    jobForm: boolean;
    confirmDialog: boolean;
    messageEditor: boolean;
  };
  activeTab: string;
  breadcrumbs: Array<{ label: string; path?: string }>;
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
  };
}

// Initial state
const initialState: ExtendedUIState = {
  theme: 'light',
  sidebarCollapsed: false,
  notifications: [],
  loading: {},
  errors: {},
  modals: {
    candidateProfile: false,
    jobForm: false,
    confirmDialog: false,
    messageEditor: false,
  },
  activeTab: 'dashboard',
  breadcrumbs: [{ label: 'Dashboard' }],
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'info',
  },
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme management
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    
    // Sidebar management
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    // Notifications management
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // Keep only the last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Loading states management
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      if (loading) {
        state.loading[key] = true;
      } else {
        delete state.loading[key];
      }
    },
    
    clearAllLoading: (state) => {
      state.loading = {};
    },
    
    // Error states management
    setError: (state, action: PayloadAction<{ key: string; error: string }>) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
    },
    
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    
    clearAllErrors: (state) => {
      state.errors = {};
    },
    
    // Modal management
    openModal: (state, action: PayloadAction<keyof ExtendedUIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    
    closeModal: (state, action: PayloadAction<keyof ExtendedUIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof ExtendedUIState['modals']] = false;
      });
    },
    
    // Tab management
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    
    // Breadcrumbs management
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    
    addBreadcrumb: (state, action: PayloadAction<{ label: string; path?: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    
    // Confirm dialog management
    openConfirmDialog: (state, action: PayloadAction<{
      title: string;
      message: string;
      onConfirm?: () => void;
      onCancel?: () => void;
      confirmText?: string;
      cancelText?: string;
      variant?: 'danger' | 'warning' | 'info';
    }>) => {
      state.confirmDialog = {
        isOpen: true,
        title: action.payload.title,
        message: action.payload.message,
        confirmText: action.payload.confirmText || 'Confirm',
        cancelText: action.payload.cancelText || 'Cancel',
        variant: action.payload.variant || 'info',
      };
    },
    
    closeConfirmDialog: (state) => {
      state.confirmDialog.isOpen = false;
    },
    
    // Reset UI state
    resetUI: () => initialState,
  },
});

// Export actions
export const {
  setTheme,
  toggleTheme,
  setSidebarCollapsed,
  toggleSidebar,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications,
  setLoading,
  clearAllLoading,
  setError,
  clearError,
  clearAllErrors,
  openModal,
  closeModal,
  closeAllModals,
  setActiveTab,
  setBreadcrumbs,
  addBreadcrumb,
  openConfirmDialog,
  closeConfirmDialog,
  resetUI,
} = uiSlice.actions;

// Selectors
export const selectTheme = (state: { ui: ExtendedUIState }) => state.ui.theme;
export const selectSidebarCollapsed = (state: { ui: ExtendedUIState }) => state.ui.sidebarCollapsed;
export const selectNotifications = (state: { ui: ExtendedUIState }) => state.ui.notifications;
export const selectUnreadNotifications = (state: { ui: ExtendedUIState }) => 
  state.ui.notifications.filter(n => !n.read);
export const selectLoading = (state: { ui: ExtendedUIState }) => state.ui.loading;
export const selectIsLoading = (key: string) => (state: { ui: ExtendedUIState }) => 
  Boolean(state.ui.loading[key]);
export const selectErrors = (state: { ui: ExtendedUIState }) => state.ui.errors;
export const selectError = (key: string) => (state: { ui: ExtendedUIState }) => 
  state.ui.errors[key];
export const selectModals = (state: { ui: ExtendedUIState }) => state.ui.modals;
export const selectModalOpen = (modal: keyof ExtendedUIState['modals']) => 
  (state: { ui: ExtendedUIState }) => state.ui.modals[modal];
export const selectActiveTab = (state: { ui: ExtendedUIState }) => state.ui.activeTab;
export const selectBreadcrumbs = (state: { ui: ExtendedUIState }) => state.ui.breadcrumbs;
export const selectConfirmDialog = (state: { ui: ExtendedUIState }) => state.ui.confirmDialog;

// Utility selectors
export const selectHasUnreadNotifications = (state: { ui: ExtendedUIState }) => 
  state.ui.notifications.some(n => !n.read);

export const selectIsAnyLoading = (state: { ui: ExtendedUIState }) => 
  Object.keys(state.ui.loading).length > 0;

export const selectHasErrors = (state: { ui: ExtendedUIState }) => 
  Object.keys(state.ui.errors).length > 0;

// Notification helper functions
export const createSuccessNotification = (title: string, message: string) => ({
  type: 'success' as const,
  title,
  message,
});

export const createErrorNotification = (title: string, message: string) => ({
  type: 'error' as const,
  title,
  message,
});

export const createWarningNotification = (title: string, message: string) => ({
  type: 'warning' as const,
  title,
  message,
});

export const createInfoNotification = (title: string, message: string) => ({
  type: 'info' as const,
  title,
  message,
});

export default uiSlice.reducer;