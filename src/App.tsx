import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { queryClient } from "./lib/react-query";
import { PageLoader } from "./components/loaders/SkeletonLoaders";

// Eager load auth pages (needed immediately)
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy load all dashboard pages
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const EmployeeProfile = lazy(() => import("./pages/employee/EmployeeProfile"));
const EmployeeAttendance = lazy(() => import("./pages/employee/Attendance"));
const EmployeeLeaves = lazy(() => import("./pages/employee/Leaves"));
const EmployeePayslips = lazy(() => import("./pages/employee/Payslips"));

const HRDashboard = lazy(() => import("./pages/hr/HRDashboard"));
const HREmployees = lazy(() => import("./pages/hr/Employees"));
const HRAttendance = lazy(() => import("./pages/hr/Attendance"));
const HRLeaves = lazy(() => import("./pages/hr/Leaves"));

const PayrollDashboard = lazy(() => import("./pages/payroll/PayrollDashboard"));
const Payruns = lazy(() => import("./pages/payroll/Payruns"));
const Configuration = lazy(() => import("./pages/payroll/Configuration"));
const Designer = lazy(() => import("./pages/payroll/Designer"));
const Reports = lazy(() => import("./pages/payroll/Reports"));

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminOfficeLocation = lazy(() => import("./pages/admin/OfficeLocation"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminAudit = lazy(() => import("./pages/admin/Audit"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
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
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/office-location"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminOfficeLocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAudit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
