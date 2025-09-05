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
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyBranding } from "@/hooks/useCompanyProfile";

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

  const userPermissions = permissionsData?.permissions || {};
  const userRole = permissionsData?.role;

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
    <aside className="w-64 bg-gradient-to-b from-white via-violet-50/30 to-purple-50/30 shadow-2xl border-r border-violet-100 flex flex-col backdrop-blur-lg" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-violet-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-300 hover:rotate-12">
            <Users className="text-white w-6 h-6" />
          </div>
          <div>
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt={companyName}
                className="h-8 w-auto max-w-32 object-contain"
              />
            ) : (
              <h1 className="text-xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {companyLoading ? 'Loading...' : companyName}
              </h1>
            )}
            <p className="text-xs text-violet-600 font-medium">{tagline}</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-violet-100">
        <div className="flex items-center space-x-3 bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-xl border border-violet-100">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Users className="text-white w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{userRole?.name || 'User'} {userRole?.name === 'Super Admin' ? '🔥' : '⚡'}</p>
            <p className="text-xs text-violet-600 font-medium">{user?.firstName} {user?.lastName}</p>
          </div>
          <Settings className="text-violet-500 w-4 h-4 cursor-pointer hover:text-violet-700 transform transition-all duration-300 hover:rotate-90" />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href} data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors sidebar-item",
                  isActive
                    ? "bg-blue-50 border-l-4 border-primary"
                    : "text-gray-700 hover:text-primary"
                )}
              >
                <item.icon 
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary" : "text-gray-400"
                  )} 
                />
                <span className={cn(
                  isActive ? "text-primary font-medium" : ""
                )}>
                  {item.name}
                </span>
                {item.badge !== undefined && (
                  <span 
                    className={cn(
                      "ml-auto text-xs px-2 py-1 rounded-full",
                      item.badgeType === "error" 
                        ? "bg-error text-white" 
                        : "bg-gray-200 text-gray-600"
                    )}
                  >
                    ({item.badge})
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        
        <div className="pt-4 border-t border-gray-200 mt-4">
          {secondaryNav.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href} data-testid={`nav-${item.name.toLowerCase()}`}>
                <div
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors sidebar-item",
                    isActive
                      ? "bg-blue-50 border-l-4 border-primary"
                      : "text-gray-700 hover:text-primary"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-primary" : "text-gray-400"
                    )} 
                  />
                  <span className={cn(
                    isActive ? "text-primary font-medium" : ""
                  )}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-violet-100">
        <Button
          onClick={logout}
          variant="outline"
          className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50 border-gray-200 hover:border-red-200"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
