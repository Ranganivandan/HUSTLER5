import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeeAttendance from "./pages/employee/Attendance";
import EmployeeLeaves from "./pages/employee/Leaves";
import EmployeePayslips from "./pages/employee/Payslips";
import HRDashboard from "./pages/hr/HRDashboard";
import HREmployees from "./pages/hr/Employees";
import HRAttendance from "./pages/hr/Attendance";
import HRLeaves from "./pages/hr/Leaves";
import PayrollDashboard from "./pages/payroll/PayrollDashboard";
import Payruns from "./pages/payroll/Payruns";
import Configuration from "./pages/payroll/Configuration";
import Designer from "./pages/payroll/Designer";
import Reports from "./pages/payroll/Reports";
import AdminDashboard from "./pages/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            
            {/* Employee Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/profile"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/attendance"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/leaves"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeeLeaves />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/payslips"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <EmployeePayslips />
                </ProtectedRoute>
              }
            />
            
            {/* HR Routes */}
            <Route
              path="/hr/dashboard"
              element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <HRDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr/employees"
              element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <HREmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr/attendance"
              element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <HRAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr/leaves"
              element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <HRLeaves />
                </ProtectedRoute>
              }
            />
            
            {/* Payroll Routes */}
            <Route
              path="/payroll/dashboard"
              element={
                <ProtectedRoute allowedRoles={['payroll']}>
                  <PayrollDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/payruns"
              element={
                <ProtectedRoute allowedRoles={['payroll']}>
                  <Payruns />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/configuration"
              element={
                <ProtectedRoute allowedRoles={['payroll']}>
                  <Configuration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/designer"
              element={
                <ProtectedRoute allowedRoles={['payroll']}>
                  <Designer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll/reports"
              element={
                <ProtectedRoute allowedRoles={['payroll']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
