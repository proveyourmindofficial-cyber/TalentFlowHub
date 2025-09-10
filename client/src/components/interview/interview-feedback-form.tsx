import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertInterviewFeedbackSchema, type InsertInterviewFeedback } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, ThumbsUp, ThumbsDown, Award, MessageSquare } from "lucide-react";
import { useState } from "react";

interface InterviewFeedbackFormProps {
  interviewId: string;
  candidateName: string;
  jobTitle: string;
  existingFeedback?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InterviewFeedbackForm({ 
  interviewId, 
  candidateName, 
  jobTitle, 
  existingFeedback, 
  onSuccess, 
  onCancel 
}: InterviewFeedbackFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertInterviewFeedback>({
    resolver: zodResolver(insertInterviewFeedbackSchema),
    defaultValues: {
      interviewId,
      overallRecommendation: existingFeedback?.overallRecommendation || undefined,
      technicalSkills: existingFeedback?.technicalSkills || undefined,
      communicationSkills: existingFeedback?.communicationSkills || undefined,
      problemSolving: existingFeedback?.problemSolving || undefined,
      culturalFit: existingFeedback?.culturalFit || undefined,
      strengthsComments: existingFeedback?.strengthsComments || "",
      improvementAreas: existingFeedback?.improvementAreas || "",
      detailedNotes: existingFeedback?.detailedNotes || "",
      wouldWorkWithAgain: existingFeedback?.wouldWorkWithAgain || false,
      confidenceLevel: existingFeedback?.confidenceLevel || undefined,
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertInterviewFeedback) => {
      const endpoint = existingFeedback 
        ? `/api/interviews/${interviewId}/feedback` 
        : `/api/interviews/${interviewId}/feedback`;
      const method = existingFeedback ? "PUT" : "POST";
      return await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: [`/api/interviews/${interviewId}/feedback`] });
      toast({
        title: "Success",
        description: "Interview feedback submitted successfully"
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: InsertInterviewFeedback) => {
    submitMutation.mutate(data);
  };

  const StarRating = ({ value, onChange, label }: { value?: string; onChange: (value: string) => void; label: string }) => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium min-w-[120px]">{label}:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating.toString())}
              className={`text-lg transition-colors ${
                value && parseInt(value) >= rating
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-gray-300 hover:text-yellow-400"
              }`}
              data-testid={`star-${label.toLowerCase().replace(/\s+/g, '-')}-${rating}`}
            >
              <Star className="h-5 w-5 fill-current" />
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 min-w-[60px]">
          {value ? `${value}/5` : "Not rated"}
        </span>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Interview Feedback
        </CardTitle>
        <CardDescription>
          Comprehensive feedback for <strong>{candidateName}</strong> - {jobTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Overall Recommendation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ThumbsUp className="h-5 w-5" />
                Overall Assessment
              </h3>
              
              <FormField
                control={form.control}
                name="overallRecommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Recommendation</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      data-testid="select-overall-recommendation"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your overall recommendation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Strong Hire">🟢 Strong Hire</SelectItem>
                        <SelectItem value="Hire">✅ Hire</SelectItem>
                        <SelectItem value="Maybe">🟡 Maybe</SelectItem>
                        <SelectItem value="No Hire">❌ No Hire</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Your overall hiring recommendation based on this interview
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Skills Assessment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5" />
                Skills Assessment (1-5 Scale)
              </h3>
              
              <div className="grid gap-4 bg-gray-50 p-4 rounded-lg">
                <FormField
                  control={form.control}
                  name="technicalSkills"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        label="Technical Skills"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="communicationSkills"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        label="Communication"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="problemSolving"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        label="Problem Solving"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="culturalFit"
                  render={({ field }) => (
                    <FormItem>
                      <StarRating
                        value={field.value}
                        onChange={field.onChange}
                        label="Cultural Fit"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Detailed Feedback */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Detailed Feedback
              </h3>
              
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="strengthsComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Strengths</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What did the candidate do well? Highlight their key strengths..."
                          className="min-h-[100px]"
                          data-testid="textarea-strengths"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="improvementAreas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Areas for Improvement</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What could the candidate improve on? Areas where they struggled..."
                          className="min-h-[100px]"
                          data-testid="textarea-improvements"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="detailedNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any additional observations, specific examples, or context that would be helpful..."
                          className="min-h-[120px]"
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormDescription>
                        Include specific examples, questions asked, candidate responses, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Assessment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Assessment</h3>
              
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="wouldWorkWithAgain"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-work-again"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I would be comfortable working with this candidate
                        </FormLabel>
                        <FormDescription>
                          Based on the interview, would you feel confident collaborating with this person?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confidenceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confidence in Assessment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-confidence">
                            <SelectValue placeholder="How confident are you in this assessment?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Not very confident</SelectItem>
                          <SelectItem value="2">2 - Somewhat confident</SelectItem>
                          <SelectItem value="3">3 - Moderately confident</SelectItem>
                          <SelectItem value="4">4 - Very confident</SelectItem>
                          <SelectItem value="5">5 - Extremely confident</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Rate how confident you are in your overall assessment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 pt-6 border-t">
              <Button 
                type="submit" 
                disabled={submitMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-submit-feedback"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
              
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  data-testid="button-cancel-feedback"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}