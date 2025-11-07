# Backend Service API Documentation

The Personal Finance Tracker includes a robust backend service layer that handles all database operations with proper error handling, offline support, and automatic synchronization.

## Architecture Overview

```
Frontend Components
       ↓
Enhanced Contexts (Data & Transactions)
       ↓
Backend Service (API Layer)
       ↓
Supabase Database
```

## Core Services

### 1. BackendService (`src/lib/backend-service.ts`)

The main API service that handles all database operations.

#### Transaction Operations

```typescript
// Create a new transaction
static async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<ApiResponse<Transaction>>

// Get all transactions
static async getTransactions(): Promise<ApiResponse<Transaction[]>>

// Update a transaction
static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<ApiResponse<Transaction>>

// Delete a transaction
static async deleteTransaction(id: string): Promise<ApiResponse<boolean>>

// Bulk update transactions (rename categories/payment methods)
static async bulkUpdateTransactions(field: 'category' | 'payment_method', oldValue: string, newValue: string): Promise<ApiResponse<boolean>>
```

#### Category Operations

```typescript
// Get all categories
static async getCategories(): Promise<ApiResponse<Category[]>>

// Create a new category
static async createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<ApiResponse<Category>>

// Delete a category
static async deleteCategory(name: string, type: 'expense' | 'income'): Promise<ApiResponse<boolean>>

// Update category order
static async updateCategoryOrder(type: 'expense' | 'income', orderedNames: string[]): Promise<ApiResponse<boolean>>
```

#### Payment Method Operations

```typescript
// Get all payment methods
static async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>>

// Create a new payment method
static async createPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id' | 'created_at'>): Promise<ApiResponse<PaymentMethod>>

// Delete a payment method
static async deletePaymentMethod(name: string): Promise<ApiResponse<boolean>>

// Update payment method order
static async updatePaymentMethodOrder(orderedNames: string[]): Promise<ApiResponse<boolean>>
```

#### Batch Operations

```typescript
// Create multiple transactions at once
static async batchCreateTransactions(transactions: Omit<Transaction, 'id' | 'created_at'>[]): Promise<ApiResponse<Transaction[]>>

// Update multiple transactions
static async batchUpdateTransactions(updates: { id: string; data: Partial<Transaction> }[]): Promise<ApiResponse<boolean>>

// Delete multiple transactions
static async batchDeleteTransactions(ids: string[]): Promise<ApiResponse<boolean>>
```

#### Health Check

```typescript
// Check backend health
static async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>>
```

### 2. QueueManager (`src/lib/queue-manager.ts`)

Manages offline operations queue for automatic synchronization.

#### Queue Operations

```typescript
// Add operation to queue
static async addOperation(operation: Omit<QueueOperation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>): Promise<void>

// Get all queued operations
static async getQueue(): Promise<QueueOperation[]>

// Remove operation from queue
static async removeOperation(operationId: string): Promise<void>

// Clear entire queue
static async clearQueue(): Promise<void>

// Get failed operations
static async getFailedOperations(): Promise<QueueOperation[]>

// Get pending operations
static async getPendingOperations(): Promise<QueueOperation[]>
```

#### Helper Methods

```typescript
// Add specific operation types
static async addTransactionCreate(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<void>
static async addTransactionUpdate(id: string, updates: Partial<Transaction>): Promise<void>
static async addTransactionDelete(id: string): Promise<void>
static async addBulkUpdate(field: string, oldValue: string, newValue: string): Promise<void>
static async addCategoryCreate(category: { name: string; type: 'expense' | 'income' }): Promise<void>
static async addCategoryDelete(name: string, type: 'expense' | 'income'): Promise<void>
static async addPaymentMethodCreate(paymentMethod: { name: string }): Promise<void>
static async addPaymentMethodDelete(name: string): Promise<void>
```

### 3. SyncService (`src/lib/sync-service.ts`)

Handles synchronization between offline queue and backend.

#### Sync Operations

```typescript
// Sync all pending operations
static async syncPendingOperations(): Promise<SyncResult>

// Get queue status
static async getQueueStatus(): Promise<{
  totalOperations: number;
  pendingOperations: number;
  failedOperations: number;
  oldestOperation: QueueOperation | null;
}>

// Clear failed operations
static async clearFailedOperations(): Promise<void>

// Retry failed operations
static async retryFailedOperations(): Promise<SyncResult>
```

#### Auto-Sync

```typescript
// Start automatic synchronization
static startAutoSync(intervalMs: number = 30000): void

// Stop automatic synchronization
static stopAutoSync(): void

// Setup network event listeners
static setupNetworkListeners(): void
```

## Enhanced Contexts

### EnhancedDataProvider (`src/lib/enhanced-data-context.tsx`)

