import { useState, useEffect } from "react";
import CandidateLogin from "./candidate-login";
import CandidateDashboard from "./candidate-dashboard";
import { useCandidatePortalAuth } from "@/hooks/useCandidatePortalAuth";

export default function CandidatePortal() {
  const { token, candidate, isLoading, login, logout } = useCandidatePortalAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!token || !candidate) {
    return <CandidateLogin onLoginSuccess={login} />;
  }

  // Show dashboard if authenticated
  return <CandidateDashboard onLogout={logout} />;
}