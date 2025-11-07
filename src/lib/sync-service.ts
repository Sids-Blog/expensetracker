import { BackendService } from './backend-service';
import { QueueManager, QueueOperation } from './queue-manager';

export interface SyncResult {
  success: boolean;
  processedOperations: number;
  failedOperations: number;
  errors: string[];
}

export class SyncService {
  private static isOnline(): boolean {
    return navigator.onLine;
  }

  static async syncPendingOperations(): Promise<SyncResult> {
    if (!this.isOnline()) {
      return {
        success: false,
        processedOperations: 0,
        failedOperations: 0,
        errors: ['Device is offline'],
      };
    }

    const pendingOperations = await QueueManager.getPendingOperations();
    let processedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const operation of pendingOperations) {
      try {
        const result = await this.processOperation(operation);
        
        if (result.success) {
          await QueueManager.removeOperation(operation.id);
          processedCount++;
        } else {
          await QueueManager.incrementRetryCount(operation.id);
          failedCount++;
          if (result.error) {
            errors.push(`Operation ${operation.id}: ${result.error}`);
          }
        }
      } catch (error) {
        await QueueManager.incrementRetryCount(operation.id);
        failedCount++;
        errors.push(`Operation ${operation.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: failedCount === 0,
      processedOperations: processedCount,
      failedOperations: failedCount,
      errors,
    };
  }

  private static async processOperation(operation: QueueOperation): Promise<{ success: boolean; error?: string }> {
    switch (operation.entity) {
      case 'transaction':
        return this.processTransactionOperation(operation);
      case 'category':
        return this.processCategoryOperation(operation);
      case 'payment_method':
        return this.processPaymentMethodOperation(operation);
      default:
        return { success: false, error: `Unknown entity type: ${operation.entity}` };
    }
  }

  private static async processTransactionOperation(operation: QueueOperation): Promise<{ success: boolean; error?: string }> {
    switch (operation.type) {
      case 'create':
        const createResult = await BackendService.createTransaction(operation.data);
        return { success: createResult.success, error: createResult.error || undefined };

      case 'update':
        if (!operation.entityId) {
          return { success: false, error: 'Missing entity ID for update operation' };
        }
        const updateResult = await BackendService.updateTransaction(operation.entityId, operation.data);
        return { success: updateResult.success, error: updateResult.error || undefined };

      case 'delete':
        if (!operation.entityId) {
          return { success: false, error: 'Missing entity ID for delete operation' };
        }
        const deleteResult = await BackendService.deleteTransaction(operation.entityId);
        return { success: deleteResult.success, error: deleteResult.error || undefined };

      case 'bulk_update':
        const { field, oldValue, newValue } = operation.data;
        const bulkResult = await BackendService.bulkUpdateTransactions(field, oldValue, newValue);
        return { success: bulkResult.success, error: bulkResult.error || undefined };

      default:
        return { success: false, error: `Unknown transaction operation type: ${operation.type}` };
    }
  }

  private static async processCategoryOperation(operation: QueueOperation): Promise<{ success: boolean; error?: string }> {
    switch (operation.type) {
      case 'create':
        const createResult = await BackendService.createCategory(operation.data);
        return { success: createResult.success, error: createResult.error || undefined };

      case 'delete':
        const { name, type } = operation.data;
        const deleteResult = await BackendService.deleteCategory(name, type);
        return { success: deleteResult.success, error: deleteResult.error || undefined };

      default:
        return { success: false, error: `Unknown category operation type: ${operation.type}` };
    }
  }

  private static async processPaymentMethodOperation(operation: QueueOperation): Promise<{ success: boolean; error?: string }> {
    switch (operation.type) {
      case 'create':
        const createResult = await BackendService.createPaymentMethod(operation.data);
        return { success: createResult.success, error: createResult.error || undefined };

      case 'delete':
        const { name } = operation.data;
        const deleteResult = await BackendService.deletePaymentMethod(name);
        return { success: deleteResult.success, error: deleteResult.error || undefined };

      default:
        return { success: false, error: `Unknown payment method operation type: ${operation.type}` };
    }
  }

  static async getQueueStatus(): Promise<{
    totalOperations: number;
    pendingOperations: number;
    failedOperations: number;
    oldestOperation: QueueOperation | null;
  }> {
    const totalOperations = await QueueManager.getQueueSize();
    const pendingOperations = (await QueueManager.getPendingOperations()).length;
    const failedOperations = (await QueueManager.getFailedOperations()).length;
    const oldestOperation = await QueueManager.getOldestOperation();

    return {
      totalOperations,
      pendingOperations,
      failedOperations,
      oldestOperation,
    };
  }

  static async clearFailedOperations(): Promise<void> {
    const queue = await QueueManager.getQueue();
    const validOperations = queue.filter(op => op.retryCount < op.maxRetries);
    await QueueManager.saveQueue(validOperations);
  }

  static async retryFailedOperations(): Promise<SyncResult> {
    const failedOperations = await QueueManager.getFailedOperations();
    
    // Reset retry count for failed operations
    for (const operation of failedOperations) {
      operation.retryCount = 0;
    }
    
    const queue = await QueueManager.getQueue();
    await QueueManager.saveQueue(queue);

    // Now sync them
    return this.syncPendingOperations();
  }

  // Auto-sync functionality
  private static syncInterval: NodeJS.Timeout | null = null;

  static startAutoSync(intervalMs: number = 30000): void {
    this.stopAutoSync();
    
    this.syncInterval = setInterval(async () => {
      if (this.isOnline()) {
        try {
          await this.syncPendingOperations();
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    }, intervalMs);
  }

  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Event listeners for online/offline status
  static setupNetworkListeners(): void {
    window.addEventListener('online', async () => {
      console.log('Device came online, syncing pending operations...');
      try {
        const result = await this.syncPendingOperations();
        console.log('Sync result:', result);
      } catch (error) {
        console.error('Sync on reconnect failed:', error);
      }
    });

    window.addEventListener('offline', () => {
      console.log('Device went offline, operations will be queued');
    });
  }
}