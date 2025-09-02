import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, User } from "lucide-react";

interface SimpleLoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export function SimpleLoginPage({ onLoginSuccess }: SimpleLoginPageProps) {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const login = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
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
    if (email.trim()) {
      login.mutate(email.trim());
    }
  };

  const handleQuickLogin = () => {
    setEmail("itsupport@o2finfosolutions.com");
    // Auto-submit after setting email
    setTimeout(() => {
      login.mutate("itsupport@o2finfosolutions.com");
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-cyan-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/90 border-0 shadow-2xl relative z-10 transform transition-all duration-300 hover:scale-105">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 rounded-2xl shadow-lg transform transition-all duration-300 hover:rotate-6">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            TalentFlowHub ⚡
          </CardTitle>
          <p className="text-gray-600 mt-3 font-medium">
            Welcome to the future of recruitment 🚀
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-violet-400 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="pl-12 h-12 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 focus:border-violet-400 rounded-xl transition-all duration-300"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              disabled={login.isPending}
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

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">🚀 Quick access for testing:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuickLogin}
                className="text-violet-600 hover:text-violet-700 border-violet-200 hover:border-violet-300 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-xl transform transition-all duration-300 hover:scale-105"
                data-testid="button-quick-login"
              >
                <User className="h-4 w-4 mr-2" />
                🔥 Super Admin Access
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-100">
              <p className="text-xs text-violet-800 leading-relaxed">
                <strong>💡 Pro tip:</strong> Contact your system admin if you need an account or role updates. We've got you covered! 
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}