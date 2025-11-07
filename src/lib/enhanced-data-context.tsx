import React, { createContext, useContext, useEffect, useState } from 'react';
import { BackendService } from './backend-service';
import { QueueManager } from './queue-manager';
import { SyncService } from './sync-service';
import { useToast } from '@/hooks/use-toast';

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

const EnhancedDataContext = createContext<EnhancedDataContextType | undefined>(undefined);

export const useEnhancedData = () => {
  const context = useContext(EnhancedDataContext);
  if (!context) {
    throw new Error('useEnhancedData must be used within an EnhancedDataProvider');
  }
  return context;
};

export const EnhancedDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncPendingOperations();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup sync service network listeners
    SyncService.setupNetworkListeners();
    
    // Start auto-sync
    SyncService.startAutoSync(30000); // Sync every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      SyncService.stopAutoSync();
    };
  }, []);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOffline) {
        // Load from localStorage when offline
        const storedCategories = localStorage.getItem('categories');
        const storedPaymentMethods = localStorage.getItem('payment_methods');
        
        if (storedCategories) {
          const categories = JSON.parse(storedCategories);
          setExpenseCategories(categories.filter((c: any) => c.type === 'expense').map((c: any) => c.name));
          setIncomeCategories(categories.filter((c: any) => c.type === 'income').map((c: any) => c.name));
        }
        
        if (storedPaymentMethods) {
          const methods = JSON.parse(storedPaymentMethods);
          setPaymentMethods(methods.map((m: any) => m.name));
        }
      } else {
        // Load from backend when online
        const [categoriesResult, paymentMethodsResult] = await Promise.all([
          BackendService.getCategories(),
          BackendService.getPaymentMethods(),
        ]);

        if (categoriesResult.success && categoriesResult.data) {
          const categories = categoriesResult.data;
          setExpenseCategories(categories.filter(c => c.type === 'expense').map(c => c.name));
          setIncomeCategories(categories.filter(c => c.type === 'income').map(c => c.name));
          
          // Cache in localStorage
          localStorage.setItem('categories', JSON.stringify(categories));
        } else if (categoriesResult.error) {
          setError(categoriesResult.error);
        }

        if (paymentMethodsResult.success && paymentMethodsResult.data) {
          const methods = paymentMethodsResult.data;
          setPaymentMethods(methods.map(m => m.name));
          
          // Cache in localStorage
          localStorage.setItem('payment_methods', JSON.stringify(methods));
        } else if (paymentMethodsResult.error) {
          setError(paymentMethodsResult.error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Loading Data",
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
          await refreshData(); // Refresh data after successful sync
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

  // Category operations
  const addExpenseCategory = async (category: string) => {
    if (!category.trim() || expenseCategories.includes(category)) {
      toast({
        variant: "destructive",
        title: "Invalid Category",
        description: "Category already exists or is empty",
      });
      return;
    }

    try {
      if (isOffline) {
        // Add to queue for later sync
        await QueueManager.addCategoryCreate({ name: category, type: 'expense' });
        setExpenseCategories(prev => [...prev, category]);
        
        toast({
          title: "Category Queued",
          description: "Category will be added when you're back online",
        });
      } else {
        // Add directly to backend
        const result = await BackendService.createCategory({ name: category, type: 'expense' });
        
        if (result.success) {
          setExpenseCategories(prev => [...prev, category]);
          toast({
            title: "Category Added",
            description: `Successfully added "${category}"`,
          });
        } else {
          throw new Error(result.error || 'Failed to add category');
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add category',
      });
    }
  };

  const removeExpenseCategory = async (category: string) => {
    try {
      if (isOffline) {
        // Add to queue for later sync
        await QueueManager.addCategoryDelete(category, 'expense');
        setExpenseCategories(prev => prev.filter(c => c !== category));
        
        toast({
          title: "Category Queued for Deletion",
          description: "Category will be removed when you're back online",
        });
      } else {
        // Remove directly from backend
        const result = await BackendService.deleteCategory(category, 'expense');
        
        if (result.success) {
          setExpenseCategories(prev => prev.filter(c => c !== category));
          toast({
            title: "Category Removed",
            description: `Successfully removed "${category}"`,
          });
        } else {
          throw new Error(result.error || 'Failed to remove category');
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to remove category',
      });
    }
  };

  const addIncomeCategory = async (category: string) => {
    if (!category.trim() || incomeCategories.includes(category)) {
      toast({
        variant: "destructive",
        title: "Invalid Category",
        description: "Category already exists or is empty",
      });
      return;
    }

    try {
      if (isOffline) {
        await QueueManager.addCategoryCreate({ name: category, type: 'income' });
        setIncomeCategories(prev => [...prev, category]);
        
        toast({
          title: "Category Queued",
          description: "Category will be added when you're back online",
        });
      } else {
        const result = await BackendService.createCategory({ name: category, type: 'income' });
        
        if (result.success) {
          setIncomeCategories(prev => [...prev, category]);
          toast({
            title: "Category Added",
            description: `Successfully added "${category}"`,
          });
        } else {
          throw new Error(result.error || 'Failed to add category');
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add category',
      });
    }
  };

  const removeIncomeCategory = async (category: string) => {
    try {
      if (isOffline) {
        await QueueManager.addCategoryDelete(category, 'income');
        setIncomeCategories(prev => prev.filter(c => c !== category));
        
        toast({
          title: "Category Queued for Deletion",
          description: "Category will be removed when you're back online",
        });
      } else {
        const result = await BackendService.deleteCategory(category, 'income');
        
        if (result.success) {
          setIncomeCategories(prev => prev.filter(c => c !== category));
          toast({
            title: "Category Removed",
            description: `Successfully removed "${category}"`,
          });
        } else {
          throw new Error(result.error || 'Failed to remove category');
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to remove category',
      });
    }
  };

  const updateCategoryOrder = async (type: 'expense' | 'income', orderedNames: string[]) => {
    try {
      const result = await BackendService.updateCategoryOrder(type, orderedNames);
      
      if (result.success) {
        if (type === 'expense') {
          setExpenseCategories(orderedNames);
        } else {
          setIncomeCategories(orderedNames);
        }
      } else {
        throw new Error(result.error || 'Failed to update category order');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update category order',
      });
    }
  };

  // Payment method operations
  const addPaymentMethod = async (method: string) => {
    if (!method.trim() || paymentMethods.includes(method)) {
      toast({
        variant: "destructive",
        title: "Invalid Payment Method",
        description: "Payment method already exists or is empty",
      });
      return;
    }

    try {
      if (isOffline) {
        await QueueManager.addPaymentMethodCreate({ name: method });
        setPaymentMethods(prev => [...prev, method]);
        
        toast({
          title: "Payment Method Queued",
          description: "Payment method will be added when you're back online",
        });
      } else {
        const result = await BackendService.createPaymentMethod({ name: method });
        
        if (result.success) {
          setPaymentMethods(prev => [...prev, method]);
          toast({
            title: "Payment Method Added",
            description: `Successfully added "${method}"`,
          });
        } else {
          throw new Error(result.error || 'Failed to add payment method');
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add payment method',
      });
    }
  };

  const removePaymentMethod = async (method: string) => {
    try {
      if (isOffline) {
        await QueueManager.addPaymentMethodDelete(method);
        setPaymentMethods(prev => prev.filter(m => m !== method));
        
        toast({
          title: "Payment Method Queued for Deletion",
          description: "Payment method will be removed when you're back online",
        });
      } else {
        const result = await BackendService.deletePaymentMethod(method);
        
        if (result.success) {
          setPaymentMethods(prev => prev.filter(m => m !== method));
          toast({
            title: "Payment Method Removed",
            description: `Successfully removed "${method}"`,
          });
        } else {
          throw new Error(result.error || 'Failed to remove payment method');
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to remove payment method',
      });
    }
  };

  const updatePaymentMethodOrder = async (orderedNames: string[]) => {
    try {
      const result = await BackendService.updatePaymentMethodOrder(orderedNames);
      
      if (result.success) {
        setPaymentMethods(orderedNames);
      } else {
        throw new Error(result.error || 'Failed to update payment method order');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update payment method order',
      });
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

  const value: EnhancedDataContextType = {
    expenseCategories,
    incomeCategories,
    paymentMethods,
    addExpenseCategory,
    removeExpenseCategory,
    addIncomeCategory,
    removeIncomeCategory,
    addPaymentMethod,
    removePaymentMethod,
    updateCategoryOrder,
    updatePaymentMethodOrder,
    isLoading,
    isOffline,
    isSyncing,
    error,
    refreshData,
    syncPendingOperations,
    getQueueStatus,
  };

  return (
    <EnhancedDataContext.Provider value={value}>
      {children}
    </EnhancedDataContext.Provider>
  );
};