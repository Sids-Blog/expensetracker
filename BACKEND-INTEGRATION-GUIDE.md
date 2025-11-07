# Backend Integration Guide

## Overview

This guide shows how to integrate the Next.js backend API with your React frontend for enhanced security.

## Why Use a Backend API?

### Current Setup (Direct Supabase):
```
React App → Supabase Database
  ↓
  Uses anon key (public)
  RLS policies protect data
```

### With Backend API:
```
React App → Next.js API → Supabase Database
              ↓
           Validates
           Authenticates  
           Uses service key (secret)
```

### Benefits:

1. **Service Role Key Hidden** - Never exposed to frontend
2. **Server-Side Validation** - Can't be bypassed
3. **Better Logging** - Track all API calls
4. **Rate Limiting** - Prevent abuse
5. **Custom Business Logic** - Easy to add
6. **Caching** - Improve performance

## Setup Steps

### 1. Deploy Backend to Vercel

```bash
cd backend
npm install
npm run build

# Deploy to Vercel
vercel
```

Get your backend URL: `https://your-backend.vercel.app`

### 2. Update Frontend Environment

Add to your frontend `.env`:

```env
VITE_API_URL=https://your-backend.vercel.app/api
# Keep these for auth
VITE_SUPABASE_URL=https://qioipnpbecxnmmlymxet.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Create API Client

Create `src/lib/api-client.ts`:

```typescript
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; success: boolean }> {
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
        error: result.error || 'Request failed',
        success: false
      };
    }

    return result;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  
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
```

### 4. Update Backend Service

Update `src/lib/backend-service.ts`:

```typescript
import { apiClient } from './api-client';
import { Transaction, Category, PaymentMethod } from './supabase';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export class BackendService {
  // Transactions
  static async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    return apiClient.get<Transaction[]>('/transactions');
  }

  static async createTransaction(
    transaction: Omit<Transaction, 'id' | 'created_at'>
  ): Promise<ApiResponse<Transaction>> {
    return apiClient.post<Transaction>('/transactions', transaction);
  }

  static async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<ApiResponse<Transaction>> {
    return apiClient.patch<Transaction>(`/transactions/${id}`, updates);
  }

  static async deleteTransaction(id: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(`/transactions/${id}`);
  }

  // Categories
  static async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/categories');
  }

  static async createCategory(
    category: Omit<Category, 'id' | 'created_at'>
  ): Promise<ApiResponse<Category>> {
    return apiClient.post<Category>('/categories', category);
  }

  // Payment Methods
  static async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    return apiClient.get<PaymentMethod[]>('/payment-methods');
  }

  static async createPaymentMethod(
    method: Omit<PaymentMethod, 'id' | 'created_at'>
  ): Promise<ApiResponse<PaymentMethod>> {
    return apiClient.post<PaymentMethod>('/payment-methods', method);
  }

  // Admin
  static async getAllUsers(): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>('/admin/users');
  }

  static async activateUser(userId: string): Promise<ApiResponse<boolean>> {
    return apiClient.post<boolean>(`/admin/users/${userId}/activate`, {});
  }

  static async deactivateUser(userId: string): Promise<ApiResponse<boolean>> {
    return apiClient.post<boolean>(`/admin/users/${userId}/deactivate`, {});
  }
}
```

### 5. Test the Integration

```typescript
// Test in browser console
import { BackendService } from './lib/backend-service';

// Get transactions
const result = await BackendService.getTransactions();
console.log(result);

// Create transaction
const newTransaction = await BackendService.createTransaction({
  date: '2024-01-01',
  type: 'expense',
  amount: 50,
  currency: 'USD',
  category: 'Food',
  description: 'Test'
});
console.log(newTransaction);
```

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

Keep both direct Supabase and API backend:

```typescript
// Use API for sensitive operations
const USE_API = true;

static async createTransaction(transaction) {
  if (USE_API) {
    return apiClient.post('/transactions', transaction);
  } else {
    return supabase.from('transactions').insert(transaction);
  }
}
```

### Option 2: Full Migration

Replace all Supabase calls with API calls at once.

## Security Comparison

| Aspect | Direct Supabase | With Backend API |
|--------|----------------|------------------|
| **Service Key** | ❌ Can't use (would expose) | ✅ Hidden on server |
| **Validation** | ⚠️ Client-side only | ✅ Server-side enforced |
| **Rate Limiting** | ⚠️ Limited control | ✅ Full control |
| **Logging** | ⚠️ Basic | ✅ Detailed |
| **Custom Logic** | ❌ Need Edge Functions | ✅ Native Next.js |
| **RLS** | ✅ Database level | ✅ + Server validation |

## Performance Considerations

### Latency:
- **Direct**: ~50-100ms
- **Via API**: ~100-200ms (adds one hop)

### Caching:
Backend API can cache responses:

```typescript
// In backend API route
const cached = await redis.get(`transactions:${user.id}`);
if (cached) return Response.json(cached);
```

### Optimization:
- Use API for writes (security critical)
- Use direct Supabase for reads (faster)

## Cost

### Direct Supabase Only:
- Supabase: Free tier
- **Total: $0/month**

### With Backend API:
- Supabase: Free tier
- Vercel: Free tier (100GB bandwidth)
- **Total: $0/month** (for personal use)

## Monitoring

Add to backend:

```typescript
// lib/monitoring.ts
export function logApiCall(user: string, endpoint: string, duration: number) {
  console.log({
    timestamp: new Date().toISOString(),
    user,
    endpoint,
    duration,
  });
}
```

## Troubleshooting

### CORS Errors

Update `backend/next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://your-frontend.vercel.app' },
        // ...
      ],
    },
  ];
}
```

### 401 Unauthorized

Check:
1. Token is being sent: `Authorization: Bearer <token>`
2. Token is valid (not expired)
3. User is active in database

### 500 Internal Server Error

Check backend logs in Vercel dashboard.

## Rollback Plan

If issues occur, revert to direct Supabase:

```typescript
// Set USE_API = false
const USE_API = false;

// Or remove API_URL from .env
// Falls back to direct Supabase
```

## Next Steps

1. ✅ Deploy backend to Vercel
2. ✅ Update frontend to use API client
3. ✅ Test all operations
4. ✅ Monitor for errors
5. ✅ Add rate limiting (optional)
6. ✅ Add caching (optional)
7. ✅ Add analytics (optional)

## Recommendation

**For personal use**: Direct Supabase is fine (RLS protects your data)

**For production/public**: Use backend API for:
- Better security
- Server-side validation
- Rate limiting
- Detailed logging
- Custom business logic

Choose based on your needs!
