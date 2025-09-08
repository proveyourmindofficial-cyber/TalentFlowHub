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
import { parseJobPosting, type ParsedJobData } from "@/utils/jobParser";
import { 
  Sparkles, 
  FileText, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Copy,
  RotateCcw,
  Wand2
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
  const [parsedData, setParsedData] = useState<ParsedJobData | null>(null);

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
      // Show analyzing animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const parsed = parseJobPosting(jobText);
      setParsedData(parsed);
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
        jobType: parsed.jobType || "full_time",
        status: "draft",
        priority: "medium",
        experienceLevel: parsed.experienceLevel || "",
        skills: parsed.skills || "",
        benefits: parsed.benefits || "",
        isRemoteAvailable: parsed.isRemoteAvailable || false,
        applicationDeadline: undefined,
      });
      
      toast({
        title: "✨ Analysis Complete!",
        description: "Job details extracted successfully. Review and adjust as needed.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to parse the job posting. Please check the format.",
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
        title: "🎉 Success!",
        description: "Job created successfully from Smart Import!",
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

  const onSubmit = (data: z.infer<typeof smartImportSchema>) => {
    createMutation.mutate(data);
  };

  const handleReset = () => {
    setJobText("");
    setParsedData(null);
    setHasAnalyzed(false);
    form.reset();
  };

  const handleSamplePaste = () => {
    const sampleJob = `🚀 We're Hiring at O2F Infosolutions! 
We're on the lookout for an experienced Talent Acquisition Specialist (Domestic IT Recruitment) to join our growing team in Hyderabad! 
📍 Location: Hyderabad 
🏢 Work Mode: Work from Office 
🕓 Experience: 4 – 8 Years 
🧑‍💼 Role: Individual Contributor – Talent Acquisition (Domestic IT Recruitment) 
Are you passionate about tech hiring and thrive in a fast-paced environment? This is your chance to make a real impact by connecting top talent with exciting IT opportunities.

🔑 Key Responsibilities: 
✅ Expertise in Domestic IT Recruitment with a strong grasp of various IT technologies 
✅ Proven experience hiring for Contract and Contract-to-Hire positions 
✅ Strong sourcing and multitasking abilities 
✅ Excellent communication and interpersonal skills 

❗ Important Note: 
This role is strictly for professionals with experience in Domestic IT Recruitment. 
If your background is in US IT Recruitment or Non-IT hiring, this position may not be a fit. 

📩 Interested? 
Send your updated resume to: 
📧 Sakshi@o2finfosolutions.com 
📧 Rekhaparvathi.s@o2finfosolutions.com`;
    
    setJobText(sampleJob);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" data-testid="smart-import-form">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold text-gray-800">
            <Wand2 className="w-6 h-6 mr-3 text-purple-600" />
            Smart Import - AI Job Parser
            <Badge variant="outline" className="ml-3 bg-green-100 text-green-700">
              🆓 100% FREE
            </Badge>
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Paste your job posting below and watch our intelligent parser extract all the details automatically!
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
                placeholder="🚀 We're Hiring at Your Company!
Looking for an experienced Software Engineer...
📍 Location: Your City
🕓 Experience: 3-5 Years
..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                rows={20}
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
                    {jobText.length} characters
                  </span>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!jobText.trim() || isAnalyzing}
                    className="bg-purple-600 hover:bg-purple-700"
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

        {/* Right Column - Extracted Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold text-gray-700">
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                Extracted Job Details
                {hasAnalyzed && (
                  <Badge variant="outline" className="ml-2 bg-green-100 text-green-700">
                    Ready to Create
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasAnalyzed ? (
                <div className="text-center py-12 text-gray-500">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Ready to Extract</p>
                  <p>Paste your job posting and click "Analyze & Extract" to see the magic!</p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            <FormLabel>Department</FormLabel>
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
                              <Input {...field} value={field.value || ""} data-testid="input-location" />
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
                              <Input {...field} value={field.value || ""} placeholder="e.g. 3-5 years" />
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
                            <div className="space-y-0.5">
                              <FormLabel>Remote Work</FormLabel>
                            </div>
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
                              <Textarea {...field} value={field.value || ""} rows={4} />
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
                              <Textarea {...field} value={field.value || ""} rows={4} />
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
                              <Textarea {...field} value={field.value || ""} rows={4} />
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
                              <Input {...field} value={field.value || ""} placeholder="React, JavaScript, Node.js" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/jobs")}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        {createMutation.isPending ? (
                          <>
                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Create Job from Smart Import
                          </>
                        )}
                      </Button>
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