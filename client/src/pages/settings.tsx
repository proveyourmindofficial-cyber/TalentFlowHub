import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Settings as SettingsIcon, Shield, Users } from "lucide-react";
import Header from "@/components/layout/header";
import CompanyProfile from "./company-profile";
import ComprehensiveEmailManagement from "@/components/email/comprehensive-email-management";
import UserManagementSettings from "@/components/settings/UserManagementSettings";
import RoleManagementHub from "@/components/roles/RoleManagementHub";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();
  const isDirector = true; // Allow all users to access custom roles management

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-6 w-6" />
              <h1 className="text-2xl font-semibold">Settings</h1>
            </div>

            <Tabs defaultValue="company" className="space-y-4">
              <TabsList className={`${isDirector ? 'grid-cols-4' : 'grid-cols-2'} grid w-full bg-gray-100 p-1 rounded-lg`}>
                <TabsTrigger 
                  value="company" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all hover:text-blue-600" 
                  data-testid="tab-company-profile"
                >
                  <Building2 className="h-4 w-4" />
                  Company Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="email" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all hover:text-blue-600" 
                  data-testid="tab-email-settings"
                >
                  <Mail className="h-4 w-4" />
                  Email Management
                </TabsTrigger>
                {isDirector && (
                  <TabsTrigger 
                    value="users" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all hover:text-blue-600" 
                    data-testid="tab-user-management"
                  >
                    <Users className="h-4 w-4" />
                    User Management
                  </TabsTrigger>
                )}
                {isDirector && (
                  <TabsTrigger 
                    value="roles" 
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all hover:text-blue-600" 
                    data-testid="tab-role-management"
                  >
                    <Shield className="h-4 w-4" />
                    Role Management
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="company" className="space-y-4">
                <CompanyProfile />
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <ComprehensiveEmailManagement />
              </TabsContent>

              {isDirector && (
                <TabsContent value="users" className="space-y-4">
                  <UserManagementSettings />
                </TabsContent>
              )}

              {isDirector && (
                <TabsContent value="roles" className="space-y-4">
                  <RoleManagementHub />
                </TabsContent>
              )}
            </Tabs>
          </div>
      </div>
    </div>
  );
}