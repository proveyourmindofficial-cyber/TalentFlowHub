import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'system': return '⚙️';
    default: return '📢';
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success': return 'bg-green-50 border-green-200 text-green-800';
    case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'error': return 'bg-red-50 border-red-200 text-red-800';
    case 'system': return 'bg-blue-50 border-blue-200 text-blue-800';
    default: return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch unread notification count
  const { data: countData } = useQuery({
    queryKey: ['/api/notifications/unread/count'],
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  // Fetch all notifications when dropdown is opened
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: isOpen,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
  });

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsReadMutation.mutate(notificationId);
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const unreadCount = (countData as { count: number })?.count || 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative border-blue-200 hover:border-blue-300 bg-white/80 hover:bg-blue-50 rounded-xl transform transition-all duration-300 hover:scale-110"
          data-testid="button-notifications"
        >
          <Bell className="w-4 h-4 text-blue-600" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto bg-white shadow-xl border border-blue-100 rounded-xl"
      >
        <DropdownMenuLabel className="text-lg font-semibold text-blue-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-teal-50">
          🔔 Notifications
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              data-testid="button-mark-all-read"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-blue-100" />
        
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading notifications...
          </div>
        ) : !notifications || (Array.isArray(notifications) && notifications.length === 0) ? (
          <div className="p-6 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up! 🎉</p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {(notifications as Notification[])?.map((notification: Notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "p-3 border-l-4 mx-1 my-1 rounded-r-lg cursor-pointer transition-all duration-200",
                  notification.isRead 
                    ? "border-gray-200 bg-gray-50/50 hover:bg-gray-100" 
                    : getNotificationColor(notification.type)
                )}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                      <h4 className={cn(
                        "text-sm font-medium truncate",
                        notification.isRead ? "text-gray-600" : "text-gray-900"
                      )}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className={cn(
                      "text-xs leading-relaxed",
                      notification.isRead ? "text-gray-500" : "text-gray-700"
                    )}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="h-6 w-6 p-0 hover:bg-blue-100"
                        title="Mark as read"
                        data-testid={`mark-read-${notification.id}`}
                      >
                        <Check className="w-3 h-3 text-blue-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="h-6 w-6 p-0 hover:bg-red-100"
                      title="Delete notification"
                      data-testid={`delete-${notification.id}`}
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        
        {notifications && Array.isArray(notifications) && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-blue-100" />
            <div className="p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                data-testid="button-view-all"
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}