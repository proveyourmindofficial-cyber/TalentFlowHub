import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import { ReactNode } from "react";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import SmartImportDialog from "@/components/job/smart-import-dialog";

interface HeaderProps {
  title: string;
  description?: string;
  showNewJobButton?: boolean;
  action?: ReactNode;
}

export default function Header({ 
  title, 
  description = "Welcome back! Here's what's happening with your recruitment pipeline.",
  showNewJobButton = true,
  action
}: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-white via-blue-50/50 to-teal-50/50 border-b border-blue-100 px-6 py-6 backdrop-blur-lg" data-testid="header">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent" data-testid="page-title">
            {title} ⚡
          </h2>
          <p className="text-gray-700 font-medium mt-1" data-testid="page-description">{description}</p>
        </div>
        <div className="flex items-center space-x-4 animate-fade-in-right">
          {action && action}
          {!action && showNewJobButton && (
            <>
              <SmartImportDialog />
              <Link href="/jobs/new">
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold rounded-xl transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  data-testid="button-new-job"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  🚀 New Job
                </Button>
              </Link>
            </>
          )}
          
          {/* Notifications */}
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}
