import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertJobSchema, type Job } from "@shared/schema";
import { z } from "zod";
import { parseJobPosting, type ParsedJobData } from "@/utils/jobParser";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface JobFormProps {
  jobId?: string;
}

const jobFormSchema = insertJobSchema.extend({
  skills: z.string().optional(),
});

export default function JobForm({ jobId }: JobFormProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!jobId;
  const [smartImportData, setSmartImportData] = useState<ParsedJobData | null>(null);
  const [showSmartImportBanner, setShowSmartImportBanner] = useState(false);

  // Check for Smart Import data and URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1]);
    const isSmartImport = urlParams.get('import') === 'smart';
    
    if (isSmartImport && !isEditing) {
      const savedData = sessionStorage.getItem('smartImportData');
      if (savedData) {
        try {
          const parsedData: ParsedJobData = JSON.parse(savedData);
          setSmartImportData(parsedData);
          setShowSmartImportBanner(true);
          
          // Pre-fill form with smart import data
          form.reset({
            title: parsedData.title || "",
            description: parsedData.description || "",
            requirements: parsedData.requirements || "",
            responsibilities: parsedData.responsibilities || "",
            department: parsedData.department || "",
            location: parsedData.location || "",
            salaryMin: parsedData.salaryMin || undefined,
            salaryMax: parsedData.salaryMax || undefined,
            jobType: parsedData.jobType || "full_time",
            status: "draft",
            priority: "medium",
            experienceLevel: parsedData.experienceLevel || "",
            skills: parsedData.skills || "",
            benefits: parsedData.benefits || "",
            isRemoteAvailable: parsedData.isRemoteAvailable || false,
            applicationDeadline: undefined,
          });

          // Clear the smart import data from sessionStorage
          sessionStorage.removeItem('smartImportData');
          
          toast({
            title: "✨ Smart Import Successful!",
            description: "Form pre-filled with extracted job details. Review and save!",
          });
        } catch (error) {
          console.error('Failed to parse smart import data:', error);
        }
      }
    }
  }, [location, form, isEditing, toast]);

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: isEditing,
  });

  const form = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      responsibilities: "",
      department: "",
      location: "",
      salaryMin: undefined,
      salaryMax: undefined,
      jobType: "full_time",
      status: "draft",
      priority: "medium",
      experienceLevel: "",
      skills: "",
      benefits: "",
      isRemoteAvailable: false,
      applicationDeadline: undefined,
    },
  });

  // Update form when job data is loaded
  useEffect(() => {
    if (job && isEditing) {
      const skillsString = job.skills ? job.skills.join(", ") : "";
      form.reset({
        ...job,
        skills: skillsString,
        salaryMin: job.salaryMin || undefined,
        salaryMax: job.salaryMax || undefined,
        applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] as any : undefined,
      });
    }
  }, [job, isEditing]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobFormSchema>) => {
      const jobData = {
        ...data,
        skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
      };
      return apiRequest("POST", "/api/jobs", jobData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setLocation("/jobs");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobFormSchema>) => {
      const jobData = {
        ...data,
        skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
      };
      return apiRequest("PUT", `/api/jobs/${jobId}`, jobData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      setLocation("/jobs");
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof jobFormSchema>) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading && isEditing) {
    return (
      <Card data-testid="job-form-loading">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" data-testid="job-form">
      {showSmartImportBanner && smartImportData && (
        <Alert className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>✨ Smart Import Successful!</strong> 
                <span className="ml-2">Form auto-filled with extracted job details.</span>
              </div>
              <Badge variant="outline" className="bg-purple-100 text-purple-700">
                🆓 FREE AI Parser
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Edit Job" : showSmartImportBanner ? "Review & Create Job" : "Create New Job"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior Frontend Developer" {...field} data-testid="input-job-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Engineering" {...field} data-testid="input-department" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-job-type">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full_time">Full Time</SelectItem>
                          <SelectItem value="part_time">Part Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. New York, NY" {...field} value={field.value || ""} data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salaryMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g. 50000" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-salary-min"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salaryMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g. 80000" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-salary-max"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-status">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-priority">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior, Mid-level, Junior" {...field} value={field.value || ""} data-testid="input-experience-level" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applicationDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Deadline</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          value={field.value ? (typeof field.value === 'string' ? field.value : field.value.toISOString().split('T')[0]) : ""}
                          data-testid="input-deadline"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isRemoteAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Remote Work Available</FormLabel>
                        <FormDescription>
                          Can this position be performed remotely?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-remote"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the role, company culture, and what makes this opportunity unique..."
                        rows={4}
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List the required qualifications, skills, and experience..."
                        rows={4}
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-requirements"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsibilities</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the key responsibilities and day-to-day tasks..."
                        rows={4}
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-responsibilities"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="React, TypeScript, Node.js (comma separated)"
                        {...field}
                        data-testid="input-skills"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter skills separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Health insurance, 401k, flexible hours, remote work options..."
                        rows={3}
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-benefits"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end space-x-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation("/jobs")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-job"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : (isEditing ? "Update Job" : "Create Job")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
