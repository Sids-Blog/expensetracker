import { apiClient } from './api-client';
import { Transaction, Category, PaymentMethod } from './supabase';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export class BackendService {
  // Transaction operations
  static async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<ApiResponse<Transaction>> {
    return apiClient.post<Transaction>('/transactions', transaction);
  }

  static async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    return apiClient.get<Transaction[]>('/transactions');
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    return apiClient.patch<Transaction>(`/transactions/${id}`, updates);
  }

  static async deleteTransaction(id: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(`/transactions/${id}`);
  }

  static async bulkUpdateTransactions(field: 'category' | 'payment_method', oldValue: string, newValue: string): Promise<ApiResponse<boolean>> {
    // This would need a new backend endpoint
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  // Category operations
  static async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/categories');
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<ApiResponse<Category>> {
    return apiClient.post<Category>('/categories', category);
  }

  static async deleteCategory(name: string, type: 'expense' | 'income'): Promise<ApiResponse<boolean>> {
    // This would need a new backend endpoint with query params
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  static async updateCategoryOrder(type: 'expense' | 'income', orderedNames: string[]): Promise<ApiResponse<boolean>> {
    // TODO: Implement backend endpoint for category ordering
    // For now, just return success to allow local reordering
    console.log(`Category order updated locally for ${type}:`, orderedNames);
    return { data: true, error: null, success: true };
  }

  // Helper methods for personalization
  static async hideCategoryForUser(categoryId: string): Promise<ApiResponse<boolean>> {
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  static async showCategoryForUser(categoryId: string): Promise<ApiResponse<boolean>> {
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  static async setCategoryOrderForUser(categoryId: string, order: number): Promise<ApiResponse<boolean>> {
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  // Payment Method operations
  static async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    return apiClient.get<PaymentMethod[]>('/payment-methods');
  }

  static async createPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id' | 'created_at'>): Promise<ApiResponse<PaymentMethod>> {
    return apiClient.post<PaymentMethod>('/payment-methods', paymentMethod);
  }

  static async deletePaymentMethod(name: string): Promise<ApiResponse<boolean>> {
    // This would need a new backend endpoint
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  static async updatePaymentMethodOrder(orderedNames: string[]): Promise<ApiResponse<boolean>> {
    // TODO: Implement backend endpoint for payment method ordering
    // For now, just return success to allow local reordering
    console.log('Payment method order updated locally:', orderedNames);
    return { data: true, error: null, success: true };
  }

  // Helper methods for payment method personalization
  static async hidePaymentMethodForUser(paymentMethodId: string): Promise<ApiResponse<boolean>> {
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  static async showPaymentMethodForUser(paymentMethodId: string): Promise<ApiResponse<boolean>> {
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  static async setPaymentMethodOrderForUser(paymentMethodId: string, order: number): Promise<ApiResponse<boolean>> {
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  // Health check (no auth required)
  static async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    
    try {
      const response = await fetch(`${API_URL}/health`);
      
      if (!response.ok) {
        return {
          data: null,
          error: `Health check failed with status ${response.status}`,
          success: false
        };
      }
      
      const data = await response.json();
      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false
      };
    }
  }

  // Batch operations
  static async batchCreateTransactions(transactions: Omit<Transaction, 'id' | 'created_at'>[]): Promise<ApiResponse<Transaction[]>> {
    // This would need a new backend endpoint
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  static async batchUpdateTransactions(updates: { id: string; data: Partial<Transaction> }[]): Promise<ApiResponse<boolean>> {
    // This would need a new backend endpoint
    return { data: null, error: 'Not implemented via API yet', success: false };
  }

  static async batchDeleteTransactions(ids: string[]): Promise<ApiResponse<boolean>> {
    // This would need a new backend endpoint
    return { data: null, error: 'Not implemented via API yet', success: false };
  }
}