Provides enhanced data management with offline support:

```typescript
interface EnhancedDataContextType {
  // Categories
  expenseCategories: string[];
  incomeCategories: string[];
  addExpenseCategory: (category: string) => Promise<void>;
  removeExpenseCategory: (category: string) => Promise<void>;
  addIncomeCategory: (category: string) => Promise<void>;
  removeIncomeCategory: (category: string) => Promise<void>;
  updateCategoryOrder: (type: 'expense' | 'income', orderedNames: string[]) => Promise<void>;

  // Payment Methods
  paymentMethods: string[];
  addPaymentMethod: (method: string) => Promise<void>;
  removePaymentMethod: (method: string) => Promise<void>;
  updatePaymentMethodOrder: (orderedNames: string[]) => Promise<void>;

  // State
  isLoading: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  syncPendingOperations: () => Promise<void>;
  getQueueStatus: () => Promise<{
    totalOperations: number;
    pendingOperations: number;
    failedOperations: number;
  }>;
}
```

### EnhancedTransactionProvider (`src/lib/enhanced-transaction-context.tsx`)

Provides enhanced transaction management with offline support:

```typescript
interface EnhancedTransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Transaction>;
  bulkRenameInTransactions: (field: 'category' | 'payment_method', oldValue: string, newValue: string) => Promise<void>;
  
  // State
  isLoading: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  isOffline: boolean;
  error: string | null;
  
  // Actions
  refreshTransactions: () => Promise<void>;
  syncPendingOperations: () => Promise<void>;
  getQueueStatus: () => Promise<{
    totalOperations: number;
    pendingOperations: number;
    failedOperations: number;
  }>;
}
```

## Error Handling

All backend operations return a standardized `ApiResponse<T>` format:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
```

## Offline Support

The backend service provides robust offline support:

1. **Automatic Queueing**: Operations are automatically queued when offline
2. **Local Storage**: Data is cached locally for offline access
3. **Auto-Sync**: Automatic synchronization when connection is restored
4. **Retry Logic**: Failed operations are retried with exponential backoff
5. **Conflict Resolution**: Handles conflicts during synchronization

## Usage Examples

### Basic Transaction Operations

```typescript
import { BackendService } from '@/lib/backend-service';

// Create a transaction
const result = await BackendService.createTransaction({
  date: '2024-01-15',
  type: 'expense',
  amount: 50.00,
  currency: 'USD',
  category: 'Food',
  description: 'Lunch',
  payment_method: 'Credit Card',
  fullySettled: true
});

if (result.success) {
  console.log('Transaction created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Using Enhanced Contexts

```typescript
import { useEnhancedTransactions } from '@/lib/enhanced-transaction-context';

function MyComponent() {
  const { 
    transactions, 
    addTransaction, 
    isOffline, 
    isSyncing 
  } = useEnhancedTransactions();

  const handleAddTransaction = async () => {
    try {
      await addTransaction({
        date: '2024-01-15',
        type: 'expense',
        amount: 25.00,
        currency: 'USD',
        category: 'Coffee',
        payment_method: 'Cash'
      });
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  return (
    <div>
      {isOffline && <div>Working offline</div>}
      {isSyncing && <div>Syncing...</div>}
      {/* Your component UI */}
    </div>
  );
}
```

### Monitoring Backend Status

```typescript
import { BackendStatus } from '@/components/BackendStatus';

function SettingsPage() {
  const { isOffline, isSyncing } = useEnhancedTransactions();

  return (
    <div>
      <BackendStatus isOffline={isOffline} isSyncing={isSyncing} />
      {/* Other settings */}
    </div>
  );
}
```

## Configuration

The backend service uses environment variables for configuration:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The backend expects the following Supabase tables:

### transactions
```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT,
  fully_settled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### categories
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, type)
);
```

### payment_methods
```sql
CREATE TABLE payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Optional Views and Functions

The schema also includes helpful views and functions:

#### transaction_stats (View)
Provides aggregated transaction statistics by month, type, and category.

#### monthly_summary (View)
Provides monthly financial summaries with income, expenses, and net amounts.

#### get_category_stats (Function)
Returns category statistics with optional date and type filtering.

```sql
SELECT * FROM get_category_stats('2024-01-01', '2024-12-31', 'expense');
```

## Best Practices

1. **Always check the response**: Check `result.success` before using `result.data`
2. **Handle offline scenarios**: Use the enhanced contexts for automatic offline handling
3. **Monitor sync status**: Use the BackendStatus component to monitor sync operations
4. **Batch operations**: Use batch methods for multiple operations to improve performance
5. **Error handling**: Implement proper error handling and user feedback
6. **Local caching**: The system automatically caches data locally for offline access