import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, apiClient } from '@/lib/api';

export type UserRole = 'employee' | 'hr' | 'payroll' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employee_code?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// No mock users: enforce backend-only auth

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('workzen_user');
    const storedToken = localStorage.getItem('workzen_access_token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      apiClient.setAccessToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Call backend API
      const response = await authApi.login({ email, password });
      
      // Store access token in API client
      apiClient.setAccessToken(response.accessToken);
      
      // Create user object from response
      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as UserRole,
      };
      
      setUser(user);
      localStorage.setItem('workzen_user', JSON.stringify(user));
      localStorage.setItem('workzen_access_token', response.accessToken);
      
      // Redirect based on role
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
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless
      apiClient.setAccessToken(null);
      setUser(null);
      localStorage.removeItem('workzen_user');
      localStorage.removeItem('workzen_access_token');
      navigate('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
