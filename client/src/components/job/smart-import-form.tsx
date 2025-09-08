import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertJobSchema } from "@shared/schema";
import { z } from "zod";
import { parseJobPosting } from "@/utils/jobParser";
import { 
  FileText, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Copy,
  RotateCcw,
  Wand2,
  Sparkles
} from "lucide-react";

const smartImportSchema = insertJobSchema.extend({
  skills: z.string().optional(),
});

export default function SmartImportForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [jobText, setJobText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const form = useForm<z.infer<typeof smartImportSchema>>({
    resolver: zodResolver(smartImportSchema),
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

  const handleAnalyze = async () => {
    if (!jobText.trim()) {
      toast({
        title: "No Content",
        description: "Please paste your job posting text first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const parsed = parseJobPosting(jobText);
      setHasAnalyzed(true);
      
      // Auto-fill form with parsed data
      form.reset({
        title: parsed.title || "",
        description: parsed.description || "",
        requirements: parsed.requirements || "",
        responsibilities: parsed.responsibilities || "",
        department: parsed.department || "",
        location: parsed.location || "",
        salaryMin: parsed.salaryMin || undefined,
        salaryMax: parsed.salaryMax || undefined,
        jobType: (parsed.jobType as any) || "full_time",
        status: "draft",
        priority: "medium",
        experienceLevel: parsed.experienceLevel || "",
        skills: parsed.skills || "",
        benefits: parsed.benefits || "",
        isRemoteAvailable: parsed.isRemoteAvailable || false,
        applicationDeadline: undefined,
      });
      
      const detectedCount = Object.values(parsed).filter(Boolean).length;
      toast({
        title: "✨ Analysis Complete!",
        description: `Extracted ${detectedCount} job details. Review and create your job!`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to parse the job posting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof smartImportSchema>) => {
      const jobData = {
        ...data,
        skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
      };
      return apiRequest("POST", "/api/jobs", jobData);
    },
    onSuccess: () => {
      toast({
        title: "🎉 Job Created!",
        description: "Your job has been created successfully from Smart Import!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setLocation("/jobs");
    },
    onError: (error) => {
      console.error('Job creation error:', error);
      toast({
        title: "Creation Failed", 
        description: error.message || "Failed to create job. Please ensure all required fields are filled.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof smartImportSchema>) => {
    console.log('🚀 SMART IMPORT - Form submitted:', data);
    
    // Auto-fill required fields if empty
    if (!data.title) data.title = "Job Position";
    if (!data.department) data.department = "General";
    
    toast({
      title: "🚀 Creating Job...",
      description: "Smart Import is creating your job posting!",
    });
    
    createMutation.mutate(data);
  };

  const handleReset = () => {
    setJobText("");
    setHasAnalyzed(false);
    form.reset();
  };

  const handleSamplePaste = () => {
    const sampleJob = `🚀 We're Hiring: Senior Software Engineer
📍 Location: Hyderabad, India  
💰 Salary: ₹8-15 LPA
🕓 Experience: 4-7 years
🏢 Department: IT

🎯 About the Role:
We're looking for a passionate Senior Software Engineer to join our growing technology team.

✅ Key Requirements:
• 4+ years of experience in React, Node.js
• Strong knowledge of database design
• Experience with cloud platforms
• Excellent problem-solving skills

🔧 Key Responsibilities:
• Develop and maintain scalable web applications
• Collaborate with cross-functional teams
• Code review and mentor junior developers

📧 Apply: careers@o2finfosolutions.com`;
    
    setJobText(sampleJob);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6" data-testid="smart-import-form">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
            <Wand2 className="w-6 h-6 mr-3 text-purple-600" />
            Smart Import - AI Job Parser
            <Badge variant="outline" className="ml-3 bg-green-100 text-green-700">
              🆓 FREE
            </Badge>
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Paste your job posting below and watch our parser extract all the details automatically!
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Text Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-gray-700">
                <FileText className="w-5 h-5 mr-2" />
                Job Posting Text
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="🚀 We're Hiring: Software Engineer
📍 Location: Your City  
💰 Salary: Competitive
🕓 Experience: 3-5 years
Looking for a passionate developer..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                rows={16}
                className="resize-none font-mono text-sm"
              />
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSamplePaste}
                    className="text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Use Sample
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    disabled={!jobText && !hasAnalyzed}
                    className="text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">
                    {jobText.length} chars
                  </span>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!jobText.trim() || isAnalyzing}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Analyze & Extract
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-gray-700">
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                Extracted Job Details
                {hasAnalyzed && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      Ready to Create
                    </Badge>
                    <Button
                      type="submit"
                      form="smart-import-form"
                      disabled={createMutation.isPending}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold px-4 py-2 shadow-lg"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-1 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          🎯 CREATE JOB
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasAnalyzed ? (
                <div className="text-center py-12 text-gray-500">
                  <Wand2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Ready to Extract</p>
                  <p>Your extracted job details will appear here after analysis</p>
                </div>
              ) : (
                <Form {...form}>
                  <form id="smart-import-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-job-title" />
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
                              <Input {...field} data-testid="input-department" />
                            </FormControl>
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
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
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
                              <Input {...field} value={field.value || ""} />
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
                            <FormLabel>Job Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
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
                        name="isRemoteAvailable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <FormLabel>Remote Work</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Detailed Fields */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} rows={3} />
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
                              <Textarea {...field} value={field.value || ""} rows={3} />
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
                              <Textarea {...field} value={field.value || ""} rows={3} />
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
                            <FormLabel>Skills (comma separated)</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* CREATE JOB BUTTON - ALWAYS VISIBLE */}
                    <div className="sticky bottom-0 bg-white border-t-2 border-green-500 p-4 -mx-6 -mb-6">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          ✅ Smart Import Ready - Form filled automatically
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setLocation("/jobs")}
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold px-8 py-3 text-lg shadow-xl transform hover:scale-105"
                            data-testid="create-job-button"
                          >
                            {createMutation.isPending ? (
                              <>
                                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-5 h-5 mr-2" />
                                🎯 CREATE JOB NOW
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}