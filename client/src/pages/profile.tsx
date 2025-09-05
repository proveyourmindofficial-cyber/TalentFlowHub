import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { User, Mail, Building, UserCircle, Save, Camera } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    department: user?.department || '',
    profileImageUrl: user?.profileImageUrl || ''
  });

  // Fetch user permissions and role
  const { data: permissionsData } = useQuery({
    queryKey: ['/api/user/permissions'],
    enabled: !!user,
  });

  const userRole = (permissionsData as any)?.role;

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PUT", `/api/users/${user?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user/permissions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      department: user?.department || '',
      profileImageUrl: user?.profileImageUrl || ''
    });
    setIsEditing(false);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <div className="flex flex-col h-full" data-testid="profile-page">
      <Header 
        title="My Profile"
        description="Manage your account information and preferences"
        showNewJobButton={false}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="border-blue-100 shadow-xl bg-gradient-to-r from-blue-50/50 to-teal-50/50">
            <CardHeader>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={formData.profileImageUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-2xl font-bold">
                      {getInitials(formData.firstName, formData.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white border-blue-200 hover:border-blue-300"
                      data-testid="button-change-avatar"
                    >
                      <Camera className="w-4 h-4 text-blue-600" />
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    {formData.firstName} {formData.lastName}
                  </h1>
                  <p className="text-lg text-blue-600 font-medium">
                    {userRole?.name || 'User'} {userRole?.name === 'Super Admin' ? '🔥' : '⚡'}
                  </p>
                  <p className="text-gray-600">{formData.email}</p>
                  {formData.department && (
                    <p className="text-gray-600">{formData.department}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                      data-testid="button-edit-profile"
                    >
                      <UserCircle className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-gray-300"
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                        data-testid="button-save-profile"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Information */}
          <Card className="border-blue-100 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className={`${!isEditing ? 'bg-gray-50 cursor-default' : 'focus:border-blue-500'}`}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className={`${!isEditing ? 'bg-gray-50 cursor-default' : 'focus:border-blue-500'}`}
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className={`pl-10 ${!isEditing ? 'bg-gray-50 cursor-default' : 'focus:border-blue-500'}`}
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-gray-700 font-medium">Department</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={!isEditing}
                    className={`pl-10 ${!isEditing ? 'bg-gray-50 cursor-default' : 'focus:border-blue-500'}`}
                    data-testid="input-department"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="border-blue-100 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <UserCircle className="w-5 h-5 mr-2" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-700 font-medium">User ID</Label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">{user?.id}</p>
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Role</Label>
                  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 font-medium">
                    {userRole?.name || 'User'} {userRole?.name === 'Super Admin' ? '🔥' : '⚡'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}