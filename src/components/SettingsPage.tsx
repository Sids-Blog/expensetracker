import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency-context";
import { useEnhancedTransactions } from "@/lib/enhanced-transaction-context";
import { BackendStatus } from "@/components/BackendStatus";
import { AlertCircle, CheckCircle, Database, DollarSign, RefreshCw } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const { currency, setCurrency } = useCurrency();
  const { isConnected, error, refreshTransactions, isOffline, isSyncing } = useEnhancedTransactions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CHF', 'CNY', 'BRL'];

  const handleRefresh = async () => {
    try {
      await refreshTransactions();
      toast({
        title: "Data Refreshed",
        description: "Successfully refreshed data from Supabase",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "Failed to refresh data. Please check your connection.",
      });
    }
  };

  return (
    <div>
      {/* Current time at the top */}
      <div className="mb-4 text-right text-xs text-gray-500">
        {new Date().toLocaleString()}
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Currency Settings
            </CardTitle>
            <CardDescription>
              Set your preferred currency for displaying amounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <BackendStatus isOffline={isOffline} isSyncing={isSyncing} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Legacy Database Connection
            </CardTitle>
            <CardDescription>
              Legacy connection status (use Backend Status above for detailed monitoring)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Connected to Supabase
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <Badge variant="destructive">
                    Not Connected
                  </Badge>
                </>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
