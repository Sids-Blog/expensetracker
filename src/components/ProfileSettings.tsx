import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Save, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export const ProfileSettings = () => {
  const { profile, updateProfile, updatePassword, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    console.log('ProfileSettings - profile:', profile);
    console.log('ProfileSettings - isLoading:', isLoading);
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile, isLoading]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    
    try {
      await updateProfile({ full_name: fullName });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return;
    }

    setIsUpdatingPassword(true);
    
    try {
      const success = await updatePassword(newPassword);
      if (success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  if (isLoading || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <FormField
              type="email"
              label="Email"
              value={profile.email}
              onChange={() => {}}
              disabled={true}
            />
            
            <FormField
              type="text"
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              placeholder="Enter your full name"
              disabled={isUpdatingProfile}
            />
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Account created:</span>
              <span>{new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            
            {profile.last_login_at && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Last login:</span>
                <span>{new Date(profile.last_login_at).toLocaleString()}</span>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={isUpdatingProfile || fullName === (profile.full_name || '')}
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <FormField
              type="password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Enter new password"
              required
              disabled={isUpdatingPassword}
            />
            
            <FormField
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              required
              disabled={isUpdatingPassword}
            />
            
            {!passwordsMatch && confirmPassword && (
              <p className="text-sm text-red-600">Passwords do not match</p>
            )}
            
            <Button 
              type="submit" 
              disabled={isUpdatingPassword || !newPassword.trim() || !passwordsMatch}
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
