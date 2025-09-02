import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertApplication, Application, Job, Candidate } from "@shared/schema";

const applicationStages = [
  "Applied",
  "Shortlisted", 
  "L1 Scheduled",
  "L2 Scheduled",
  "Selected",
  "Offer Released",
  "Joined",
  "Rejected",
  "No Show",
  "Not Joined",
  "On Hold"
] as const;

const applicationFormSchema = z.object({
  jobId: z.string().min(1, "Job is required"),
  candidateId: z.string().min(1, "Candidate is required"),
  stage: z.enum(applicationStages, {
    errorMap: () => ({ message: "Please select a valid stage" })
  }),
  scheduledDate: z.string().optional(),
  feedback: z.string().optional()
});

type ApplicationFormData = z.infer<typeof applicationFormSchema>;

interface ApplicationFormProps {
  application?: Application;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApplicationForm({ application, onSuccess, onCancel }: ApplicationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"]
  });

  // For new applications, only show Available candidates
  // For editing, show all candidates since the application already exists
  const candidatesEndpoint = application ? "/api/candidates" : "/api/candidates/available-for-application";
  const { data: candidates, isLoading: candidatesLoading } = useQuery<Candidate[]>({
    queryKey: [candidatesEndpoint]
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      jobId: application?.jobId || "",
      candidateId: application?.candidateId || "",
      stage: application?.stage || "Applied",
      scheduledDate: application?.scheduledDate 
        ? new Date(application.scheduledDate).toISOString().slice(0, 16)
        : "",
      feedback: application?.feedback || ""
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const payload: InsertApplication = {
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null
      };
      return await apiRequest("POST", "/api/applications", payload);
    },
    onSuccess: () => {
      // Invalidate all queries affected by application creation automation
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates/available-for-application"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      toast({
        title: "Success",
        description: "Application created successfully"
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create application",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const payload = {
        ...data,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null
      };
      return await apiRequest("PUT", `/api/applications/${application!.id}`, payload);
    },
    onSuccess: () => {
      // Invalidate all queries affected by application update automation
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      toast({
        title: "Success",
        description: "Application updated successfully"
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ApplicationFormData) => {
    if (application) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (jobsLoading || candidatesLoading) {
    return <div>Loading form data...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="jobId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Position</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-job">
                      <SelectValue placeholder="Select a job position" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {jobs?.map((job) => (
                      <SelectItem key={job.id} value={job.id} data-testid={`job-option-${job.id}`}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="candidateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Candidate</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-candidate">
                      <SelectValue placeholder="Select a candidate" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {candidates && candidates.length > 0 ? (
                      candidates.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id} data-testid={`candidate-option-${candidate.id}`}>
                          {candidate.name} ({candidate.primarySkill})
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        {application ? "No candidates found" : "No available candidates (all have been applied)"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application Stage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-stage">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {applicationStages.map((stage) => (
                      <SelectItem key={stage} value={stage} data-testid={`stage-option-${stage}`}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled Date (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    data-testid="input-scheduled-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter feedback or notes about the application..."
                  className="min-h-[100px]"
                  {...field}
                  data-testid="textarea-feedback"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading
              ? application
                ? "Updating..."
                : "Creating..."
              : application
              ? "Update Application"
              : "Create Application"}
          </Button>
        </div>
      </form>
    </Form>
  );
}