import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Settings as SettingsIcon, Shield, Users, Activity, MessageSquare, ArrowRight, ChevronLeft } from "lucide-react";
import Header from "@/components/layout/header";
import CompanyProfile from "./company-profile";
import ComprehensiveEmailManagement from "@/components/email/comprehensive-email-management";
import UserManagementSettings from "@/components/settings/UserManagementSettings";
import RoleManagementHub from "@/components/roles/RoleManagementHub";
import { ActivityLogs } from "@/components/settings/activity-logs";
import { FeedbackManagement } from "@/components/feedback/feedback-management";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SettingsSection {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  component: React.ComponentType;
  category: 'general' | 'admin';
  adminOnly?: boolean;
  color: string;
  bgColor: string;
}

export default function Settings() {
  const { user } = useAuth();
  const isDirector = true; // Allow all users to access custom roles management
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const settingsSections: SettingsSection[] = [
    {
      id: 'company',
      label: 'Company Profile',
      description: 'Manage company information, branding, and contact details',
      icon: Building2,
      component: CompanyProfile,
      category: 'general',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      id: 'email',
      label: 'Email Management',
      description: 'Configure email providers, templates, and automation',
      icon: Mail,
      component: ComprehensiveEmailManagement,
      category: 'general',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
    },
    {
      id: 'users',
      label: 'User Management',
      description: 'Manage user accounts, permissions, and access control',
      icon: Users,
      component: UserManagementSettings,
      category: 'admin',
      adminOnly: true,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
    },
    {
      id: 'roles',
      label: 'Role Management',
      description: 'Create and manage custom roles and permissions',
      icon: Shield,
      component: RoleManagementHub,
      category: 'admin',
      adminOnly: true,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
    },
    {
      id: 'activity',
      label: 'Activity Logs',
      description: 'Monitor system activity and track user actions',
      icon: Activity,
      component: ActivityLogs,
      category: 'admin',
      adminOnly: true,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
    },
    {
      id: 'feedback',
      label: 'Feedback Management',
      description: 'Review and manage user feedback and bug reports',
      icon: MessageSquare,
      component: FeedbackManagement,
      category: 'admin',
      adminOnly: true,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
    },
  ];

  const filteredSections = settingsSections.filter(section => 
    !section.adminOnly || isDirector
  );

  const generalSections = filteredSections.filter(section => section.category === 'general');
  const adminSections = filteredSections.filter(section => section.category === 'admin');

  const ActiveComponent = settingsSections.find(section => section.id === activeSection)?.component;
  const currentSection = settingsSections.find(s => s.id === activeSection);

  // Show overview page if no active section
  if (!activeSection || !ActiveComponent) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Settings" />
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-teal-50">
          <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl mb-4">
                <SettingsIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Settings</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Configure and manage your system settings. Choose a category below to get started.
              </p>
            </div>

            {/* User Info Card */}
            <div className="mb-12">
              <Card className="max-w-md mx-auto border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                      <p className="text-xs text-gray-500">{user?.department}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* General Settings */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">General Settings</h2>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {generalSections.length} {generalSections.length === 1 ? 'Setting' : 'Settings'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generalSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Card 
                      key={section.id}
                      className={cn(
                        "cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 shadow-lg",
                        section.bgColor
                      )}
                      onClick={() => setActiveSection(section.id)}
                      data-testid={`settings-card-${section.id}`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", section.bgColor.replace('50', '100').replace('hover:bg-', 'bg-'))}>
                              <Icon className={cn("w-5 h-5", section.color)} />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-gray-900">{section.label}</CardTitle>
                            </div>
                          </div>
                          <ArrowRight className={cn("w-5 h-5", section.color)} />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {section.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Admin Settings */}
            {isDirector && adminSections.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Administration</h2>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Admin Only
                  </Badge>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    {adminSections.length} {adminSections.length === 1 ? 'Setting' : 'Settings'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adminSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <Card 
                        key={section.id}
                        className={cn(
                          "cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 shadow-lg",
                          section.bgColor
                        )}
                        onClick={() => setActiveSection(section.id)}
                        data-testid={`settings-card-${section.id}`}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", section.bgColor.replace('50', '100').replace('hover:bg-', 'bg-'))}>
                                <Icon className={cn("w-5 h-5", section.color)} />
                              </div>
                              <CardTitle className="text-lg text-gray-900">{section.label}</CardTitle>
                            </div>
                            <ArrowRight className={cn("w-5 h-5", section.color)} />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <CardDescription className="text-gray-600 leading-relaxed">
                            {section.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-16 text-center">
              <p className="text-gray-500">
                Need help with settings? Contact your system administrator or check the documentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show specific setting page
  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto p-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setActiveSection(null)}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              data-testid="back-to-settings"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", currentSection?.bgColor.replace('50', '100').replace('hover:bg-', 'bg-'))}>
                    {(() => {
                      const Icon = currentSection?.icon || Building2;
                      return <Icon className={cn("w-6 h-6", currentSection?.color)} />;
                    })()}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {currentSection?.label || 'Settings'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {currentSection?.description || 'Configure your settings'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div>
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
}