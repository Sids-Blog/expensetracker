import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAccessToken();
    
    if (!token) {
      return { data: null, error: 'Not authenticated', success: false };
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: result.error || `Request failed with status ${response.status}`,
        success: false
      };
    }

    return result;
  } catch (error) {
    console.error('API request error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error occurred',
      success: false
    };
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  patch: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};
