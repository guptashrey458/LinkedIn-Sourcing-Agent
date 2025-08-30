import { api, setAuthTokens, clearAuthTokens, getRefreshToken } from './api';
import { User, LoginForm } from '../types';

// Authentication response types
export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  permissions: string[];
  expiresIn: number;
}

export interface RefreshResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'recruiter' | 'viewer';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Authentication service
export const authService = {
  // Login user
  login: async (credentials: LoginForm): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });
      
      if (response.success && response.data) {
        // Store tokens
        setAuthTokens(response.data.token, response.data.refreshToken);
        
        // Store in localStorage if remember me is checked
        if (credentials.rememberMe) {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          // Store in sessionStorage for session-only persistence
          sessionStorage.setItem('authToken', response.data.token);
          sessionStorage.setItem('refreshToken', response.data.refreshToken);
          sessionStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  },
  
  // Register user
  register: async (userData: RegisterRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/register', userData);
      
      if (response.success && response.data) {
        // Store tokens
        setAuthTokens(response.data.token, response.data.refreshToken);
        
        // Store in sessionStorage (require login after registration)
        sessionStorage.setItem('authToken', response.data.token);
        sessionStorage.setItem('refreshToken', response.data.refreshToken);
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        
        return response.data;
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  },
  
  // Logout user
  logout: async (): Promise<void> => {
    try {
      // Call logout endpoint to invalidate token on server
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear tokens and storage
      clearAuthTokens();
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
    }
  },
  
  // Refresh authentication token
  refreshAuth: async (): Promise<RefreshResponse> => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post<RefreshResponse>('/auth/refresh', {
        refreshToken,
      });
      
      if (response.success && response.data) {
        // Update stored tokens
        setAuthTokens(response.data.token, response.data.refreshToken);
        
        // Update storage
        const isRemembered = localStorage.getItem('authToken');
        const storage = isRemembered ? localStorage : sessionStorage;
        
        storage.setItem('authToken', response.data.token);
        if (response.data.refreshToken) {
          storage.setItem('refreshToken', response.data.refreshToken);
        }
        
        return response.data;
      }
      
      throw new Error(response.message || 'Token refresh failed');
    } catch (error) {
      // Clear tokens on refresh failure
      clearAuthTokens();
      throw new Error(error instanceof Error ? error.message : 'Token refresh failed');
    }
  },
  
  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/auth/me');
      
      if (response.success && response.data) {
        // Update stored user data
        const isRemembered = localStorage.getItem('user');
        const storage = isRemembered ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(response.data));
        
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get user profile');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get user profile');
    }
  },
  
  // Update user profile
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    try {
      const response = await api.put<User>('/auth/profile', updates);
      
      if (response.success && response.data) {
        // Update stored user data
        const isRemembered = localStorage.getItem('user');
        const storage = isRemembered ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(response.data));
        
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update profile');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  },
  
  // Change password
  changePassword: async (passwordData: ChangePasswordRequest): Promise<void> => {
    try {
      const response = await api.post('/auth/change-password', passwordData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to change password');
    }
  },
  
  // Request password reset
  requestPasswordReset: async (resetData: ResetPasswordRequest): Promise<void> => {
    try {
      const response = await api.post('/auth/reset-password', resetData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to request password reset');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to request password reset');
    }
  },
  
  // Confirm password reset
  confirmPasswordReset: async (resetData: ConfirmResetPasswordRequest): Promise<void> => {
    try {
      const response = await api.post('/auth/reset-password/confirm', resetData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
    }
  },
  
  // Verify email
  verifyEmail: async (token: string): Promise<void> => {
    try {
      const response = await api.post('/auth/verify-email', { token });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to verify email');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to verify email');
    }
  },
  
  // Resend verification email
  resendVerificationEmail: async (): Promise<void> => {
    try {
      const response = await api.post('/auth/resend-verification');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to resend verification email');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to resend verification email');
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return Boolean(token);
  },
  
  // Get stored user data
  getStoredUser: (): User | null => {
    try {
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      return null;
    }
  },
  
  // Initialize auth from storage
  initializeAuth: (): { user: User | null; token: string | null } => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const refreshTokenStored = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      const user = authService.getStoredUser();
      
      if (token && refreshTokenStored) {
        setAuthTokens(token, refreshTokenStored);
      }
      
      return { user, token };
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error);
      return { user: null, token: null };
    }
  },
  
  // Get user permissions
  getUserPermissions: async (): Promise<string[]> => {
    try {
      const response = await api.get<string[]>('/auth/permissions');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  },
  
  // Check if user has specific permission
  hasPermission: (permissions: string[], requiredPermission: string): boolean => {
    return permissions.includes(requiredPermission) || permissions.includes('admin');
  },
};

export default authService;