import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { useAuth } from '@/lib/auth-context';
import { Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { signUp, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return;
    }

    const success = await signUp(email, password, fullName);
    if (success) {
      navigate('/login');
    }
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Sign up to start tracking your finances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              type="text"
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              placeholder="John Doe"
              disabled={isLoading}
            />

            <FormField
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />

            <FormField
              type="password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Create a strong password"
              required
              disabled={isLoading}
            />

            <FormField
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm your password"
              required
              disabled={isLoading}
            />

            {!passwordsMatch && confirmPassword && (
              <p className="text-sm text-red-600">Passwords do not match</p>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email.trim() || !password.trim() || !passwordsMatch}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}