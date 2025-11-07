# Backend Integration Guide

This guide shows how to integrate the enhanced backend service into your existing Personal Finance Tracker application.

## Quick Start

### 1. Replace Existing Contexts

To use the enhanced backend, replace the existing contexts in your `App.tsx`:

```typescript
// Before (using legacy contexts)
import { DataProvider } from "@/lib/data-context";
import { TransactionProvider } from "@/lib/transaction-context";

// After (using enhanced contexts)
import { EnhancedDataProvider } from "@/lib/enhanced-data-context";
import { EnhancedTransactionProvider } from "@/lib/enhanced-transaction-context";

const App = () => (
  <CurrencyProvider>
    <EnhancedDataProvider>
      <EnhancedTransactionProvider>
        <TooltipProvider>
          {/* Your app content */}
        </TooltipProvider>
      </EnhancedTransactionProvider>
    </EnhancedDataProvider>
  </CurrencyProvider>
);
```

### 2. Update Hook Imports

Update your components to use the enhanced hooks:

```typescript
// Before
import { useData } from "@/lib/data-context";
import { useTransactions } from "@/lib/transaction-context";

// After
import { useEnhancedData } from "@/lib/enhanced-data-context";
import { useEnhancedTransactions } from "@/lib/enhanced-transaction-context";
```

### 3. Add Backend Monitoring

Add the BackendStatus component to your settings page:

```typescript
import { BackendStatus } from "@/components/BackendStatus";

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

## Migration Steps

### Step 1: Gradual Migration

You can migrate gradually by using both contexts side by side:

```typescript
// Use both contexts during migration
import { useData } from "@/lib/data-context";
import { useEnhancedData } from "@/lib/enhanced-data-context";

function MyComponent() {
  // Legacy data (for comparison/fallback)
  const legacyData = useData();
  
  // Enhanced data (new features)
  const enhancedData = useEnhancedData();
  
  // Use enhanced data for new features, legacy for existing
  const categories = enhancedData.expenseCategories;
  const isOffline = enhancedData.isOffline;
  
  return (
    <div>
      {isOffline && <div>Working offline</div>}
      {/* Your component */}
    </div>
  );
}
```

### Step 2: Update Component Props

The enhanced contexts provide additional state properties:

```typescript
// New properties available
const {
  // Existing properties
  expenseCategories,
  incomeCategories,
  paymentMethods,
  addExpenseCategory,
  // ... other methods
  
  // New properties
  isOffline,        // Network status
  isSyncing,        // Sync status
  error,            // Error state
  syncPendingOperations,  // Manual sync
  getQueueStatus,   // Queue monitoring
} = useEnhancedData();
```

### Step 3: Handle Offline States

Update your UI to handle offline states:

```typescript
function TransactionForm() {
  const { addTransaction, isOffline, isSyncing } = useEnhancedTransactions();
  
  const handleSubmit = async (data) => {
    try {
      await addTransaction(data);
      // Success handled automatically by context
    } catch (error) {
      // Error handled automatically by context
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {isOffline && (
        <div className="bg-yellow-100 p-2 rounded mb-4">
          Working offline - changes will sync when online
        </div>
      )}
      
      {isSyncing && (
        <div className="bg-blue-100 p-2 rounded mb-4">
          Syncing changes...
        </div>
      )}
      
      {/* Your form fields */}
      
      <button type="submit" disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'Add Transaction'}
      </button>
    </form>
  );
}
```

## Advanced Usage

### Direct Backend Service Usage

For advanced use cases, you can use the BackendService directly:

```typescript
import { BackendService } from "@/lib/backend-service";

async function customOperation() {
  // Health check
  const health = await BackendService.healthCheck();
  if (!health.success) {
    console.error('Backend unhealthy:', health.error);
    return;
  }
  
  // Batch operations
  const transactions = [
    { date: '2024-01-01', type: 'expense', amount: 10, currency: 'USD', category: 'Food' },
    { date: '2024-01-02', type: 'expense', amount: 20, currency: 'USD', category: 'Transport' },
  ];
  
  const result = await BackendService.batchCreateTransactions(transactions);
  if (result.success) {
    console.log('Batch created:', result.data);
  }
}
```

### Queue Management

Monitor and manage the offline queue:

```typescript
import { QueueManager } from "@/lib/queue-manager";
import { SyncService } from "@/lib/sync-service";

