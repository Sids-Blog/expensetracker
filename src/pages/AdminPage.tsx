import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SettingsPage from '@/components/SettingsPage';
import DropdownManager from '@/components/DropdownManager';
import { Settings, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedTransactions } from '@/lib/enhanced-transaction-context';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { isOffline, isSyncing } = useEnhancedTransactions();
  
  // Offline state management
  const [lastSync, setLastSync] = useState<string | null>(null);
  const lastSyncRef = useRef<string | null>(null);

  // Update last sync time in localStorage when online and not syncing
  useEffect(() => {
    if (!isOffline && !isSyncing) {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const ist = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${pad(ist.getDate())}-${pad(ist.getMonth() + 1)}-${ist.getFullYear()}`;
      const timeStr = `${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}`;
      const syncStr = `${dateStr} ${timeStr} IST`;
      localStorage.setItem('last_sync_ist', syncStr);
      setLastSync(syncStr);
      lastSyncRef.current = syncStr;
    } else if (isOffline) {
      // On going offline, read last sync from localStorage
      const stored = localStorage.getItem('last_sync_ist');
      setLastSync(stored);
      lastSyncRef.current = stored;
    }
  }, [isOffline, isSyncing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Offline/Sync Banner */}
      {(isOffline || isSyncing) && (
        <div className={`w-full text-center py-2 text-white ${isOffline ? 'bg-red-600' : 'bg-blue-600'}`}
             style={{ zIndex: 1000 }}>
          {isOffline ? (
            <>
              You are offline. Changes will sync when you are back online.
              {lastSync && (
                <div className="text-xs text-white/80 mt-1">Last sync: {lastSync}</div>
              )}
            </>
          ) : (
            'Syncing changes...'
          )}
        </div>
      )}
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 bg-white/80 shadow-sm border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 tracking-tight">
            Settings
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="min-h-[44px] min-w-[44px] sm:h-auto sm:w-auto p-2 sm:px-3 sm:py-2 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
            size="sm"
          >
            <Home className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="bg-gradient-to-br from-white to-blue-50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-blue-600" />
                <span>Application Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsPage />
            </CardContent>
          </Card>
          
          <DropdownManager />
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
