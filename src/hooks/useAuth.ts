import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { authService } from '../services/queryClient';
import { 
  loginUser, 
  logoutUser, 
  refreshAuthToken, 
  updateUserProfile,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectAuthToken,
  selectAuthLoading,
  selectAuthError,
  selectPermissions,
  hasPermission as checkPermission
} from '../store/slices/authSlice';
import { User, LoginForm } from '../types';
import type { 
  RegisterRequest, 
  ChangePasswordRequest, 
  ResetPasswordRequest, 
  ConfirmResetPasswordRequest 
} from '../services/authService';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  permissions: () => [...authKeys.all, 'permissions'] as const,
};

// Auth hook - main authentication state
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const token = useAppSelector(selectAuthToken);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const permissions = useAppSelector(selectPermissions);
  
  // Login function
  const login = async (credentials: LoginForm) => {
    return dispatch(loginUser(credentials)).unwrap();
  };
  
  // Logout function
  const logout = async () => {
    return dispatch(logoutUser()).unwrap();
  };
  
  // Refresh token function
  const refreshToken = async () => {
    const refreshTokenValue = authService.getRefreshToken();
    if (refreshTokenValue) {
      return dispatch(refreshAuthToken(refreshTokenValue)).unwrap();
    }
    throw new Error('No refresh token available');
  };
  
  // Check permission function
  const hasPermission = (permission: string) => {
    return checkPermission(permissions, permission);
  };
  
  return {
    // State
    user,
    isAuthenticated,
    token,
    isLoading,
    error,
    permissions,
    
    // Actions
    login,
    logout,
    refreshToken,
    hasPermission,
    
    // Full auth state
    auth,
  };
};

// Current user query hook
export const useCurrentUser = (enabled: boolean = true) => {
  const { isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authService.getCurrentUser(),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutes
    onSuccess: (userData) => {
      // Update Redux store with fresh user data
      dispatch(updateUserProfile(userData));
    },
  });
};

// User permissions query hook
export const useUserPermissions = (enabled: boolean = true) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: authKeys.permissions(),
    queryFn: () => authService.getUserPermissions(),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: () => {
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: (updates: Partial<User>) => authService.updateProfile(updates),
    onSuccess: (updatedUser) => {
      // Update Redux store
      dispatch(updateUserProfile(updatedUser));
      
      // Update query cache
      queryClient.setQueryData(authKeys.user(), updatedUser);
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (passwordData: ChangePasswordRequest) => authService.changePassword(passwordData),
  });
};

// Request password reset mutation
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (resetData: ResetPasswordRequest) => authService.requestPasswordReset(resetData),
  });
};

// Confirm password reset mutation
export const useConfirmPasswordReset = () => {
  return useMutation({
    mutationFn: (resetData: ConfirmResetPasswordRequest) => authService.confirmPasswordReset(resetData),
  });
};

// Verify email mutation
export const useVerifyEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

// Resend verification email mutation
export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: () => authService.resendVerificationEmail(),
  });
};

// Permission checker hook
export const usePermission = (permission: string) => {
  const { permissions } = useAuth();
  return checkPermission(permissions, permission);
};

// Multiple permissions checker hook
export const usePermissions = (requiredPermissions: string[]) => {
  const { permissions } = useAuth();
  
  const hasAllPermissions = requiredPermissions.every(permission => 
    checkPermission(permissions, permission)
  );
  
  const hasSomePermissions = requiredPermissions.some(permission => 
    checkPermission(permissions, permission)
  );
  
  const permissionMap = requiredPermissions.reduce((acc, permission) => {
    acc[permission] = checkPermission(permissions, permission);
    return acc;
  }, {} as Record<string, boolean>);
  
  return {
    hasAllPermissions,
    hasSomePermissions,
    permissionMap,
  };
};

// Role checker hook
export const useRole = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const isRecruiter = user?.role === 'recruiter';
  const isViewer = user?.role === 'viewer';
  
  const hasRole = (role: User['role']) => user?.role === role;
  const hasAnyRole = (roles: User['role'][]) => roles.includes(user?.role as User['role']);
  
  return {
    role: user?.role,
    isAdmin,
    isRecruiter,
    isViewer,
    hasRole,
    hasAnyRole,
  };
};

// Authentication initialization hook
export const useAuthInitialization = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    // Initialize auth from storage
    const { user, token } = authService.initializeAuth();
    
    if (user && token) {
      // Set user in Redux store
      dispatch(updateUserProfile(user));
      
      // Verify token is still valid by fetching current user
      queryClient.prefetchQuery({
        queryKey: authKeys.user(),
        queryFn: () => authService.getCurrentUser(),
        staleTime: 0, // Force fresh fetch
      }).catch(() => {
        // Token is invalid, logout
        dispatch(logoutUser());
      });
    }
  }, [dispatch, queryClient]);
};

// Session management hook
export const useSessionManagement = () => {
  const { isAuthenticated, refreshToken } = useAuth();
  const queryClient = useQueryClient();
  
  // Auto-refresh token before expiration
  React.useEffect(() => {
    if (!isAuthenticated) return;
    
    // Set up token refresh interval (refresh every 50 minutes if token expires in 1 hour)
    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // Token refresh failed, user will be logged out by the auth slice
      }
    }, 50 * 60 * 1000); // 50 minutes
    
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, refreshToken]);
  
  // Handle visibility change to refresh data when user returns
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Invalidate all queries when user returns to the app
        queryClient.invalidateQueries();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, queryClient]);
};