import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

const Unauthorized: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const state = location.state as {
    from?: Location;
    requiredRole?: string;
    requiredPermission?: string;
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <ShieldX className="h-8 w-8 text-red-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>

            {/* Description */}
            <div className="text-gray-600 mb-6">
              <p className="mb-4">
                You don't have permission to access this resource.
              </p>

              {state?.requiredRole && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Required Role:</strong> {state.requiredRole}
                  </p>
                  <p className="text-sm text-yellow-800">
                    <strong>Your Role:</strong> {user?.role || 'Unknown'}
                  </p>
                </div>
              )}

              {state?.requiredPermission && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Required Permission:</strong> {state.requiredPermission}
                  </p>
                </div>
              )}

              <p className="text-sm">
                If you believe this is an error, please contact your administrator.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleGoBack}
                variant="primary"
                className="w-full"
                icon={<ArrowLeft />}
              >
                Go Back
              </Button>

              <Link to="/dashboard" className="block">
                <Button
                  variant="outline"
                  className="w-full"
                  icon={<Home />}
                >
                  Go to Dashboard
                </Button>
              </Link>

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700"
              >
                Sign out and login as different user
              </Button>
            </div>

            {/* User Info */}
            {user && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Signed in as: <span className="font-medium">{user.email}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Role: <span className="font-medium capitalize">{user.role}</span>
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Unauthorized;