async function queueManagement() {
  // Get queue status
  const status = await SyncService.getQueueStatus();
  console.log('Queue status:', status);
  
  // Manual sync
  const syncResult = await SyncService.syncPendingOperations();
  console.log('Sync result:', syncResult);
  
  // Clear failed operations
  if (status.failedOperations > 0) {
    await SyncService.clearFailedOperations();
  }
}
```

### Custom Sync Logic

Implement custom synchronization logic:

```typescript
import { SyncService } from "@/lib/sync-service";

// Start auto-sync with custom interval (default is 30 seconds)
SyncService.startAutoSync(60000); // Sync every minute

// Setup custom network listeners
window.addEventListener('online', async () => {
  console.log('Back online, syncing...');
  const result = await SyncService.syncPendingOperations();
  console.log('Sync completed:', result);
});
```

## Error Handling

The enhanced backend provides comprehensive error handling:

```typescript
function MyComponent() {
  const { addTransaction, error } = useEnhancedTransactions();
  
  const handleAdd = async (data) => {
    try {
      await addTransaction(data);
      // Success toast shown automatically
    } catch (error) {
      // Error toast shown automatically
      // Additional custom error handling if needed
      console.error('Custom error handling:', error);
    }
  };
  
  return (
    <div>
      {error && (
        <div className="bg-red-100 p-2 rounded mb-4">
          Error: {error}
        </div>
      )}
      {/* Your component */}
    </div>
  );
}
```

## Performance Optimization

### Batch Operations

Use batch operations for better performance:

```typescript
// Instead of multiple single operations
for (const transaction of transactions) {
  await BackendService.createTransaction(transaction);
}

// Use batch operation
await BackendService.batchCreateTransactions(transactions);
```

### Local Caching

The enhanced contexts automatically cache data locally:

```typescript
// Data is automatically cached in localStorage
// No additional code needed for basic caching

// For custom caching logic, access localStorage directly
const cachedData = localStorage.getItem('transactions');
if (cachedData) {
  const transactions = JSON.parse(cachedData);
  // Use cached data
}
```

## Testing

### Mock Backend Service

For testing, you can mock the BackendService:

```typescript
// In your test file
jest.mock('@/lib/backend-service', () => ({
  BackendService: {
    createTransaction: jest.fn().mockResolvedValue({
      success: true,
      data: { id: '1', /* transaction data */ },
      error: null
    }),
    getTransactions: jest.fn().mockResolvedValue({
      success: true,
      data: [/* transaction array */],
      error: null
    }),
    // ... other methods
  }
}));
```

### Test Offline Scenarios

```typescript
// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false // Simulate offline
});

// Test offline behavior
const { result } = renderHook(() => useEnhancedTransactions());
// ... test offline functionality
```

## Troubleshooting

### Common Issues

1. **Queue not syncing**: Check network connectivity and backend health
2. **Duplicate operations**: Ensure proper cleanup of event listeners
3. **Memory leaks**: Stop auto-sync when components unmount
4. **Stale data**: Use refreshData() method to force refresh

### Debug Mode

Enable debug logging:

```typescript
// Add to your main.tsx or App.tsx
if (import.meta.env.DEV) {
  // Enable debug logging
  window.addEventListener('online', () => console.log('Online'));
  window.addEventListener('offline', () => console.log('Offline'));
}
```

### Health Monitoring

Use the BackendStatus component for real-time monitoring:

```typescript
import { BackendStatus } from "@/components/BackendStatus";

// Add to your admin/settings page
<BackendStatus isOffline={isOffline} isSyncing={isSyncing} />
```

This component provides:
- Real-time connection status
- Queue monitoring
- Manual sync controls
- Failed operation management
- Backend health checks