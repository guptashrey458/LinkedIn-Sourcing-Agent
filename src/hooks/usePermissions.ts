import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { 
  createPermissionChecker, 
  PermissionChecker,
  PERMISSIONS,
  PERMISSION_GROUPS,
  canViewJobs,
  canCreateJobs,
  canEditJobs,
  canDeleteJobs,
  canViewCandidates,
  canCreateCandidates,
  canEditCandidates,
  canDeleteCandidates,
  canContactCandidates,
  canRunPipelines,
  canViewAnalytics,
  canAccessAdminSettings,
  canAccessResource,
} from '../utils/permissions';

// Main permissions hook
export const usePermissions = () => {
  const { user } = useAuth();
  
  const permissionChecker = useMemo(() => {
    return createPermissionChecker(user);
  }, [user]);

  // Basic permission checking functions
  const hasPermission = (permission: string): boolean => {
    return permissionChecker?.hasPermission(permission) ?? false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissionChecker?.hasAnyPermission(permissions) ?? false;
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissionChecker?.hasAllPermissions(permissions) ?? false;
  };

  const hasRole = (role: 'admin' | 'recruiter' | 'viewer'): boolean => {
    return permissionChecker?.hasRole(role) ?? false;
  };

  const hasAnyRole = (roles: ('admin' | 'recruiter' | 'viewer')[]): boolean => {
    return permissionChecker?.hasAnyRole(roles) ?? false;
  };

  const canPerform = (action: string, resource: string): boolean => {
    return permissionChecker?.canPerform(action, resource) ?? false;
  };

  // Role checking functions
  const isAdmin = (): boolean => {
    return permissionChecker?.isAdmin() ?? false;
  };

  const isRecruiter = (): boolean => {
    return permissionChecker?.isRecruiter() ?? false;
  };

  const isViewer = (): boolean => {
    return permissionChecker?.isViewer() ?? false;
  };

  // Resource-specific permission functions
  const jobs = {
    canView: () => canViewJobs(permissionChecker),
    canCreate: () => canCreateJobs(permissionChecker),
    canEdit: () => canEditJobs(permissionChecker),
    canDelete: () => canDeleteJobs(permissionChecker),
    canPublish: () => hasPermission(PERMISSIONS.JOBS_PUBLISH),
  };

  const candidates = {
    canView: () => canViewCandidates(permissionChecker),
    canCreate: () => canCreateCandidates(permissionChecker),
    canEdit: () => canEditCandidates(permissionChecker),
    canDelete: () => canDeleteCandidates(permissionChecker),
    canContact: () => canContactCandidates(permissionChecker),
    canExport: () => hasPermission(PERMISSIONS.CANDIDATES_EXPORT),
  };

  const pipelines = {
    canView: () => hasPermission(PERMISSIONS.PIPELINES_VIEW),
    canCreate: () => hasPermission(PERMISSIONS.PIPELINES_CREATE),
    canEdit: () => hasPermission(PERMISSIONS.PIPELINES_EDIT),
    canDelete: () => hasPermission(PERMISSIONS.PIPELINES_DELETE),
    canRun: () => canRunPipelines(permissionChecker),
    canStop: () => hasPermission(PERMISSIONS.PIPELINES_STOP),
  };

  const templates = {
    canView: () => hasPermission(PERMISSIONS.TEMPLATES_VIEW),
    canCreate: () => hasPermission(PERMISSIONS.TEMPLATES_CREATE),
    canEdit: () => hasPermission(PERMISSIONS.TEMPLATES_EDIT),
    canDelete: () => hasPermission(PERMISSIONS.TEMPLATES_DELETE),
  };

  const analytics = {
    canView: () => canViewAnalytics(permissionChecker),
    canViewReports: () => hasPermission(PERMISSIONS.REPORTS_VIEW),
    canExportReports: () => hasPermission(PERMISSIONS.REPORTS_EXPORT),
  };

  const admin = {
    canAccessSettings: () => canAccessAdminSettings(permissionChecker),
    canManageUsers: () => hasPermission(PERMISSIONS.ADMIN_USERS),
    canManageRoles: () => hasPermission(PERMISSIONS.ADMIN_ROLES),
    canViewAudit: () => hasPermission(PERMISSIONS.ADMIN_AUDIT),
    canManageSystem: () => hasPermission(PERMISSIONS.ADMIN_SYSTEM),
  };

  // Permission group checking
  const hasPermissionGroup = (groupName: keyof typeof PERMISSION_GROUPS): boolean => {
    const permissions = PERMISSION_GROUPS[groupName];
    return hasAnyPermission(permissions);
  };

  const hasAllPermissionsInGroup = (groupName: keyof typeof PERMISSION_GROUPS): boolean => {
    const permissions = PERMISSION_GROUPS[groupName];
    return hasAllPermissions(permissions);
  };

  return {
    // Basic functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canPerform,
    
    // Role functions
    isAdmin,
    isRecruiter,
    isViewer,
    
    // Resource-specific functions
    jobs,
    candidates,
    pipelines,
    templates,
    analytics,
    admin,
    
    // Permission group functions
    hasPermissionGroup,
    hasAllPermissionsInGroup,
    
    // Utility functions
    canAccessResource: (resource: string, action: 'view' | 'create' | 'edit' | 'delete') => 
      canAccessResource(permissionChecker, resource, action),
    
    // Get all permissions for debugging
    getAllPermissions: () => permissionChecker?.getRolePermissions() ?? [],
    
    // Get permission checker instance
    getChecker: () => permissionChecker,
  };
};

