import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();

  // Extract token from URL on component mount
  useEffect(() => {
    // Get the full URL with query parameters
    const fullUrl = window.location.href;
    const url = new URL(fullUrl);
    const urlToken = url.searchParams.get('token');
    
    // Token extraction from URL - details redacted for security
    console.log('Processing password reset request');
    
    if (urlToken) {
      setToken(urlToken);
      toast({
        title: "Reset Link Valid",
        description: "Token found successfully. You can now set your new password.",
      });
    } else {
      toast({
        title: "Invalid Reset Link",
        description: "No reset token found in the URL.",
        variant: "destructive",
      });
    }
  }, []);

  const resetPassword = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset Successful",
        description: data.message || "Your password has been reset successfully.",
      });
      setResetSuccess(true);
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Please try again or request a new reset link.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: "Invalid Reset Link",
        description: "No reset token found. Please use the link from your email.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    resetPassword.mutate({ token, newPassword });
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md backdrop-blur-lg bg-white/90 border-0 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-2xl shadow-lg">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Password Reset Complete! ✅
            </CardTitle>
            <p className="text-gray-600 mt-3 font-medium">
              You can now login with your new password
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                🚀 Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-pink-50 to-orange-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-full animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/90 border-0 shadow-2xl relative z-10 transform transition-all duration-300 hover:scale-105">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-4 rounded-2xl shadow-lg transform transition-all duration-300 hover:rotate-6">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Set New Password 🔐
          </CardTitle>
          <p className="text-gray-600 mt-3 font-medium">
            Create a secure password for your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-700 font-medium">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400 h-5 w-5" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="pl-12 h-12 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 focus:border-red-400 rounded-xl transition-all duration-300"
                  required
                  minLength={6}
                  data-testid="input-new-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400 h-5 w-5" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="pl-12 h-12 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 focus:border-red-400 rounded-xl transition-all duration-300"
                  required
                  minLength={6}
                  data-testid="input-confirm-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold rounded-xl transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              disabled={resetPassword.isPending || !newPassword.trim() || !confirmPassword.trim() || !token}
              data-testid="button-reset-password"
            >
              {resetPassword.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🔑 Reset Password</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/">
              <button
                type="button"
                className="inline-flex items-center text-sm text-violet-600 hover:text-violet-800 underline transition-colors duration-300"
                data-testid="link-back-to-login"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </button>
            </Link>
          </div>

          <div className="mt-6 text-center">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border border-red-100">
              <p className="text-xs text-red-800 leading-relaxed">
                <strong>🔒 Security:</strong> Your password should be at least 6 characters and unique to this account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}