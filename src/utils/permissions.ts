import { User } from '../types';

// Define permission constants
export const PERMISSIONS = {
  // User management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  
  // Job management
  JOBS_VIEW: 'jobs:view',
  JOBS_CREATE: 'jobs:create',
  JOBS_EDIT: 'jobs:edit',
  JOBS_DELETE: 'jobs:delete',
  JOBS_PUBLISH: 'jobs:publish',
  
  // Candidate management
  CANDIDATES_VIEW: 'candidates:view',
  CANDIDATES_CREATE: 'candidates:create',
  CANDIDATES_EDIT: 'candidates:edit',
  CANDIDATES_DELETE: 'candidates:delete',
  CANDIDATES_EXPORT: 'candidates:export',
  CANDIDATES_CONTACT: 'candidates:contact',
  
  // Pipeline management
  PIPELINES_VIEW: 'pipelines:view',
  PIPELINES_CREATE: 'pipelines:create',
  PIPELINES_EDIT: 'pipelines:edit',
  PIPELINES_DELETE: 'pipelines:delete',
  PIPELINES_RUN: 'pipelines:run',
  PIPELINES_STOP: 'pipelines:stop',
  
  // Analytics and reporting
  ANALYTICS_VIEW: 'analytics:view',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // System administration
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_USERS: 'admin:users',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_AUDIT: 'admin:audit',
  ADMIN_SYSTEM: 'admin:system',
  
  // Templates
  TEMPLATES_VIEW: 'templates:view',
  TEMPLATES_CREATE: 'templates:create',
  TEMPLATES_EDIT: 'templates:edit',
  TEMPLATES_DELETE: 'templates:delete',
} as const;

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<User['role'], string[]> = {
  admin: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS),
  ],
  recruiter: [
    // Job management
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.JOBS_EDIT,
    PERMISSIONS.JOBS_PUBLISH,
    
    // Candidate management
    PERMISSIONS.CANDIDATES_VIEW,
    PERMISSIONS.CANDIDATES_CREATE,
    PERMISSIONS.CANDIDATES_EDIT,
    PERMISSIONS.CANDIDATES_EXPORT,
    PERMISSIONS.CANDIDATES_CONTACT,
    
    // Pipeline management
    PERMISSIONS.PIPELINES_VIEW,
    PERMISSIONS.PIPELINES_CREATE,
    PERMISSIONS.PIPELINES_EDIT,
    PERMISSIONS.PIPELINES_RUN,
    PERMISSIONS.PIPELINES_STOP,
    
    // Templates
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.TEMPLATES_CREATE,
    PERMISSIONS.TEMPLATES_EDIT,
    
    // Analytics
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  viewer: [
    // Read-only access
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.CANDIDATES_VIEW,
    PERMISSIONS.PIPELINES_VIEW,
    PERMISSIONS.TEMPLATES_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

// Permission checking utilities
export class PermissionChecker {
  private permissions: string[];
  private role: User['role'];

  constructor(permissions: string[], role: User['role']) {
    this.permissions = permissions;
    this.role = role;
  }

  // Check if user has a specific permission
  hasPermission(permission: string): boolean {
    // Admin role has all permissions
    if (this.role === 'admin') {
      return true;
    }
    
    // Check if permission is in user's permission list
    return this.permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Check if user has all of the specified permissions
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Check if user has a specific role
  hasRole(role: User['role']): boolean {
    return this.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: User['role'][]): boolean {
    return roles.includes(this.role);
  }

  // Check if user can perform an action on a resource
  canPerform(action: string, resource: string): boolean {
    const permission = `${resource}:${action}`;
    return this.hasPermission(permission);
  }

  // Get all permissions for current role
  getRolePermissions(): string[] {
    return ROLE_PERMISSIONS[this.role] || [];
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.role === 'admin';
  }

  // Check if user is recruiter
  isRecruiter(): boolean {
    return this.role === 'recruiter';
  }

  // Check if user is viewer
  isViewer(): boolean {
    return this.role === 'viewer';
  }
}

// Factory function to create permission checker
export const createPermissionChecker = (user: User | null): PermissionChecker | null => {
  if (!user) {
    return null;
  }
  
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return new PermissionChecker(rolePermissions, user.role);
};

// Utility functions for common permission checks
export const canViewJobs = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.JOBS_VIEW) ?? false;
};

export const canCreateJobs = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.JOBS_CREATE) ?? false;
};

export const canEditJobs = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.JOBS_EDIT) ?? false;
};

export const canDeleteJobs = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.JOBS_DELETE) ?? false;
};

export const canViewCandidates = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.CANDIDATES_VIEW) ?? false;
};

export const canCreateCandidates = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.CANDIDATES_CREATE) ?? false;
};

export const canEditCandidates = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.CANDIDATES_EDIT) ?? false;
};

export const canDeleteCandidates = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.CANDIDATES_DELETE) ?? false;
};

export const canContactCandidates = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.CANDIDATES_CONTACT) ?? false;
};

export const canRunPipelines = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.PIPELINES_RUN) ?? false;
};

export const canViewAnalytics = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.ANALYTICS_VIEW) ?? false;
};

export const canAccessAdminSettings = (checker: PermissionChecker | null): boolean => {
  return checker?.hasPermission(PERMISSIONS.ADMIN_SETTINGS) ?? false;
};

// Resource-based permission checks
export const canAccessResource = (
  checker: PermissionChecker | null,
  resource: string,
  action: 'view' | 'create' | 'edit' | 'delete'
): boolean => {
  if (!checker) return false;
  return checker.canPerform(action, resource);
};

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
  ],
  JOB_MANAGEMENT: [
    PERMISSIONS.JOBS_VIEW,
    PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.JOBS_EDIT,
    PERMISSIONS.JOBS_DELETE,
    PERMISSIONS.JOBS_PUBLISH,
  ],
  CANDIDATE_MANAGEMENT: [
    PERMISSIONS.CANDIDATES_VIEW,
    PERMISSIONS.CANDIDATES_CREATE,
    PERMISSIONS.CANDIDATES_EDIT,
    PERMISSIONS.CANDIDATES_DELETE,
    PERMISSIONS.CANDIDATES_EXPORT,
    PERMISSIONS.CANDIDATES_CONTACT,
  ],
  PIPELINE_MANAGEMENT: [
    PERMISSIONS.PIPELINES_VIEW,
    PERMISSIONS.PIPELINES_CREATE,
    PERMISSIONS.PIPELINES_EDIT,
    PERMISSIONS.PIPELINES_DELETE,
    PERMISSIONS.PIPELINES_RUN,
    PERMISSIONS.PIPELINES_STOP,
  ],
  ANALYTICS: [
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  ADMINISTRATION: [
    PERMISSIONS.ADMIN_SETTINGS,
    PERMISSIONS.ADMIN_USERS,
    PERMISSIONS.ADMIN_ROLES,
    PERMISSIONS.ADMIN_AUDIT,
    PERMISSIONS.ADMIN_SYSTEM,
  ],
} as const;