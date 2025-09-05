import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, User } from "lucide-react";
import { useLocation } from "wouter";
import { useCompanyBranding } from "@/hooks/useCompanyProfile";

interface SimpleLoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export function SimpleLoginPage({ onLoginSuccess }: SimpleLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { companyName, companyLogo, tagline, isLoading: companyLoading } = useCompanyBranding();

  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.firstName}!`,
      });
      onLoginSuccess(data.user, data.token);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      login.mutate({ email: email.trim(), password: password.trim() });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-blue-400/10 to-teal-400/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-r from-teal-400/10 to-cyan-400/10 rounded-full animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/95 border border-blue-100/50 shadow-2xl relative z-10 transform transition-all duration-300 hover:scale-105">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-8">
            {companyLogo ? (
              <div className="bg-gradient-to-br from-blue-50 to-teal-50 p-6 rounded-3xl shadow-lg transform transition-all duration-300 hover:scale-110 border border-blue-100">
                <img 
                  src={companyLogo} 
                  alt={companyName}
                  className="h-20 w-auto max-w-40 object-contain"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 rounded-3xl shadow-lg transform transition-all duration-300 hover:scale-110">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent mb-2">
            O2F Portal
          </CardTitle>
          <p className="text-slate-600 font-medium">
            ATS Management System
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="pl-12 h-12 bg-gradient-to-r from-blue-50/50 to-white border-2 border-blue-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-300"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-12 h-12 bg-gradient-to-r from-blue-50/50 to-white border-2 border-blue-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-300"
                  required
                  data-testid="input-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold rounded-xl transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              disabled={login.isPending || !email.trim() || !password.trim()}
              data-testid="button-login"
            >
              {login.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>✨ Sign In</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors duration-300"
              onClick={() => {
                setLocation('/forgot-password');
              }}
              data-testid="link-forgot-password"
            >
              Forgot your password?
            </button>
          </div>

          <div className="mt-6 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>💡 Pro tip:</strong> Contact your system admin if you need an account or role updates. We've got you covered! 
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}