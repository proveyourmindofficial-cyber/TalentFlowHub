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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Shield, 
  Edit, 
  Search, 
  Plus, 
  Trash2,
  UserPlus,
  AlertTriangle,
  Mail
} from "lucide-react";
import type { User } from "@shared/schema";

// Remove old role system - using only custom roles now

// Super admin configuration
const SUPER_ADMIN_EMAIL = "itsupport@o2finfosolutions.com";

interface AddUserForm {
  email: string;
  firstName: string;
  lastName: string;
  customRoleId: string;
  department: string;
}

export default function UserManagementSettings() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newCustomRole, setNewCustomRole] = useState<string>("");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState<AddUserForm>({
    email: "",
    firstName: "",
    lastName: "",
    customRoleId: "",
    department: ""
  });

  // Fetch custom roles for assignment
  const { data: customRoles = [] } = useQuery({
    queryKey: ['/api/custom-roles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/custom-roles');
      return await response.json();
    },
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users-with-custom-roles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users-with-custom-roles');
      return await response.json();
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, customRoleId }: { userId: string, customRoleId: string }) => {
      return apiRequest('PUT', `/api/users/${userId}/role`, { customRoleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users-with-custom-roles'] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
      setEditingUser(null);
      setNewCustomRole("");
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateUserCustomRole = useMutation({
    mutationFn: async ({ userId, customRoleId }: { userId: string, customRoleId: string | null }) => {
      const response = await apiRequest('PUT', `/api/users/${userId}/custom-role`, { customRoleId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users-with-custom-roles'] });
      toast({
        title: "Custom Role Updated",
        description: "User custom role has been updated successfully.",
      });
      setEditingUser(null);
      setNewCustomRole("");
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user custom role. Please try again.",
        variant: "destructive",
      });
    }
  });

  const addUser = useMutation({
    mutationFn: async (userData: AddUserForm) => {
      return apiRequest('POST', '/api/users', {
        username: userData.email,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        customRoleId: userData.customRoleId === "none" ? null : userData.customRoleId,
        department: userData.department,
        isActive: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users-with-custom-roles'] });
      toast({
        title: "User Added",
        description: "User added successfully and invitation email sent!",
      });
      setAddUserDialogOpen(false);
      setAddUserForm({
        email: "",
        firstName: "",
        lastName: "",
        customRoleId: "",
        department: ""
      });
    },
    onError: () => {
      toast({
        title: "Add User Failed",
        description: "Failed to add new user. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users-with-custom-roles'] });
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Resend invitation email mutation
  const resendInvitation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('POST', `/api/users/${userId}/resend-invitation`);
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Invitation email has been resent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Check if current user is super admin
  const isSuperAdmin = (email: string) => email === SUPER_ADMIN_EMAIL;

  const filteredUsers = users.filter((user: User) =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user as any).customRole?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleAddUser = () => {
    if (addUserForm.email && addUserForm.firstName && addUserForm.lastName) {
      addUser.mutate(addUserForm);
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.email === SUPER_ADMIN_EMAIL) {
      toast({
        title: "Cannot Delete",
        description: "Super admin account cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete user ${user.firstName} ${user.lastName}?`)) {
      deleteUser.mutate(user.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>User Management ({filteredUsers.length} users)</CardTitle>
            </div>
            <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={addUserForm.firstName}
                        onChange={(e) => setAddUserForm({...addUserForm, firstName: e.target.value})}
                        placeholder="Enter first name"
                        data-testid="input-add-first-name"
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        value={addUserForm.lastName}
                        onChange={(e) => setAddUserForm({...addUserForm, lastName: e.target.value})}
                        placeholder="Enter last name"
                        data-testid="input-add-last-name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm({...addUserForm, email: e.target.value})}
                      placeholder="Enter email address"
                      data-testid="input-add-email"
                    />
                  </div>

                  <div>
                    <Label>Department</Label>
                    <Input
                      value={addUserForm.department}
                      onChange={(e) => setAddUserForm({...addUserForm, department: e.target.value})}
                      placeholder="Enter department"
                      data-testid="input-add-department"
                    />
                  </div>
                  
                  <div>
                    <Label>Role</Label>
                    <Select value={addUserForm.customRoleId} onValueChange={(value) => setAddUserForm({...addUserForm, customRoleId: value})}>
                      <SelectTrigger data-testid="select-add-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Role</SelectItem>
                        {customRoles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: role.color || '#6366f1' }}
                              />
                              {role.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setAddUserDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddUser}
                      disabled={!addUserForm.email || !addUserForm.firstName || !addUserForm.lastName || addUser.isPending}
                      data-testid="button-add-user"
                    >
                      {addUser.isPending ? "Adding..." : "Add User"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
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
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {user.firstName} {user.lastName}
                        {isSuperAdmin(user.email || '') && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Super Admin
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>
                    {(user as any).customRole ? (
                      <Badge 
                        className="text-white" 
                        style={{ backgroundColor: (user as any).customRole.color || '#6366f1' }}
                      >
                        {(user as any).customRole.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">No role assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setNewCustomRole((user as any).customRole?.id || "");
                            }}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Role to User</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-600">User</p>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            
                            {(user as any).customRole && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">Current Role:</p>
                                <Badge 
                                  className="text-white" 
                                  style={{ backgroundColor: (user as any).customRole.color || '#6366f1' }}
                                >
                                  {(user as any).customRole.name}
                                </Badge>
                              </div>
                            )}
                            
                            <div>
                              <Label>Assign Role</Label>
                              <Select value={newCustomRole} onValueChange={setNewCustomRole}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role for this user" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No Role</SelectItem>
                                  {customRoles.map((role: any) => (
                                    <SelectItem key={role.id} value={role.id}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: role.color || '#6366f1' }}
                                        />
                                        {role.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingUser(null);
                                  setNewCustomRole("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => updateUserCustomRole.mutate({ 
                                  userId: user.id, 
                                  customRoleId: newCustomRole === "none" ? null : newCustomRole 
                                })}
                                disabled={updateUserCustomRole.isPending}
                                data-testid="button-update-role"
                              >
                                {updateUserCustomRole.isPending ? "Updating..." : "Assign Role"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {!isSuperAdmin(user.email || '') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Resend Invitation Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendInvitation.mutate(user.id)}
                        disabled={resendInvitation.isPending}
                        className="text-blue-600 hover:text-blue-700"
                        data-testid={`button-resend-invitation-${user.id}`}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        {resendInvitation.isPending ? "Sending..." : "Resend Invite"}
                      </Button>
                    </div>
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
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Control Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Super Admin Access</span>
              </div>
              <p className="text-blue-800 text-sm">
                Super Admin ({SUPER_ADMIN_EMAIL}) has full system access and cannot be deleted or have role changed.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Custom Role System</span>
              </div>
              <p className="text-green-800 text-sm">
                All access control is now managed through custom roles with granular permissions. Create roles in the Custom Roles section and assign them to users here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}