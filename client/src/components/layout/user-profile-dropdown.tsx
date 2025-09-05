import { useState } from "react";
import { User, Settings, LogOut, UserCircle, Shield } from "lucide-react";
import { useAuth, logout } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

interface UserProfileDropdownProps {
  userRole?: any;
  user: any;
}

export default function UserProfileDropdown({ userRole, user }: UserProfileDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="p-0 h-auto bg-transparent hover:bg-transparent"
          data-testid="user-profile-trigger"
        >
          <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-teal-50 p-3 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300 cursor-pointer">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-sm font-bold">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">
                {userRole?.name || 'User'} {userRole?.name === 'Super Admin' ? '🔥' : '⚡'}
              </p>
              <p className="text-xs text-blue-600 font-medium">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <Settings className="text-blue-500 w-4 h-4 transform transition-all duration-300 hover:rotate-90" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-72 bg-white/95 backdrop-blur-lg border-blue-100 shadow-2xl rounded-xl" 
        align="start"
        data-testid="user-profile-dropdown"
      >
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white font-bold">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-blue-600 font-medium">
                {userRole?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email}
              </p>
              {user?.department && (
                <p className="text-xs text-gray-500">
                  {user.department}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-blue-100" />
        
        <Link href="/profile">
          <DropdownMenuItem 
            className="px-4 py-3 cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
            data-testid="menu-view-profile"
          >
            <UserCircle className="w-4 h-4 mr-3 text-blue-600" />
            <span>View Profile</span>
          </DropdownMenuItem>
        </Link>
        
        <Link href="/settings">
          <DropdownMenuItem 
            className="px-4 py-3 cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
            data-testid="menu-account-settings"
          >
            <Settings className="w-4 h-4 mr-3 text-blue-600" />
            <span>Account Settings</span>
          </DropdownMenuItem>
        </Link>
        
        {userRole?.name === 'Super Admin' && (
          <Link href="/admin">
            <DropdownMenuItem 
              className="px-4 py-3 cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
              data-testid="menu-admin-panel"
            >
              <Shield className="w-4 h-4 mr-3 text-blue-600" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          </Link>
        )}
        
        <DropdownMenuSeparator className="bg-blue-100" />
        
        <DropdownMenuItem 
          className="px-4 py-3 cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600"
          onClick={handleLogout}
          data-testid="menu-logout"
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}