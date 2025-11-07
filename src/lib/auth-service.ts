import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  deactivated_at?: string;
  deactivated_by?: string;
}

export interface AdminUserView extends UserProfile {
  transaction_count: number;
  total_expenses: number;
  total_income: number;
  deactivated_by_email?: string;
}

export interface AuthResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export class AuthService {
  // Sign up new user
  static async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse<User>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      if (!data.user) {
        return { data: null, error: 'Failed to create user', success: false };
      }

      return { data: data.user, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Sign in user
  static async signIn(email: string, password: string): Promise<AuthResponse<Session>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      if (!data.session) {
        return { data: null, error: 'Failed to create session', success: false };
      }

      // Check if user is active
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .single();

      if (profile && !profile.is_active) {
        await this.signOut();
        return { data: null, error: 'Your account has been deactivated. Please contact an administrator.', success: false };
      }

      return { data: data.session, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Sign out user
  static async signOut(): Promise<AuthResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<AuthResponse<User>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      if (!user) {
        return { data: null, error: 'No user logged in', success: false };
      }

      return { data: user, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Get current session
  static async getCurrentSession(): Promise<AuthResponse<Session>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      if (!session) {
        return { data: null, error: 'No active session', success: false };
      }

      return { data: session, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Get user profile
  static async getUserProfile(userId?: string): Promise<AuthResponse<UserProfile>> {
    try {
      let query = supabase.from('user_profiles').select('*');

      if (userId) {
        query = query.eq('id', userId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return { data: null, error: 'No user logged in', success: false };
        }
        query = query.eq('id', user.id);
      }

      const { data, error } = await query.single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<AuthResponse<UserProfile>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'No user logged in', success: false };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<AuthResponse<boolean>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Update password
  static async updatePassword(newPassword: string): Promise<AuthResponse<boolean>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Check if user is admin
  static async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      return data?.is_admin || false;
    } catch (error) {
      return false;
    }
  }

  // Admin: Get all users
  static async getAllUsers(): Promise<AuthResponse<AdminUserView[]>> {
    try {
      const { data, error } = await supabase
        .from('admin_user_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Admin: Deactivate user
  static async deactivateUser(userId: string): Promise<AuthResponse<boolean>> {
    try {
      const { error } = await supabase.rpc('deactivate_user', {
        target_user_id: userId,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Admin: Activate user
  static async activateUser(userId: string): Promise<AuthResponse<boolean>> {
    try {
      const { error } = await supabase.rpc('activate_user', {
        target_user_id: userId,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Admin: Make user admin
  static async makeAdmin(userId: string): Promise<AuthResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: true })
        .eq('id', userId);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Admin: Remove admin privileges
  static async removeAdmin(userId: string): Promise<AuthResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: false })
        .eq('id', userId);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}