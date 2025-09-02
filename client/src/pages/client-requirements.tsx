import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Eye, Edit, Trash2, Download, Upload } from "lucide-react";
import Header from "@/components/layout/header";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { insertClientRequirementSchema, insertClientSchema, type ClientRequirementWithRelations, type Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Form schemas
const clientRequirementFormSchema = insertClientRequirementSchema.extend({
  clientName: z.string().min(1, "Client name is required"),
});

const clientFormSchema = insertClientSchema;

type ClientRequirementFormData = z.infer<typeof clientRequirementFormSchema>;
type ClientFormData = z.infer<typeof clientFormSchema>;

export default function ClientRequirements() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRequirement, setEditingRequirement] = useState<ClientRequirementWithRelations | null>(null);
  const [viewingRequirement, setViewingRequirement] = useState<ClientRequirementWithRelations | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: requirements = [], isLoading } = useQuery<ClientRequirementWithRelations[]>({
    queryKey: ["/api/client-requirements"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Forms
  const requirementForm = useForm<ClientRequirementFormData>({
    resolver: zodResolver(clientRequirementFormSchema),
    defaultValues: {
      clientName: "",
      title: "",
      reqNumber: "",
      skillset: [],
      detailsText: "",
      status: "open",
    },
  });

  const clientForm = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: async (clientData: ClientFormData) => {
      return apiRequest("POST", "/api/clients", clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsClientFormOpen(false);
      clientForm.reset();
      toast({ title: "Success", description: "Client created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createRequirementMutation = useMutation({
    mutationFn: async (requirementData: ClientRequirementFormData) => {
      // Find or create client
      let clientId = "";
      const existingClient = clients.find(c => c.name.toLowerCase() === requirementData.clientName.toLowerCase());
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const newClient: any = await apiRequest("POST", "/api/clients", { name: requirementData.clientName });
        clientId = newClient.id;
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      }

      const { clientName, ...reqData } = requirementData;
      return apiRequest("POST", "/api/client-requirements", { ...reqData, clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-requirements"] });
      setIsFormOpen(false);
      setEditingRequirement(null);
      requirementForm.reset();
      toast({ title: "Success", description: "Requirement created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRequirementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientRequirementFormData> }) => {
      const { clientName, ...reqData } = data;
      return apiRequest("PUT", `/api/client-requirements/${id}`, reqData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-requirements"] });
      setIsFormOpen(false);
      setEditingRequirement(null);
      requirementForm.reset();
      toast({ title: "Success", description: "Requirement updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteRequirementMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/client-requirements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-requirements"] });
      toast({ title: "Success", description: "Requirement deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handlers
  const handleSubmitClient = (data: ClientFormData) => {
    createClientMutation.mutate(data);
  };

  const handleSubmitRequirement = (data: ClientRequirementFormData) => {
    if (editingRequirement) {
      updateRequirementMutation.mutate({ id: editingRequirement.id, data });
    } else {
      createRequirementMutation.mutate(data);
    }
  };

  const handleEdit = (requirement: ClientRequirementWithRelations) => {
    setEditingRequirement(requirement);
    requirementForm.reset({
      clientName: requirement.client?.name || "",
      title: requirement.title,
      reqNumber: requirement.reqNumber || "",
      skillset: requirement.skillset || [],
      detailsText: requirement.detailsText || "",
      status: requirement.status,
    });
    setIsFormOpen(true);
  };

  const handleView = (requirement: ClientRequirementWithRelations) => {
    setViewingRequirement(requirement);
    setIsDetailOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this requirement?")) {
      deleteRequirementMutation.mutate(id);
    }
  };

  // Filter requirements based on search
  const filteredRequirements = requirements.filter((req) =>
    req.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.skillset?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
    req.reqNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closed": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "hold": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="client-requirements-page">
      <Header 
        title="Client Requirements"
        description="Manage client requirements and track internal requirements."
        showNewJobButton={false}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-requirements"
              />
            </div>
            
            <div className="flex gap-2">
              <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-add-client">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                  </DialogHeader>
                  <Form {...clientForm}>
                    <form onSubmit={clientForm.handleSubmit(handleSubmitClient)} className="space-y-4">
                      <FormField
                        control={clientForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-client-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsClientFormOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" data-testid="button-save-client">
                          Save Client
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-requirement">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Requirement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRequirement ? "Edit Requirement" : "Add New Requirement"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...requirementForm}>
                    <form onSubmit={requirementForm.handleSubmit(handleSubmitRequirement)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={requirementForm.control}
                          name="clientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-requirement-client-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={requirementForm.control}
                          name="reqNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Req # (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} data-testid="input-req-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={requirementForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requirement Title</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-requirement-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={requirementForm.control}
                        name="skillset"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skillset (comma-separated)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., React, Node.js, TypeScript"
                                value={field.value?.join(", ") || ""}
                                onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                data-testid="input-skillset"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={requirementForm.control}
                        name="detailsText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requirement Details</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                value={field.value || ""}
                                rows={6}
                                placeholder="Paste the full requirement details here..."
                                data-testid="textarea-requirement-details"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={requirementForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                                <SelectItem value="hold">On Hold</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" data-testid="button-save-requirement">
                          {editingRequirement ? "Update" : "Save"} Requirement
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Requirements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements ({filteredRequirements.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredRequirements.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No requirements found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequirements.map((requirement) => (
                    <div key={requirement.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="font-semibold">{requirement.title}</h3>
                            <Badge className={getStatusColor(requirement.status)}>
                              {requirement.status}
                            </Badge>
                            {requirement.reqNumber && (
                              <Badge variant="outline">{requirement.reqNumber}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Client:</strong> {requirement.client?.name || "Unknown"}</p>
                            {requirement.skillset && requirement.skillset.length > 0 && (
                              <p><strong>Skills:</strong> {requirement.skillset.join(", ")}</p>
                            )}
                            <p><strong>Created:</strong> {requirement.createdAt ? new Date(requirement.createdAt).toLocaleDateString() : "Unknown"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(requirement)} data-testid={`button-view-${requirement.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(requirement)} data-testid={`button-edit-${requirement.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(requirement.id)} data-testid={`button-delete-${requirement.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Detail View Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingRequirement?.title}</DialogTitle>
          </DialogHeader>
          {viewingRequirement && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Client Information</h4>
                  <p><strong>Name:</strong> {viewingRequirement.client?.name || "Unknown"}</p>
                  {viewingRequirement.reqNumber && (
                    <p><strong>Req #:</strong> {viewingRequirement.reqNumber}</p>
                  )}
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${getStatusColor(viewingRequirement.status)}`}>
                      {viewingRequirement.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  {viewingRequirement.skillset && viewingRequirement.skillset.length > 0 && (
                    <div>
                      <p><strong>Skills:</strong></p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {viewingRequirement.skillset.map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {viewingRequirement.detailsText && (
                <div>
                  <h4 className="font-semibold mb-2">Requirement Details</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {viewingRequirement.detailsText}
                  </div>
                </div>
              )}

              {viewingRequirement.attachmentUrl && (
                <div>
                  <h4 className="font-semibold mb-2">Attachments</h4>
                  <Button variant="outline" onClick={() => window.open(viewingRequirement.attachmentUrl!, '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Attachment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}