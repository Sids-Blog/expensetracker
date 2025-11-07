import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AuthService, AdminUserView } from '@/lib/auth-service';
import { getCurrencySymbol } from '@/components/ui/currency-display';
import { 
  AlertCircle, 
  CheckCircle, 
  Crown, 
  Loader2, 
  RefreshCw, 
  Shield, 
  ShieldOff, 
  User, 
  UserCheck, 
  UserX 
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserManagementProps {
  currentUserId?: string;
}

export const UserManagement = ({ currentUserId }: UserManagementProps) => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await AuthService.getAllUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load users',
          description: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load users',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUserAction = async (
    userId: string, 
    action: 'activate' | 'deactivate' | 'makeAdmin' | 'removeAdmin',
    userName: string
  ) => {
    if (userId === currentUserId && (action === 'deactivate' || action === 'removeAdmin')) {
      toast({
        variant: 'destructive',
        title: 'Action Not Allowed',
        description: 'You cannot perform this action on your own account.',
      });
      return;
    }

    const confirmMessage = {
      activate: `Are you sure you want to activate ${userName}?`,
      deactivate: `Are you sure you want to deactivate ${userName}? They will not be able to sign in.`,
      makeAdmin: `Are you sure you want to give admin privileges to ${userName}?`,
      removeAdmin: `Are you sure you want to remove admin privileges from ${userName}?`,
    };

    if (!confirm(confirmMessage[action])) {
      return;
    }

    setActionLoading(userId);
    try {
      let result;
      switch (action) {
        case 'activate':
          result = await AuthService.activateUser(userId);
          break;
        case 'deactivate':
          result = await AuthService.deactivateUser(userId);
          break;
        case 'makeAdmin':
          result = await AuthService.makeAdmin(userId);
          break;
        case 'removeAdmin':
          result = await AuthService.removeAdmin(userId);
          break;
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: `User ${action === 'activate' ? 'activated' : 
                                action === 'deactivate' ? 'deactivated' : 
                                action === 'makeAdmin' ? 'promoted to admin' : 
                                'admin privileges removed'} successfully.`,
        });
        await loadUsers();
      } else {
        toast({
          variant: 'destructive',
          title: 'Action Failed',
          description: result.error || 'Failed to perform action',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (user: AdminUserView) => {
    if (!user.is_active) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <UserX className="h-3 w-3" />
          Inactive
        </Badge>
      );
    }
    
    if (user.is_admin) {
      return (
        <Badge variant="default" className="bg-purple-100 text-purple-800 flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <UserCheck className="h-3 w-3" />
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts, permissions, and access
            </CardDescription>
          </div>
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.is_admin).length}
                </div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {users.filter(u => !u.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Inactive</div>
              </div>
            </div>

            {/* User List */}
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className={`p-4 border rounded-lg ${
                    user.id === currentUserId ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {user.full_name || user.email}
                        </h3>
                        {user.id === currentUserId && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                        {getStatusBadge(user)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{user.email}</p>
                        <div className="flex flex-wrap gap-4">
                          <span>Joined: {formatDate(user.created_at)}</span>
                          {user.last_login_at && (
                            <span>Last login: {formatDate(user.last_login_at)}</span>
                          )}
                          <span>Transactions: {user.transaction_count}</span>
                          {user.transaction_count > 0 && (
                            <span>
                              Total: {getCurrencySymbol('USD')}{(user.total_income - user.total_expenses).toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        {user.deactivated_at && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs">
                              Deactivated on {formatDate(user.deactivated_at)}
                              {user.deactivated_by_email && ` by ${user.deactivated_by_email}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {user.is_active ? (
                        <Button
                          onClick={() => handleUserAction(user.id, 'deactivate', user.full_name || user.email)}
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === user.id || user.id === currentUserId}
                          className="text-red-600 hover:text-red-700"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUserAction(user.id, 'activate', user.full_name || user.email)}
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === user.id}
                          className="text-green-600 hover:text-green-700"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      
                      {user.is_admin ? (
                        <Button
                          onClick={() => handleUserAction(user.id, 'removeAdmin', user.full_name || user.email)}
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === user.id || user.id === currentUserId}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ShieldOff className="h-3 w-3" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUserAction(user.id, 'makeAdmin', user.full_name || user.email)}
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === user.id}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Shield className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
