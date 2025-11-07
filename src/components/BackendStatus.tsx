import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BackendService } from "@/lib/backend-service";
import { SyncService } from "@/lib/sync-service";
import { AlertCircle, CheckCircle, Clock, Database, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

interface BackendStatusProps {
  isOffline: boolean;
  isSyncing: boolean;
}

export const BackendStatus = ({ isOffline, isSyncing }: BackendStatusProps) => {
  const [backendHealth, setBackendHealth] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');
  const [queueStatus, setQueueStatus] = useState({
    totalOperations: 0,
    pendingOperations: 0,
    failedOperations: 0,
  });
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);
  const { toast } = useToast();

  const checkBackendHealth = async () => {
    setBackendHealth('checking');
    try {
      const result = await BackendService.healthCheck();
      setBackendHealth(result.success ? 'healthy' : 'unhealthy');
      setLastHealthCheck(new Date().toLocaleTimeString());
      
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Backend Health Check Failed",
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      setBackendHealth('unhealthy');
      setLastHealthCheck(new Date().toLocaleTimeString());
      toast({
        variant: "destructive",
        title: "Backend Health Check Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const updateQueueStatus = async () => {
    try {
      const status = await SyncService.getQueueStatus();
      setQueueStatus({
        totalOperations: status.totalOperations,
        pendingOperations: status.pendingOperations,
        failedOperations: status.failedOperations,
      });
    } catch (error) {
      console.error('Failed to get queue status:', error);
    }
  };

  const handleRetryFailedOperations = async () => {
    try {
      const result = await SyncService.retryFailedOperations();
      
      if (result.success) {
        toast({
          title: "Retry Successful",
          description: `Successfully processed ${result.processedOperations} operations`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Retry Failed",
          description: `${result.failedOperations} operations still failed`,
        });
      }
      
      await updateQueueStatus();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Retry Error",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleClearFailedOperations = async () => {
    try {
      await SyncService.clearFailedOperations();
      await updateQueueStatus();
      
      toast({
        title: "Failed Operations Cleared",
        description: "All failed operations have been removed from the queue",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Clear Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Check backend health and queue status on mount and periodically
  useEffect(() => {
    checkBackendHealth();
    updateQueueStatus();
    
    const interval = setInterval(() => {
      if (!isOffline) {
        checkBackendHealth();
      }
      updateQueueStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOffline]);

  const getConnectionStatus = () => {
    if (isOffline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        label: "Offline",
        variant: "destructive" as const,
      };
    }
    
    if (isSyncing) {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        label: "Syncing",
        variant: "default" as const,
      };
    }
    
    switch (backendHealth) {
      case 'healthy':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: "Connected",
          variant: "default" as const,
        };
      case 'unhealthy':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Connection Issues",
          variant: "destructive" as const,
        };
      case 'checking':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          label: "Checking",
          variant: "secondary" as const,
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          label: "Unknown",
          variant: "secondary" as const,
        };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backend Status
        </CardTitle>
        <CardDescription>
          Monitor database connection and sync queue status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection Status</span>
          <Badge variant={connectionStatus.variant} className="flex items-center gap-1">
            {connectionStatus.icon}
            {connectionStatus.label}
          </Badge>
        </div>

        {/* Last Health Check */}
        {lastHealthCheck && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Health Check</span>
            <span className="text-sm text-gray-500">{lastHealthCheck}</span>
          </div>
        )}

        {/* Queue Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Sync Queue</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold">{queueStatus.totalOperations}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{queueStatus.pendingOperations}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-600">{queueStatus.failedOperations}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={checkBackendHealth}
            variant="outline"
            size="sm"
            disabled={backendHealth === 'checking'}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${backendHealth === 'checking' ? 'animate-spin' : ''}`} />
            Check Backend Health
          </Button>
          
          {queueStatus.failedOperations > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={handleRetryFailedOperations}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Retry Failed
              </Button>
              <Button
                onClick={handleClearFailedOperations}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                Clear Failed
              </Button>
            </div>
          )}
        </div>

        {/* Network Status Indicator */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            {isOffline ? (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Working offline - changes will sync when online</span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Online - changes sync automatically</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};