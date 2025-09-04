import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestAccess } from "@/hooks/useAuth";
import { Building2, Shield, Users } from "lucide-react";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                TalentFlowHub
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Applicant Tracking System
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Internal Staff Access
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Contact your administrator for an invitation to set up your account
              </p>
            </div>

            <Button 
              onClick={requestAccess}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 h-auto"
              data-testid="button-request-access"
            >
              <Shield className="w-5 h-5 mr-2" />
              Request Access
            </Button>

            <div className="border-t border-gray-200 pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">
                  Are you a candidate?
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // This would redirect to candidate portal
                    alert('Candidate portal access coming soon');
                  }}
                  data-testid="button-candidate-portal"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Access Candidate Portal
                </Button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-400">
                Secure invitation-based access system
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}