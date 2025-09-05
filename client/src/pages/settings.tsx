import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Settings as SettingsIcon, Shield, Users, Activity, MessageSquare, ChevronRight } from "lucide-react";
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
  icon: React.ElementType;
  description: string;
  component: React.ComponentType;
  category: 'general' | 'admin';
  adminOnly?: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const isDirector = true; // Allow all users to access custom roles management
  const [activeSection, setActiveSection] = useState('company');

  const settingsSections: SettingsSection[] = [
    {
      id: 'company',
      label: 'Company Profile',
      icon: Building2,
      description: 'Manage company information, branding, and contact details',
      component: CompanyProfile,
      category: 'general',
    },
    {
      id: 'email',
      label: 'Email Management',
      icon: Mail,
      description: 'Configure email settings, providers, and templates',
      component: ComprehensiveEmailManagement,
      category: 'general',
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      description: 'Manage user accounts, permissions, and access control',
      component: UserManagementSettings,
      category: 'admin',
      adminOnly: true,
    },
    {
      id: 'roles',
      label: 'Role Management',
      icon: Shield,
      description: 'Create and manage custom roles and permissions',
      component: RoleManagementHub,
      category: 'admin',
      adminOnly: true,
    },
    {
      id: 'activity',
      label: 'Activity Logs',
      icon: Activity,
      description: 'Monitor system activity and user actions',
      component: ActivityLogs,
      category: 'admin',
      adminOnly: true,
    },
    {
      id: 'feedback',
      label: 'Feedback Management',
      icon: MessageSquare,
      description: 'Review and manage user feedback and bug reports',
      component: FeedbackManagement,
      category: 'admin',
      adminOnly: true,
    },
  ];

  const filteredSections = settingsSections.filter(section => 
    !section.adminOnly || isDirector
  );

  const generalSections = filteredSections.filter(section => section.category === 'general');
  const adminSections = filteredSections.filter(section => section.category === 'admin');

  const ActiveComponent = settingsSections.find(section => section.id === activeSection)?.component || CompanyProfile;

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Sidebar Navigation */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                  <SettingsIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
                  <p className="text-sm text-gray-500">Manage your system configuration</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* General Settings */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-3">
                    General Settings
                  </h3>
                  <div className="space-y-1">
                    {generalSections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;
                      
                      return (
                        <Button
                          key={section.id}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-left h-auto p-3 hover:bg-white hover:shadow-sm transition-all",
                            isActive && "bg-white shadow-sm border border-blue-100 text-blue-700"
                          )}
                          onClick={() => setActiveSection(section.id)}
                          data-testid={`settings-nav-${section.id}`}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <Icon className={cn(
                              "h-5 w-5 mt-0.5 flex-shrink-0",
                              isActive ? "text-blue-600" : "text-gray-500"
                            )} />
                            <div className="flex-1 text-left">
                              <div className={cn(
                                "font-medium text-sm",
                                isActive ? "text-blue-700" : "text-gray-900"
                              )}>
                                {section.label}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 leading-tight">
                                {section.description}
                              </div>
                            </div>
                            {isActive && <ChevronRight className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Admin Settings */}
                {isDirector && adminSections.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider mb-3">
                        Administration
                      </h3>
                      <div className="space-y-1">
                        {adminSections.map((section) => {
                          const Icon = section.icon;
                          const isActive = activeSection === section.id;
                          
                          return (
                            <Button
                              key={section.id}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start text-left h-auto p-3 hover:bg-white hover:shadow-sm transition-all",
                                isActive && "bg-white shadow-sm border border-blue-100 text-blue-700"
                              )}
                              onClick={() => setActiveSection(section.id)}
                              data-testid={`settings-nav-${section.id}`}
                            >
                              <div className="flex items-start gap-3 w-full">
                                <Icon className={cn(
                                  "h-5 w-5 mt-0.5 flex-shrink-0",
                                  isActive ? "text-blue-600" : "text-gray-500"
                                )} />
                                <div className="flex-1 text-left">
                                  <div className={cn(
                                    "font-medium text-sm",
                                    isActive ? "text-blue-700" : "text-gray-900"
                                  )}>
                                    {section.label}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 leading-tight">
                                    {section.description}
                                  </div>
                                </div>
                                {isActive && <ChevronRight className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  <div className="font-medium mb-1">Current User</div>
                  <div>{user?.firstName} {user?.lastName}</div>
                  <div className="text-gray-400">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentSection = settingsSections.find(s => s.id === activeSection);
                    const Icon = currentSection?.icon || Building2;
                    return (
                      <>
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-teal-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {currentSection?.label || 'Company Profile'}
                          </h2>
                          <p className="text-gray-600 mt-1">
                            {currentSection?.description || 'Manage company information and settings'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Content */}
              <div className="max-w-6xl">
                <ActiveComponent />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}