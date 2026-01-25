import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { EventProvider } from "@/contexts/EventContext";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentEvents from "./pages/student/StudentEvents";
import ClubDashboard from "./pages/club/ClubDashboard";
import CreateEvent from "./pages/club/CreateEvent";
import ClubEvents from "./pages/club/ClubEvents";
import DepartmentDashboard from "./pages/department/DepartmentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role: string }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />} />
      <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/events" element={<ProtectedRoute role="student"><StudentEvents /></ProtectedRoute>} />
      <Route path="/club" element={<ProtectedRoute role="club"><ClubDashboard /></ProtectedRoute>} />
      <Route path="/club/create-event" element={<ProtectedRoute role="club"><CreateEvent /></ProtectedRoute>} />
      <Route path="/club/events" element={<ProtectedRoute role="club"><ClubEvents /></ProtectedRoute>} />
      <Route path="/department" element={<ProtectedRoute role="department"><DepartmentDashboard /></ProtectedRoute>} />
      <Route path="/department/clubs" element={<ProtectedRoute role="department"><DepartmentDashboard /></ProtectedRoute>} />
      <Route path="/department/pending" element={<ProtectedRoute role="department"><DepartmentDashboard /></ProtectedRoute>} />
      <Route path="/department/approved" element={<ProtectedRoute role="department"><DepartmentDashboard /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <EventProvider>
            <AppRoutes />
          </EventProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;