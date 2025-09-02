import { Button } from "@/components/ui/button";
import { Plus, Bell } from "lucide-react";
import { Link } from "wouter";
import { ReactNode } from "react";

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
    <header className="bg-gradient-to-r from-white via-violet-50/50 to-purple-50/50 border-b border-violet-100 px-6 py-6 backdrop-blur-lg" data-testid="header">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h2 className="text-3xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent" data-testid="page-title">
            {title} ⚡
          </h2>
          <p className="text-gray-700 font-medium mt-1" data-testid="page-description">{description}</p>
        </div>
        <div className="flex items-center space-x-4 animate-fade-in-right">
          {action && action}
          {!action && showNewJobButton && (
            <Link href="/jobs/new">
              <Button 
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                data-testid="button-new-job"
              >
                <Plus className="w-4 h-4 mr-2" />
                🚀 New Job
              </Button>
            </Link>
          )}
          
          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="outline" 
              size="icon"
              className="relative border-violet-200 hover:border-violet-300 bg-white/80 hover:bg-violet-50 rounded-xl transform transition-all duration-300 hover:scale-110"
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4 text-violet-600" />
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                3
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
