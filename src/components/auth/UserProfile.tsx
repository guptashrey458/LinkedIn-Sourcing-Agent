import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Camera, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth, useUpdateProfile, useChangePassword } from '../../hooks/useAuth';
import { User as UserType } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { isValidEmail } from '../../utils';

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserProfileProps {
  onClose?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setProfileSuccess(false);
      await updateProfileMutation.mutateAsync(data);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setPasswordSuccess(false);
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess(true);
      passwordForm.reset();
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      console.error('Password change failed:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              icon={<X />}
            >
              Close
            </Button>
          )}
        </div>

        {/* Profile Header */}
        <div className="flex items-center space-x-4 mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="relative">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-500 capitalize">
              Role: {user.role}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Change Password
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
            {/* Success Message */}
            {profileSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Profile updated successfully!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {updateProfileMutation.error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {updateProfileMutation.error.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <Input
                {...profileForm.register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                })}
                label="Full Name"
                placeholder="Enter your full name"
                error={profileForm.formState.errors.name?.message}
              />

              <Input
                {...profileForm.register('email', {
                  required: 'Email is required',
                  validate: (value) => {
                    if (!isValidEmail(value)) {
                      return 'Please enter a valid email address';
                    }
                    return true;
                  },
                })}
                type="email"
                label="Email Address"
                placeholder="Enter your email address"
                error={profileForm.formState.errors.email?.message}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-600 capitalize">
                  {user.role}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Contact your administrator to change your role
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={updateProfileMutation.isPending}
                disabled={updateProfileMutation.isPending}
                icon={<Save />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
            {/* Success Message */}
            {passwordSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Password changed successfully!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {changePasswordMutation.error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {changePasswordMutation.error.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <Input
                {...passwordForm.register('currentPassword', {
                  required: 'Current password is required',
                })}
                type="password"
                label="Current Password"
                placeholder="Enter your current password"
                error={passwordForm.formState.errors.currentPassword?.message}
                autoComplete="current-password"
              />

              <Input
                {...passwordForm.register('newPassword', {
                  required: 'New password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                  },
                })}
                type="password"
                label="New Password"
                placeholder="Enter your new password"
                error={passwordForm.formState.errors.newPassword?.message}
                autoComplete="new-password"
              />

              <Input
                {...passwordForm.register('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (value) => {
                    const newPassword = passwordForm.getValues('newPassword');
                    if (value !== newPassword) {
                      return 'Passwords do not match';
                    }
                    return true;
                  },
                })}
                type="password"
                label="Confirm New Password"
                placeholder="Confirm your new password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                autoComplete="new-password"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Password Requirements:
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Contains at least one uppercase letter</li>
                <li>• Contains at least one lowercase letter</li>
                <li>• Contains at least one number</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={changePasswordMutation.isPending}
                disabled={changePasswordMutation.isPending}
                icon={<Save />}
              >
                Change Password
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default UserProfile;