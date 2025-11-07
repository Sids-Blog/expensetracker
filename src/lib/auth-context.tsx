import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthService, UserProfile } from './auth-service';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  
  signUp: (email: string, password: string, fullName?: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const isAuthenticated = !!user && !!session;

  // Load user profile
  const loadProfile = async (userId: string) => {
    const result = await AuthService.getUserProfile(userId);
    if (result.success && result.data) {
      setProfile(result.data);
      setIsAdmin(result.data.is_admin);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const sessionResult = await AuthService.getCurrentSession();
        if (sessionResult.success && sessionResult.data) {
          setSession(sessionResult.data);
          setUser(sessionResult.data.user);
          await loadProfile(sessionResult.data.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await AuthService.signUp(email, password, fullName);

      if (result.success) {
        toast({
          title: 'Account Created',
          description: 'Please check your email to verify your account.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: result.error || 'Failed to create account',
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await AuthService.signIn(email, password);

      if (result.success) {
        toast({
          title: 'Welcome Back',
          description: 'You have successfully signed in.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: result.error || 'Invalid credentials',
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const result = await AuthService.signOut();

      if (result.success) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setIsAdmin(false);
        
        toast({
          title: 'Signed Out',
          description: 'You have been successfully signed out.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign Out Failed',
          description: result.error || 'Failed to sign out',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      const result = await AuthService.updateUserProfile(updates);

      if (result.success && result.data) {
        setProfile(result.data);
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: result.error || 'Failed to update profile',
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const result = await AuthService.resetPassword(email);

      if (result.success) {
        toast({
          title: 'Password Reset Email Sent',
          description: 'Please check your email for password reset instructions.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Reset Failed',
          description: result.error || 'Failed to send reset email',
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    }
  };

  const updatePassword = async (newPassword: string): Promise<boolean> => {
    try {
      const result = await AuthService.updatePassword(newPassword);

      if (result.success) {
        toast({
          title: 'Password Updated',
          description: 'Your password has been successfully updated.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: result.error || 'Failed to update password',
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    isAdmin,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};