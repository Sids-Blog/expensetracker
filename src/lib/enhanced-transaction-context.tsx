import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction } from './supabase';
import { BackendService } from './backend-service';
import { QueueManager } from './queue-manager';
import { SyncService } from './sync-service';
import { useToast } from '@/hooks/use-toast';

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

const EnhancedTransactionContext = createContext<EnhancedTransactionContextType | undefined>(undefined);

export const useEnhancedTransactions = () => {
  const context = useContext(EnhancedTransactionContext);
  if (!context) {
    throw new Error('useEnhancedTransactions must be used within an EnhancedTransactionProvider');
  }
  return context;
};

export const EnhancedTransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      setIsOffline(false);
      syncPendingOperations();
    };
    
    const handleOffline = () => {
      setIsConnected(false);
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load transactions on mount
  useEffect(() => {
    refreshTransactions();
  }, []);

  const refreshTransactions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOffline) {
        // Load from localStorage when offline
        const storedTransactions = localStorage.getItem('transactions');
        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions));
        }
      } else {
        // Load from backend when online
        const result = await BackendService.getTransactions();
        
        if (result.success && result.data) {
          setTransactions(result.data);
          // Cache in localStorage
          localStorage.setItem('transactions', JSON.stringify(result.data));
          setIsConnected(true);
        } else {
          setError(result.error || 'Failed to load transactions');
          setIsConnected(false);
          
          // Fallback to localStorage
          const storedTransactions = localStorage.getItem('transactions');
          if (storedTransactions) {
            setTransactions(JSON.parse(storedTransactions));
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load transactions';
      setError(errorMessage);
      setIsConnected(false);
      
      // Fallback to localStorage
      const storedTransactions = localStorage.getItem('transactions');
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
      
      toast({
        variant: "destructive",
        title: "Error Loading Transactions",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncPendingOperations = async () => {
    if (isOffline) return;
    
    setIsSyncing(true);
    try {
      const result = await SyncService.syncPendingOperations();
      
      if (result.success) {
        if (result.processedOperations > 0) {
          toast({
            title: "Sync Complete",
            description: `Successfully synced ${result.processedOperations} operations`,
          });
          await refreshTransactions(); // Refresh data after successful sync
        }
      } else {
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: `Failed to sync ${result.failedOperations} operations`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: error instanceof Error ? error.message : 'Unknown sync error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at'>) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOffline) {
        // Create temporary transaction for offline use
        const tempTransaction: Transaction = {
          ...transactionData,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
        };

        // Add to queue for later sync
        await QueueManager.addTransactionCreate(transactionData);
        
        // Update local state
        const updatedTransactions = [tempTransaction, ...transactions];
        setTransactions(updatedTransactions);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        
        toast({
          title: "Transaction Queued",
          description: "Transaction will be saved when you're back online",
        });
      } else {
        // Add directly to backend
        const result = await BackendService.createTransaction(transactionData);
        
        if (result.success && result.data) {
          const updatedTransactions = [result.data, ...transactions];
          setTransactions(updatedTransactions);
          localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
          
          toast({
            title: "Transaction Added",
            description: "Transaction saved successfully",
          });
        } else {
          throw new Error(result.error || 'Failed to add transaction');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add transaction';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeTransaction = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOffline) {
        // Add to queue for later sync (only if not a temp transaction)
        if (!id.startsWith('temp_')) {
          await QueueManager.addTransactionDelete(id);
        }
        
        // Update local state
        const updatedTransactions = transactions.filter(t => t.id !== id);
        setTransactions(updatedTransactions);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        
        toast({
          title: "Transaction Queued for Deletion",
          description: "Transaction will be removed when you're back online",
        });
      } else {
        // Remove directly from backend
        const result = await BackendService.deleteTransaction(id);
        
        if (result.success) {
          const updatedTransactions = transactions.filter(t => t.id !== id);
          setTransactions(updatedTransactions);
          localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
          
          toast({
            title: "Transaction Deleted",
            description: "Transaction removed successfully",
          });
        } else {
          throw new Error(result.error || 'Failed to remove transaction');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove transaction';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOffline) {
        // Add to queue for later sync (only if not a temp transaction)
        if (!id.startsWith('temp_')) {
          await QueueManager.addTransactionUpdate(id, updates);
        }
        
        // Update local state
        const updatedTransactions = transactions.map(t => 
          t.id === id ? { ...t, ...updates } : t
        );
        setTransactions(updatedTransactions);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        
        const updatedTransaction = updatedTransactions.find(t => t.id === id)!;
        
        toast({
          title: "Transaction Queued for Update",
          description: "Changes will be saved when you're back online",
        });
        
        return updatedTransaction;
      } else {
        // Update directly in backend
        const result = await BackendService.updateTransaction(id, updates);
        
        if (result.success && result.data) {
          const updatedTransactions = transactions.map(t => 
            t.id === id ? { ...t, ...updates } : t
          );
          setTransactions(updatedTransactions);
          localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
          
          toast({
            title: "Transaction Updated",
            description: "Changes saved successfully",
          });
          
          return result.data;
        } else {
          throw new Error(result.error || 'Failed to update transaction');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update transaction';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkRenameInTransactions = async (field: 'category' | 'payment_method', oldValue: string, newValue: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOffline) {
        // Add to queue for later sync
        await QueueManager.addBulkUpdate(field, oldValue, newValue);
        
        // Update local state
        const updatedTransactions = transactions.map(t => 
          t[field] === oldValue ? { ...t, [field]: newValue } : t
        );
        setTransactions(updatedTransactions);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        
        toast({
          title: "Bulk Update Queued",
          description: "Changes will be saved when you're back online",
        });
      } else {
        // Update directly in backend
        const result = await BackendService.bulkUpdateTransactions(field, oldValue, newValue);
        
        if (result.success) {
          const updatedTransactions = transactions.map(t => 
            t[field] === oldValue ? { ...t, [field]: newValue } : t
          );
          setTransactions(updatedTransactions);
          localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
          
          toast({
            title: "Bulk Update Complete",
            description: `Updated all transactions with ${field} "${oldValue}" to "${newValue}"`,
          });
        } else {
          throw new Error(result.error || 'Failed to bulk update transactions');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update transactions';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getQueueStatus = async () => {
    const status = await SyncService.getQueueStatus();
    return {
      totalOperations: status.totalOperations,
      pendingOperations: status.pendingOperations,
      failedOperations: status.failedOperations,
    };
  };

  const value: EnhancedTransactionContextType = {
    transactions,
    addTransaction,
    removeTransaction,
    updateTransaction,
    bulkRenameInTransactions,
    isLoading,
    isConnected,
    isSyncing,
    isOffline,
    error,
    refreshTransactions,
    syncPendingOperations,
    getQueueStatus,
  };

  return (
    <EnhancedTransactionContext.Provider value={value}>
      {children}
    </EnhancedTransactionContext.Provider>
  );
};