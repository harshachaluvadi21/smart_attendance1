import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import StudentAuth from "./pages/StudentAuth";
import TeacherAuth from "./pages/TeacherAuth";
import StudentDashboard from "@/components/StudentDashboard";
import TeacherDashboard from "@/components/TeacherDashboard";
import SimpleDetection from "./pages/SimpleDetection";
import OpenCVAttendanceSystem from "@/components/OpenCVAttendanceSystem";
import { getSession, clearSession } from "@/lib/store";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="smartattend-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/index" element={<Index />} />
            <Route path="/detect" element={<SimpleDetection />} />
            <Route path="/opencv" element={<OpenCVAttendanceSystem />} />
            <Route path="/student/auth" element={<StudentAuth />} />
            <Route path="/teacher/auth" element={<TeacherAuth />} />
            <Route path="/student" element={<StudentDashboard onLogout={() => { clearSession(); window.location.href = "/"; }} />} />
            <Route path="/teacher" element={<TeacherDashboard onLogout={() => { clearSession(); window.location.href = "/"; }} />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
