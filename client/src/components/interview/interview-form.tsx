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
  const watchedMode = form.watch("mode");
  const showFeedbackResult = watchedRound === "HR" && watchedStatus === "Completed";
  const isTeamsMode = watchedMode === "Teams";

  // Get available applications based on selected interview round
  const selectedRound = form.watch("interviewRound");
  
  const { data: applications, isLoading: applicationsLoading } = useQuery<ApplicationWithRelations[]>({
    queryKey: ["/api/applications/available-for-interview"],
    queryFn: async () => {
      const response = await fetch(`/api/applications/available-for-interview`);
      if (!response.ok) throw new Error('Failed to fetch available applications');
      const availableApps = await response.json();
      
      // If editing an interview, ensure the current application is included
      if (interview?.applicationId) {
        const currentAppExists = availableApps.find((app: any) => app.id === interview.applicationId);
        if (!currentAppExists) {
          // Fetch the current application details
          const currentAppResponse = await fetch(`/api/applications/${interview.applicationId}`);
          if (currentAppResponse.ok) {
            const currentApp = await currentAppResponse.json();
            return [currentApp, ...availableApps];
          }
        }
      }
      
      return availableApps;
    }
  });

  // Get potential interviewers from User Management
  const { data: interviewers = [], isLoading: interviewersLoading } = useQuery({
    queryKey: ["/api/users/interviewers"],
    queryFn: async () => {
      const response = await fetch("/api/users/interviewers");
      if (!response.ok) throw new Error('Failed to fetch interviewers');
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
              <Select onValueChange={field.onChange} value={field.value} disabled={interviewersLoading}>
                <FormControl>
                  <SelectTrigger data-testid="select-interviewer">
                    <SelectValue placeholder={interviewersLoading ? "Loading interviewers..." : "Select interviewer"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {interviewers.length > 0 ? (
                    interviewers.map((interviewer: any) => (
                      <SelectItem key={interviewer.id} value={`${interviewer.name} (${interviewer.email})`}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <span className="font-medium">{interviewer.name}</span>
                            <span className="text-sm text-muted-foreground">{interviewer.email}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: interviewer.roleColor }}
                            />
                            <span className="text-xs text-muted-foreground">{interviewer.role}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {interviewersLoading ? "Loading..." : "No interviewers available"}
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
                  <SelectItem value="Teams">Online → Teams</SelectItem>
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

        {/* Teams Meeting Information - Show if Teams mode and meeting URL exists */}
        {isTeamsMode && interview?.teamsMeetingUrl && (
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Microsoft Teams Meeting</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Join Meeting:</span>
                <a 
                  href={interview.teamsMeetingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-1a1 1 0 10-2 0v1H5V7h1a1 1 0 000-2H5z"></path>
                  </svg>
                  Join Teams Meeting
                </a>
              </div>
              
              {interview.teamsMeetingId && (
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Meeting ID: <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-blue-900 dark:text-blue-100">{interview.teamsMeetingId}</code>
                </div>
              )}
              
              {interview.teamsOrganizerEmail && (
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Organizer: {interview.teamsOrganizerEmail}
                </div>
              )}
            </div>
          </div>
        )}

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