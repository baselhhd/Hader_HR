import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import CheckIn from "./pages/employee/CheckIn";
import AttendanceHistory from "./pages/employee/AttendanceHistory";
import LeaveRequest from "./pages/employee/LeaveRequest";
import CustomRequest from "./pages/employee/CustomRequest";
import Profile from "./pages/employee/Profile";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import VerificationRequests from "./pages/manager/VerificationRequests";
import HRDashboard from "./pages/hr/HRDashboard";
import Employees from "./pages/hr/Employees";
import AddEmployee from "./pages/hr/AddEmployee";
import CustomRequests from "./pages/hr/CustomRequests";
import LeaveRequests from "./pages/hr/LeaveRequests";
import Reports from "./pages/hr/Reports";
import Attendance from "./pages/hr/Attendance";
import ForgotPassword from "./pages/ForgotPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Companies from "./pages/admin/Companies";
import Branches from "./pages/admin/Branches";
import Locations from "./pages/admin/Locations";
import Shifts from "./pages/admin/Shifts";
import Users from "./pages/admin/Users";
import Settings from "./pages/admin/Settings";
import DatabaseViewer from "./pages/admin/DatabaseViewer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/check-in" element={<CheckIn />} />
          <Route path="/employee/attendance" element={<AttendanceHistory />} />
          <Route path="/employee/leave-request" element={<LeaveRequest />} />
          <Route path="/employee/custom-request" element={<CustomRequest />} />
          <Route path="/employee/profile" element={<Profile />} />
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/verifications" element={<VerificationRequests />} />
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/hr/employees" element={<Employees />} />
          <Route path="/hr/employees/add" element={<AddEmployee />} />
          <Route path="/hr/employees/:id/edit" element={<AddEmployee />} />
          <Route path="/hr/custom-requests" element={<CustomRequests />} />
          <Route path="/hr/requests" element={<LeaveRequests />} />
          <Route path="/hr/reports" element={<Reports />} />
          <Route path="/hr/attendance" element={<Attendance />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/companies" element={<Companies />} />
          <Route path="/admin/branches" element={<Branches />} />
          <Route path="/admin/locations" element={<Locations />} />
          <Route path="/admin/shifts" element={<Shifts />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/database" element={<DatabaseViewer />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
