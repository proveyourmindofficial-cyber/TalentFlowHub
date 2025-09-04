import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SimpleLoginPage } from "@/components/auth/SimpleLoginPage";
import { PasswordSetupPage } from "@/components/auth/PasswordSetupPage";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import JobForm from "@/pages/job-form";
import JobDetailPage from "@/pages/job-detail";
import Candidates from "@/pages/candidates";
import CandidateDetailPage from "@/pages/candidate-detail";
import Applications from "@/pages/applications";
import Interviews from "@/pages/interviews";
import OfferLetters from "@/pages/OfferLetters";
import ClientRequirements from "@/pages/client-requirements";
import Settings from "@/pages/settings";
import UserManagement from "@/pages/user-management";
import CandidatePortal from "@/pages/candidate-portal";
import CandidateResponse from "@/pages/candidate-response";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, login } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated for internal routes
  if (!isAuthenticated) {
    return (
      <Switch>
        {/* Public candidate portal routes - no authentication required */}
        <Route path="/portal" component={CandidatePortal} />
        <Route path="/candidate-portal/*" component={CandidatePortal} />
        <Route path="/candidate-response" component={CandidateResponse} />
        <Route path="/setup-password" component={PasswordSetupPage} />
        
        {/* All other routes require authentication */}
        <Route component={() => {
          const LoginComponent = () => <SimpleLoginPage onLoginSuccess={login} />;
          return <LoginComponent />;
        }} />
      </Switch>
    );
  }

  // Authenticated internal user routes
  return (
    <AppLayout>
      <Switch>
        {/* Admin/HR Routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/jobs/new" component={JobForm} />
        <Route path="/jobs/:id" component={JobDetailPage} />
        <Route path="/jobs/:id/edit" component={JobForm} />
        <Route path="/candidates" component={Candidates} />
        <Route path="/candidates/:id" component={CandidateDetailPage} />
        <Route path="/applications" component={Applications} />
        <Route path="/interviews" component={Interviews} />
        <Route path="/offer-letters" component={OfferLetters} />
        <Route path="/client-requirements" component={ClientRequirements} />
        <Route path="/settings" component={Settings} />
        <Route path="/user-management" component={UserManagement} />

        {/* Candidate Portal Routes */}
        <Route path="/portal" component={CandidatePortal} />
        <Route path="/candidate-portal/*" component={CandidatePortal} />
        
        {/* Candidate Response Route */}
        <Route path="/candidate-response" component={CandidateResponse} />

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
