import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth, logout } from "@/hooks/useAuth";
import { 
  ChartPie, 
  Briefcase, 
  Users, 
  FileText, 
  Calendar, 
  Building, 
  Shield, 
  BarChart3,
  Mail,
  Settings,
  LogOut,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyBranding } from "@/hooks/useCompanyProfile";
import UserProfileDropdown from "./user-profile-dropdown";
import o2fLogo from '@assets/Logo tm 1_1757076341265.png';

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: ChartPie, module: "dashboard" },
  { name: "Jobs", href: "/jobs", icon: Briefcase, key: "jobs", module: "jobs" },
  { name: "Candidates", href: "/candidates", icon: Users, key: "candidates", module: "candidates" },
  { name: "Applications", href: "/applications", icon: FileText, key: "applications", module: "applications" },
  { name: "Interviews", href: "/interviews", icon: Calendar, key: "interviews", badgeType: "error", module: "interviews" },
  { name: "Offer Letters", href: "/offer-letters", icon: FileText, key: "offer-letters", module: "offer_letters" },
  { name: "Client Requirements", href: "/client-requirements", icon: Building, key: "client-requirements", module: "client_requirements" },
];

const secondaryNavigation = [
  { name: "Reports", href: "/reports", icon: BarChart3, module: "reports" },
  { name: "Settings", href: "/settings", icon: Settings, module: "settings" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { companyName, companyLogo, tagline, isLoading: companyLoading } = useCompanyBranding();

  // Fetch live navigation counts
  const { data: counts } = useQuery({
    queryKey: ['/api/navigation/counts'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['/api/user/permissions'],
    enabled: !!user,
  });

  const userPermissions = (permissionsData as any)?.permissions || {};
  const userRole = (permissionsData as any)?.role;

  // Filter navigation based on permissions
  const hasPermission = (module: string) => {
    const modulePermissions = userPermissions[module];
    return modulePermissions && modulePermissions.view === true;
  };

  // Filter navigation items based on permissions
  const filteredBaseNavigation = baseNavigation.filter(item => 
    !item.module || hasPermission(item.module)
  );
  
  const filteredSecondaryNavigation = secondaryNavigation.filter(item => 
    !item.module || hasPermission(item.module)
  );

  // Create navigation with live counts
  const navigation = filteredBaseNavigation.map(item => ({
    ...item,
    badge: item.key && counts ? counts[item.key as keyof typeof counts] : undefined
  }));
  
  const secondaryNav = filteredSecondaryNavigation;

  return (
    <aside className="w-64 bg-gradient-to-b from-white via-blue-50/50 to-blue-100/30 shadow-xl border-r border-blue-200/50 flex flex-col min-h-screen" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-blue-100/50 bg-gradient-to-r from-white to-blue-50/30">
        <div className="flex items-center justify-center">
          <div className="flex-shrink-0">
            <img 
              src={o2fLogo}
              alt="O2F InfoSolutions"
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-blue-100/50 bg-gradient-to-r from-white/40 to-blue-50/40">
        <UserProfileDropdown userRole={userRole} user={user} />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href} data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 sidebar-item relative",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg transform scale-[1.02]"
                    : "text-gray-700 hover:bg-white/60 hover:text-blue-600 hover:shadow-md"
                )}
              >
                <item.icon 
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-gray-500"
                  )} 
                />
                <span className={cn(
                  "transition-colors font-medium",
                  isActive ? "text-white" : "text-gray-700"
                )}>
                  {item.name}
                </span>
                {item.badge !== undefined && (
                  <span 
                    className={cn(
                      "ml-auto text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                      item.badgeType === "error" 
                        ? "bg-red-500 text-white shadow-sm" 
                        : isActive 
                          ? "bg-white/20 text-white" 
                          : "bg-blue-100 text-blue-600"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        
        <div className="pt-4 border-t border-blue-200/30 mt-4">
          {secondaryNav.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href} data-testid={`nav-${item.name.toLowerCase()}`}>
                <div
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 sidebar-item relative",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg transform scale-[1.02]"
                      : "text-gray-700 hover:bg-white/60 hover:text-blue-600 hover:shadow-md"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-white" : "text-gray-500"
                    )} 
                  />
                  <span className={cn(
                    "transition-colors font-medium",
                    isActive ? "text-white" : "text-gray-700"
                  )}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

    </aside>
  );
}
