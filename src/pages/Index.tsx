import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { TrendingDown, Home, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 bg-white/80 shadow-sm border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 tracking-tight">
            Personal Finance Tracker
          </h1>
          {profile && (
            <div className="text-sm text-gray-600">
              Welcome, {profile.full_name || profile.email}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="min-h-[44px] min-w-[44px] sm:h-auto sm:w-auto p-2 sm:px-3 sm:py-2 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
            size="sm"
          >
            <Home className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="min-h-[44px] min-w-[44px] sm:h-auto sm:w-auto p-2 sm:px-3 sm:py-2 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
            size="sm"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md mt-12">
          {/* Expense Tracker Card */}
          <Card
            className="cursor-pointer transition-transform hover:scale-105 shadow-lg border-blue-200"
            onClick={() => navigate("/expense")}
          >
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="bg-blue-100 rounded-full p-3">
                <TrendingDown className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-blue-700">
                Expense Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-base mb-4">
                Track your daily expenses, add incomes, manage transactions, and customize your categories and payment methods.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Dashboard & Analytics</li>
                <li>• Transaction Management</li>
                <li>• Custom Categories & Payment Methods</li>
                <li>• Profile & Settings</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
