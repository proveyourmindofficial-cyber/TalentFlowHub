import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertInterviewSchema, type InsertInterview, type Interview, type ApplicationWithRelations } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const interviewFormSchema = insertInterviewSchema.extend({
  scheduledDate: z.string().min(1, "Scheduled date is required"),
}).omit({ 
  feedback: true 
}).refine((data) => {
  // If HR round and status is Completed, feedbackResult is required
  if (data.interviewRound === 'HR' && data.status === 'Completed') {
    return data.feedbackResult && data.feedbackResult.trim().length > 0;
  }
  return true;
}, {
  message: "Feedback Result is required for completed HR interviews",
  path: ["feedbackResult"]
});

type InterviewFormData = z.infer<typeof interviewFormSchema>;

interface InterviewFormProps {
  interview?: Interview;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InterviewForm({ interview, onSuccess, onCancel }: InterviewFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InterviewFormData>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      applicationId: interview?.applicationId || "",
      interviewRound: interview?.interviewRound || "L1",
      interviewer: interview?.interviewer || "",
      mode: interview?.mode || "Online",
      scheduledDate: interview?.scheduledDate 
        ? new Date(interview.scheduledDate).toISOString().slice(0, 16)
        : "",
      notes: interview?.notes || "",
      feedbackResult: interview?.feedbackResult || undefined,
      status: interview?.status || "Scheduled"
    }
  });

  // Watch for changes in interview round and status to control field visibility
  const watchedRound = form.watch("interviewRound");
  const watchedStatus = form.watch("status");
  const showFeedbackResult = watchedRound === "HR" && watchedStatus === "Completed";

  // Get available applications based on selected interview round
  const selectedRound = form.watch("interviewRound");
  
  const { data: applications, isLoading: applicationsLoading } = useQuery<ApplicationWithRelations[]>({
    queryKey: ["/api/applications/available-for-interview"],
    queryFn: async () => {
      const response = await fetch(`/api/applications/available-for-interview`);
      if (!response.ok) throw new Error('Failed to fetch available applications');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InterviewFormData) => {
      const payload = {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString()
      };
      return await apiRequest("POST", "/api/interviews", payload);
    },
    onSuccess: () => {
      // Invalidate all queries affected by interview creation automation
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      toast({
        title: "Success",
        description: "Interview created successfully"
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create interview",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InterviewFormData) => {
      const payload = {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString()
      };
      return await apiRequest("PUT", `/api/interviews/${interview!.id}`, payload);
    },
    onSuccess: () => {
      // Invalidate all queries affected by interview update automation
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      toast({
        title: "Success",
        description: "Interview updated successfully"
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update interview",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InterviewFormData) => {
    if (interview) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (applicationsLoading && selectedRound) {
    return <div>Loading available candidates for {selectedRound} round...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="applicationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-application">
                    <SelectValue placeholder="Select an application" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {applications && applications.length > 0 ? (
                    applications.map((application) => (
                      <SelectItem key={application.id} value={application.id}>
                        {application.candidate?.name} - {application.job?.title}
                      </SelectItem>
                    ))
                  ) : selectedRound ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No candidates available for {selectedRound} round
                    </div>
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Select interview round first
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
          name="interviewRound"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interview Round</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-interview-round">
                    <SelectValue placeholder="Select interview round" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="L1">L1</SelectItem>
                  <SelectItem value="L2">L2</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interviewer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interviewer</FormLabel>
              <FormControl>
                <Input placeholder="Enter interviewer name/email" {...field} data-testid="input-interviewer" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interview Mode</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-mode">
                    <SelectValue placeholder="Select interview mode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
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
              <FormLabel>Scheduled Date & Time</FormLabel>
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

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter detailed notes and observations from the interview..."
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                  data-testid="textarea-notes" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showFeedbackResult && (
          <FormField
            control={form.control}
            name="feedbackResult"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feedback Result</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-feedback-result">
                      <SelectValue placeholder="Select feedback result" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Selected">Selected</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="No Show">No Show</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2 pt-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading ? "Saving..." : interview ? "Update Interview" : "Create Interview"}
          </Button>
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
        </div>
      </form>
    </Form>
  );
}