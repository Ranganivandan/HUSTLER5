import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Building2, Users, TrendingUp, Shield } from 'lucide-react';
import { publicApi } from '@/lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ totalCompanies: 0, totalEmployees: 0, totalDepartments: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Fetch public stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await publicApi.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'employee':
          navigate('/employee/dashboard');
          break;
        case 'hr':
          navigate('/hr/dashboard');
          break;
        case 'payroll':
          navigate('/payroll/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error('Invalid credentials. Try: employee@workzen.com / password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left side - Branding */}
      <div className="hidden flex-1 bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-foreground/10">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary-foreground">WorkZen</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-primary-foreground">
            Modern HR Management
            <br />
            Made Simple
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Streamline your workforce operations with our comprehensive HRMS solution.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 text-primary-foreground/90">
          <div>
            {statsLoading ? (
              <div className="h-10 w-20 bg-primary-foreground/20 animate-pulse rounded" />
            ) : (
              <div className="text-3xl font-bold">{stats.totalCompanies.toLocaleString()}+</div>
            )}
            <div className="text-sm">Companies</div>
          </div>
          <div>
            {statsLoading ? (
              <div className="h-10 w-20 bg-primary-foreground/20 animate-pulse rounded" />
            ) : (
              <div className="text-3xl font-bold">{stats.totalEmployees.toLocaleString()}+</div>
            )}
            <div className="text-sm">Employees</div>
          </div>
          <div>
            {statsLoading ? (
              <div className="h-10 w-20 bg-primary-foreground/20 animate-pulse rounded" />
            ) : (
              <div className="text-3xl font-bold">{stats.totalDepartments}+</div>
            )}
            <div className="text-sm">Departments</div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">WorkZen</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@workzen.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>

              <div className="mt-6 space-y-2 rounded-lg bg-muted p-4 text-xs">
                <p className="font-medium text-muted-foreground">Demo Accounts:</p>
                <div className="space-y-1 text-muted-foreground">
                  <p>• Employee: employee@workzen.com</p>
                  <p>• HR: hr@workzen.com</p>
                  <p>• Payroll: payroll@workzen.com</p>
                  <p>• Admin: admin@workzen.com</p>
                  <p className="mt-2">Password: password</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
