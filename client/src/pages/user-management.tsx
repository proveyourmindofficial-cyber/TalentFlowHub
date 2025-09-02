import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Users, Shield, Edit, Search } from "lucide-react";
import type { User } from "@shared/schema";

const roleLabels = {
  director: "Director",
  am: "Account Manager", 
  recruiter: "Recruiter",
  hr: "HR Manager",
  candidate: "Candidate",
  client: "Client",
  bgc: "Background Check"
};

const roleColors = {
  director: "bg-purple-100 text-purple-800",
  am: "bg-blue-100 text-blue-800",
  recruiter: "bg-green-100 text-green-800", 
  hr: "bg-orange-100 text-orange-800",
  candidate: "bg-gray-100 text-gray-800",
  client: "bg-yellow-100 text-yellow-800",
  bgc: "bg-red-100 text-red-800"
};

export default function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  // Only directors can access user management
  if (currentUser?.role !== 'director') {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Access Restricted</h2>
        <p className="mt-2 text-gray-600">Only directors can manage user roles and permissions.</p>
      </div>
    );
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users'),
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      return apiRequest(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
      setEditingUser(null);
      setNewRole("");
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    }
  });

  const filteredUsers = users.filter((user: User) =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleUpdate = () => {
    if (editingUser && newRole) {
      updateUserRole.mutate({ userId: editingUser.id, role: newRole });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          <Shield className="w-4 h-4 mr-1" />
          Director Access
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Users ({filteredUsers.length})
          </CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-user-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role] || "bg-gray-100 text-gray-800"}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setNewRole(user.role);
                          }}
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update User Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">User</p>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Select New Role
                            </label>
                            <Select value={newRole} onValueChange={setNewRole}>
                              <SelectTrigger data-testid="select-new-role">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="director">Director</SelectItem>
                                <SelectItem value="am">Account Manager</SelectItem>
                                <SelectItem value="recruiter">Recruiter</SelectItem>
                                <SelectItem value="hr">HR Manager</SelectItem>
                                <SelectItem value="candidate">Candidate</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                                <SelectItem value="bgc">Background Check</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingUser(null);
                                setNewRole("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleRoleUpdate}
                              disabled={!newRole || updateUserRole.isPending}
                              data-testid="button-update-role"
                            >
                              {updateUserRole.isPending ? "Updating..." : "Update Role"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No users found</h3>
              <p className="mt-2 text-gray-600">
                {searchTerm ? "Try adjusting your search terms" : "No users have been created yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Assignment Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Auto-detected from Office 365:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
              <div>
                <Badge className="bg-purple-100 text-purple-800 mb-2">Director</Badge>
                <p className="text-gray-600">Job titles: Director, Head, CEO, CTO</p>
              </div>
              <div>
                <Badge className="bg-blue-100 text-blue-800 mb-2">Account Manager</Badge>
                <p className="text-gray-600">Job titles: Manager, Lead, Supervisor</p>
              </div>
              <div>
                <Badge className="bg-orange-100 text-orange-800 mb-2">HR Manager</Badge>
                <p className="text-gray-600">Department: HR, Human Resources</p>
              </div>
              <div>
                <Badge className="bg-green-100 text-green-800 mb-2">Recruiter</Badge>
                <p className="text-gray-600">Default for all other users</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Roles are automatically assigned based on your Office 365 profile when you first log in. 
                Directors can manually adjust roles as needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}