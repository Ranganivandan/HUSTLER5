import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authApi, apiClient, publicApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Users, TrendingUp, CheckCircle2 } from "lucide-react";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ totalCompanies: 0, totalEmployees: 0, totalDepartments: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: setAuthUser } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.signup({ email, password, fullName });
      
      // Store access token
      apiClient.setAccessToken(response.accessToken);
      
      // Authenticate via backend to load user + role and persist session
      setAuthUser(email, password);
      
      toast({
        title: "Success",
        description: "Account created successfully!",
      });

      // Redirect to employee dashboard (new users are employees by default)
      navigate("/employee/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Stats & Info */}
        <div className="hidden md:block space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">
              Join WorkZen HRMS
            </h1>
            <p className="text-xl text-gray-600">
              The modern HR management system trusted by companies worldwide
            </p>
          </div>

          {/* Dynamic Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/80 backdrop-blur border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Companies</p>
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.totalCompanies.toLocaleString()}+
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employees</p>
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.totalEmployees.toLocaleString()}+
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Real-time attendance tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Automated payroll management</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Advanced analytics & reporting</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Leave management system</span>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <Card className="w-full shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to get started with WorkZen
            </CardDescription>
          </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