// Specific hooks for common use cases
export const useJobPermissions = () => {
  const { jobs } = usePermissions();
  return jobs;
};

export const useCandidatePermissions = () => {
  const { candidates } = usePermissions();
  return candidates;
};

export const usePipelinePermissions = () => {
  const { pipelines } = usePermissions();
  return pipelines;
};

export const useAdminPermissions = () => {
  const { admin } = usePermissions();
  return admin;
};

export const useAnalyticsPermissions = () => {
  const { analytics } = usePermissions();
  return analytics;
};

// Hook for checking if user can access a specific route
export const useRoutePermissions = () => {
  const permissions = usePermissions();
  
  const canAccessRoute = (routeName: string): boolean => {
    switch (routeName) {
      case 'dashboard':
        return true; // All authenticated users can access dashboard
      
      case 'jobs':
      case 'jobs-list':
        return permissions.jobs.canView();
      
      case 'jobs-create':
      case 'jobs-new':
        return permissions.jobs.canCreate();
      
      case 'candidates':
      case 'candidates-list':
        return permissions.candidates.canView();
      
      case 'candidates-create':
      case 'candidates-new':
        return permissions.candidates.canCreate();
      
      case 'pipelines':
      case 'pipelines-list':
        return permissions.pipelines.canView();
      
      case 'pipelines-create':
      case 'pipelines-new':
        return permissions.pipelines.canCreate();
      
      case 'analytics':
        return permissions.analytics.canView();
      
      case 'reports':
        return permissions.analytics.canViewReports();
      
      case 'templates':
        return permissions.templates.canView();
      
      case 'admin':
      case 'admin-settings':
        return permissions.admin.canAccessSettings();
      
      case 'admin-users':
        return permissions.admin.canManageUsers();
      
      case 'admin-roles':
        return permissions.admin.canManageRoles();
      
      case 'admin-audit':
        return permissions.admin.canViewAudit();
      
      case 'admin-system':
        return permissions.admin.canManageSystem();
      
      default:
        return false;
    }
  };

  return { canAccessRoute };
};

// Hook for conditional rendering based on permissions
export const useConditionalRender = () => {
  const permissions = usePermissions();
  
  const renderIf = (condition: boolean, component: React.ReactNode): React.ReactNode => {
    return condition ? component : null;
  };

  const renderIfPermission = (permission: string, component: React.ReactNode): React.ReactNode => {
    return renderIf(permissions.hasPermission(permission), component);
  };

  const renderIfRole = (role: 'admin' | 'recruiter' | 'viewer', component: React.ReactNode): React.ReactNode => {
    return renderIf(permissions.hasRole(role), component);
  };

  const renderIfAnyRole = (roles: ('admin' | 'recruiter' | 'viewer')[], component: React.ReactNode): React.ReactNode => {
    return renderIf(permissions.hasAnyRole(roles), component);
  };

  return {
    renderIf,
    renderIfPermission,
    renderIfRole,
    renderIfAnyRole,
  };
};