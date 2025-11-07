import { apiClient } from './api-client';
import { supabase } from './supabase';
import { Transaction, Category, PaymentMethod } from './supabase';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Flag to use API backend for database operations
const USE_API_BACKEND = true;

export class BackendService {
  // Transaction operations
  static async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<ApiResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
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
        success: false
      };
    }
  }

  static async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
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
        success: false
      };
    }
  }

  static async deleteTransaction(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async bulkUpdateTransactions(field: 'category' | 'payment_method', oldValue: string, newValue: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ [field]: newValue })
        .eq(field, oldValue);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  // Category operations
  static async getCategories(): Promise<ApiResponse<Category[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      // Use function to get user's personalized categories
      const { data, error } = await supabase.rpc('get_user_categories', {
        p_user_id: user.id,
        p_type: null
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<ApiResponse<Category>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      // Create category with user in opted_in_users array (makes it custom)
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          ...category,
          opted_in_users: [user.id],  // Mark as custom by adding user to array
          hidden_for_users: [],
          user_orders: {}
        }])
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
        success: false
      };
    }
  }

  static async deleteCategory(name: string, type: 'expense' | 'income'): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', name)
        .eq('type', type);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async updateCategoryOrder(type: 'expense' | 'income', orderedNames: string[]): Promise<ApiResponse<boolean>> {
    try {
      const updates = orderedNames.map((name, index) =>
        supabase
          .from('categories')
          .update({ order: index })
          .eq('name', name)
          .eq('type', type)
      );

      await Promise.all(updates);
      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  // Helper methods for personalization
  static async hideCategoryForUser(categoryId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      const { error } = await supabase.rpc('hide_category', {
        p_category_id: categoryId,
        p_user_id: user.id
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async showCategoryForUser(categoryId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      const { error } = await supabase.rpc('show_category', {
        p_category_id: categoryId,
        p_user_id: user.id
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async setCategoryOrderForUser(categoryId: string, order: number): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      const { error } = await supabase.rpc('set_category_order', {
        p_category_id: categoryId,
        p_user_id: user.id,
        p_order: order
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  // Payment Method operations
  static async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      // Use function to get user's personalized payment methods
      const { data, error } = await supabase.rpc('get_user_payment_methods', {
        p_user_id: user.id
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async createPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id' | 'created_at'>): Promise<ApiResponse<PaymentMethod>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      // Create payment method with user in opted_in_users array (makes it custom)
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([{
          ...paymentMethod,
          opted_in_users: [user.id],  // Mark as custom by adding user to array
          hidden_for_users: [],
          user_orders: {}
        }])
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
        success: false
      };
    }
  }

  static async deletePaymentMethod(name: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('name', name);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async updatePaymentMethodOrder(orderedNames: string[]): Promise<ApiResponse<boolean>> {
    try {
      const updates = orderedNames.map((name, index) =>
        supabase
          .from('payment_methods')
          .update({ order: index })
          .eq('name', name)
      );

      await Promise.all(updates);
      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  // Helper methods for payment method personalization
  static async hidePaymentMethodForUser(paymentMethodId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      const { error } = await supabase.rpc('hide_payment_method', {
        p_payment_id: paymentMethodId,
        p_user_id: user.id
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async showPaymentMethodForUser(paymentMethodId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      const { error } = await supabase.rpc('show_payment_method', {
        p_payment_id: paymentMethodId,
        p_user_id: user.id
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async setPaymentMethodOrderForUser(paymentMethodId: string, order: number): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      const { error } = await supabase.rpc('set_payment_method_order', {
        p_payment_id: paymentMethodId,
        p_user_id: user.id,
        p_order: order
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  // Health check
  static async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('count')
        .limit(1);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return {
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString()
        },
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Database connection failed',
        success: false
      };
    }
  }

  // Batch operations for offline sync
  static async batchCreateTransactions(transactions: Omit<Transaction, 'id' | 'created_at'>[]): Promise<ApiResponse<Transaction[]>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transactions)
        .select();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async batchUpdateTransactions(updates: { id: string; data: Partial<Transaction> }[]): Promise<ApiResponse<boolean>> {
    try {
      const promises = updates.map(({ id, data }) =>
        supabase
          .from('transactions')
          .update(data)
          .eq('id', id)
      );

      await Promise.all(promises);
      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }

  static async batchDeleteTransactions(ids: string[]): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids);

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      };
    }
  }
}