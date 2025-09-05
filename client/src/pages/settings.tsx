import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Settings as SettingsIcon, Shield, Users, Activity, MessageSquare } from "lucide-react";
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
      component: CompanyProfile,
      category: 'general',
    },
    {
      id: 'email',
      label: 'Email Management',
      icon: Mail,
      component: ComprehensiveEmailManagement,
      category: 'general',
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      component: UserManagementSettings,
      category: 'admin',
      adminOnly: true,
    },
    {
      id: 'roles',
      label: 'Role Management',
      icon: Shield,
      component: RoleManagementHub,
      category: 'admin',
      adminOnly: true,
    },
    {
      id: 'activity',
      label: 'Activity Logs',
      icon: Activity,
      component: ActivityLogs,
      category: 'admin',
      adminOnly: true,
    },
    {
      id: 'feedback',
      label: 'Feedback Management',
      icon: MessageSquare,
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
  const currentSection = settingsSections.find(s => s.id === activeSection);

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Modern Sidebar Navigation */}
          <div className="w-64 bg-white border-r border-gray-100 shadow-sm">
            <div className="p-4">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                    <SettingsIcon className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
                </div>
                <p className="text-sm text-gray-500 ml-11">System configuration</p>
              </div>

              {/* Navigation Menu */}
              <div className="space-y-6">
                {/* General Settings */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                    General
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
                            "w-full justify-start text-left h-10 px-3 font-medium transition-all",
                            isActive 
                              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600" 
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                          onClick={() => setActiveSection(section.id)}
                          data-testid={`settings-nav-${section.id}`}
                        >
                          <Icon className={cn(
                            "h-4 w-4 mr-3",
                            isActive ? "text-blue-600" : "text-gray-400"
                          )} />
                          {section.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Admin Settings */}
                {isDirector && adminSections.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
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
                              "w-full justify-start text-left h-10 px-3 font-medium transition-all",
                              isActive 
                                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600" 
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            )}
                            onClick={() => setActiveSection(section.id)}
                            data-testid={`settings-nav-${section.id}`}
                          >
                            <Icon className={cn(
                              "h-4 w-4 mr-3",
                              isActive ? "text-blue-600" : "text-gray-400"
                            )} />
                            {section.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-8">
              {/* Page Header */}
              <div className="mb-8">
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-teal-100 rounded-xl flex items-center justify-center">
                        {(() => {
                          const Icon = currentSection?.icon || Building2;
                          return <Icon className="h-6 w-6 text-blue-600" />;
                        })()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {currentSection?.label || 'Company Profile'}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Configure and manage your system settings
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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