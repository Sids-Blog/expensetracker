import { Transaction } from './supabase';

export interface QueueOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'bulk_update';
  entity: 'transaction' | 'category' | 'payment_method';
  data?: any;
  entityId?: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class QueueManager {
  private static readonly QUEUE_KEY = 'offline_operations_queue';
  private static readonly MAX_RETRIES = 3;

  static async addOperation(operation: Omit<QueueOperation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>): Promise<void> {
    const queue = await this.getQueue();
    const newOperation: QueueOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
    };

    queue.push(newOperation);
    await this.saveQueue(queue);
  }

  static async getQueue(): Promise<QueueOperation[]> {
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading queue from localStorage:', error);
      return [];
    }
  }

  static async saveQueue(queue: QueueOperation[]): Promise<void> {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving queue to localStorage:', error);
    }
  }

  static async removeOperation(operationId: string): Promise<void> {
    const queue = await this.getQueue();
    const filteredQueue = queue.filter(op => op.id !== operationId);
    await this.saveQueue(filteredQueue);
  }

  static async incrementRetryCount(operationId: string): Promise<void> {
    const queue = await this.getQueue();
    const operation = queue.find(op => op.id === operationId);
    
    if (operation) {
      operation.retryCount += 1;
      await this.saveQueue(queue);
    }
  }

  static async clearQueue(): Promise<void> {
    await this.saveQueue([]);
  }

  static async getFailedOperations(): Promise<QueueOperation[]> {
    const queue = await this.getQueue();
    return queue.filter(op => op.retryCount >= op.maxRetries);
  }

  static async getPendingOperations(): Promise<QueueOperation[]> {
    const queue = await this.getQueue();
    return queue.filter(op => op.retryCount < op.maxRetries);
  }

  static async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  static async getOldestOperation(): Promise<QueueOperation | null> {
    const queue = await this.getQueue();
    if (queue.length === 0) return null;
    
    return queue.reduce((oldest, current) => 
      current.timestamp < oldest.timestamp ? current : oldest
    );
  }

  // Helper methods for specific operation types
  static async addTransactionCreate(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<void> {
    await this.addOperation({
      type: 'create',
      entity: 'transaction',
      data: transaction,
    });
  }

  static async addTransactionUpdate(id: string, updates: Partial<Transaction>): Promise<void> {
    await this.addOperation({
      type: 'update',
      entity: 'transaction',
      entityId: id,
      data: updates,
    });
  }

  static async addTransactionDelete(id: string): Promise<void> {
    await this.addOperation({
      type: 'delete',
      entity: 'transaction',
      entityId: id,
    });
  }

  static async addBulkUpdate(field: string, oldValue: string, newValue: string): Promise<void> {
    await this.addOperation({
      type: 'bulk_update',
      entity: 'transaction',
      data: { field, oldValue, newValue },
    });
  }

  static async addCategoryCreate(category: { name: string; type: 'expense' | 'income' }): Promise<void> {
    await this.addOperation({
      type: 'create',
      entity: 'category',
      data: category,
    });
  }

  static async addCategoryDelete(name: string, type: 'expense' | 'income'): Promise<void> {
    await this.addOperation({
      type: 'delete',
      entity: 'category',
      data: { name, type },
    });
  }

  static async addPaymentMethodCreate(paymentMethod: { name: string }): Promise<void> {
    await this.addOperation({
      type: 'create',
      entity: 'payment_method',
      data: paymentMethod,
    });
  }

  static async addPaymentMethodDelete(name: string): Promise<void> {
    await this.addOperation({
      type: 'delete',
      entity: 'payment_method',
      data: { name },
    });
  }
}