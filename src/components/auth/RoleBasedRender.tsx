import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { User } from '../../types';

// Component for rendering content based on permissions
interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { hasPermission } = usePermissions();
  
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};

// Component for rendering content based on multiple permissions (ANY)
interface AnyPermissionGateProps {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AnyPermissionGate: React.FC<AnyPermissionGateProps> = ({
  permissions,
  children,
  fallback = null,
}) => {
  const { hasAnyPermission } = usePermissions();
  
  return hasAnyPermission(permissions) ? <>{children}</> : <>{fallback}</>;
};

// Component for rendering content based on multiple permissions (ALL)
interface AllPermissionsGateProps {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AllPermissionsGate: React.FC<AllPermissionsGateProps> = ({
  permissions,
  children,
  fallback = null,
}) => {
  const { hasAllPermissions } = usePermissions();
  
  return hasAllPermissions(permissions) ? <>{children}</> : <>{fallback}</>;
};

// Component for rendering content based on user role
interface RoleGateProps {
  role: User['role'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  role,
  children,
  fallback = null,
}) => {
  const { hasRole } = usePermissions();
  
  return hasRole(role) ? <>{children}</> : <>{fallback}</>;
};

// Component for rendering content based on multiple roles
interface AnyRoleGateProps {
  roles: User['role'][];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AnyRoleGate: React.FC<AnyRoleGateProps> = ({
  roles,
  children,
  fallback = null,
}) => {
  const { hasAnyRole } = usePermissions();
  
  return hasAnyRole(roles) ? <>{children}</> : <>{fallback}</>;
};

// Component for admin-only content
interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({
  children,
  fallback = null,
}) => {
  const { isAdmin } = usePermissions();
  
  return isAdmin() ? <>{children}</> : <>{fallback}</>;
};

// Component for recruiter and admin content
interface RecruiterOrAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RecruiterOrAdmin: React.FC<RecruiterOrAdminProps> = ({
  children,
  fallback = null,
}) => {
  const { hasAnyRole } = usePermissions();
  
  return hasAnyRole(['recruiter', 'admin']) ? <>{children}</> : <>{fallback}</>;
};

// Component for non-viewer content (recruiter and admin)
interface NonViewerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const NonViewer: React.FC<NonViewerProps> = ({
  children,
  fallback = null,
}) => {
  const { hasAnyRole } = usePermissions();
  
  return hasAnyRole(['recruiter', 'admin']) ? <>{children}</> : <>{fallback}</>;
};

// Higher-order component for permission-based rendering
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  fallback?: React.ComponentType<P>
) {
  return function PermissionWrappedComponent(props: P) {
    const { hasPermission } = usePermissions();
    
    if (hasPermission(permission)) {
      return <Component {...props} />;
    }
    
    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}

// Higher-order component for role-based rendering
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  role: User['role'],
  fallback?: React.ComponentType<P>
) {
  return function RoleWrappedComponent(props: P) {
    const { hasRole } = usePermissions();
    
    if (hasRole(role)) {
      return <Component {...props} />;
    }
    
    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}

// Higher-order component for admin-only components
export function withAdminOnly<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<P>
) {
  return function AdminOnlyWrappedComponent(props: P) {
    const { isAdmin } = usePermissions();
    
    if (isAdmin()) {
      return <Component {...props} />;
    }
    
    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}

// Component for conditional button rendering based on permissions
interface PermissionButtonProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  children,
  fallback = null,
  className,
}) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Component for conditional menu item rendering
interface PermissionMenuItemProps {
  permission: string;
  children: React.ReactNode;
}

export const PermissionMenuItem: React.FC<PermissionMenuItemProps> = ({
  permission,
  children,
}) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return null;
  }
  
  return <>{children}</>;
};

// Component for role-based navigation items
interface RoleNavItemProps {
  roles: User['role'][];
  children: React.ReactNode;
}

export const RoleNavItem: React.FC<RoleNavItemProps> = ({
  roles,
  children,
}) => {
  const { hasAnyRole } = usePermissions();
  
  if (!hasAnyRole(roles)) {
    return null;
  }
  
  return <>{children}</>;
};

// Component for feature flags based on permissions
interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  const { hasPermission } = usePermissions();
  
  // Map feature names to permissions
  const featurePermissionMap: Record<string, string> = {
    'job-creation': 'jobs:create',
    'candidate-export': 'candidates:export',
    'pipeline-management': 'pipelines:create',
    'analytics-dashboard': 'analytics:view',
    'admin-panel': 'admin:settings',
    'user-management': 'admin:users',
    'audit-logs': 'admin:audit',
  };
  
  const requiredPermission = featurePermissionMap[feature];
  
  if (!requiredPermission) {
    console.warn(`Unknown feature: ${feature}`);
    return <>{fallback}</>;
  }
  
  return hasPermission(requiredPermission) ? <>{children}</> : <>{fallback}</>;
};