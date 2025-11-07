import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export const AdminDebug = () => {
  const { profile, isAdmin, refreshProfile } = useAuth();
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkDatabase = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current auth user:', user);

      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('Database profile:', data);
        console.log('Database error:', error);
        setDbProfile(data);
      }
    } catch (error) {
      console.error('Error checking database:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = async () => {
    setLoading(true);
    await refreshProfile();
    await checkDatabase();
    setLoading(false);
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm">Admin Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs space-y-2">
          <div>
            <strong>Context isAdmin:</strong> {isAdmin ? 'true' : 'false'}
          </div>
          <div>
            <strong>Profile is_admin:</strong> {profile?.is_admin ? 'true' : 'false'}
          </div>
          <div>
            <strong>Profile email:</strong> {profile?.email || 'null'}
          </div>
          <div>
            <strong>Profile ID:</strong> {profile?.id || 'null'}
          </div>
          {dbProfile && (
            <div className="mt-4 p-2 bg-white rounded border">
              <strong>Database Profile:</strong>
              <pre className="text-xs mt-1 overflow-auto">
                {JSON.stringify(dbProfile, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={checkDatabase} 
            size="sm" 
            variant="outline"
            disabled={loading}
          >
            Check Database
          </Button>
          <Button 
            onClick={forceRefresh} 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Force Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
