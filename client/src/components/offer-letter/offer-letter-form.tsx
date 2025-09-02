import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OfferLetter, Candidate, Job, Application } from "@shared/schema";
import { Calculator, FileText, Send, Eye } from "lucide-react";

// Salary calculation utility
export function calculateSalaryBreakdown(ctc: number) {
  const basic = Math.round(ctc * 0.40);
  const hra = Math.round(ctc * 0.20);
  const specialAllowance = Math.round(ctc * 0.30);
  const employerPf = Math.round(basic * 0.12);
  const otherBenefits = ctc - (basic + hra + specialAllowance + employerPf);
  
  // Deductions
  const employeePf = Math.round(basic * 0.12);
  const professionalTax = 200; // Fixed amount
  const incomeTax = calculateIncomeTax(ctc);
  
  const netSalary = ctc - (employeePf + professionalTax + incomeTax);
  
  return {
    basic,
    hra,
    specialAllowance,
    employerPf,
    otherBenefits,
    employeePf,
    professionalTax,
    incomeTax,
    netSalary
  };
}

function calculateIncomeTax(ctc: number): number {
  const annualIncome = ctc;
  let tax = 0;
  
  if (annualIncome <= 250000) {
    tax = 0;
  } else if (annualIncome <= 500000) {
    tax = (annualIncome - 250000) * 0.05;
  } else if (annualIncome <= 1000000) {
    tax = 250000 * 0.05 + (annualIncome - 500000) * 0.20;
  } else {
    tax = 250000 * 0.05 + 500000 * 0.20 + (annualIncome - 1000000) * 0.30;
  }
  
  return Math.round(tax);
}

const offerLetterSchema = z.object({
  candidateId: z.string().min(1, "Please select a candidate"),
  jobId: z.string().min(1, "Please select a job"),
  applicationId: z.string().min(1, "Application is required"),
  designation: z.string().min(1, "Designation is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  offerDate: z.string().min(1, "Offer date is required"),
  companyName: z.string().min(1, "Company name is required"),
  hrName: z.string().min(1, "HR name is required"),
  hrSignature: z.string().optional(),
  ctc: z.string().min(1, "CTC is required"),
  basicSalary: z.string().optional(),
  hra: z.string().optional(),
  specialAllowance: z.string().optional(),
  employerPf: z.string().optional(),
  otherBenefits: z.string().optional(),
  employeePf: z.string().optional(),
  professionalTax: z.string().optional(),
  incomeTax: z.string().optional(),
  netSalary: z.string().optional(),
  templateUsed: z.string().optional(),
  status: z.string().optional(),
});

type OfferLetterFormData = z.infer<typeof offerLetterSchema>;

interface OfferLetterFormProps {
  offerLetter?: OfferLetter | null;
  onSuccess: () => void;
}

export function OfferLetterForm({ offerLetter, onSuccess }: OfferLetterFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [salaryBreakdown, setSalaryBreakdown] = useState<any>(null);
  const [selectedApplications, setSelectedApplications] = useState<Application[]>([]);

  // Fetch candidates for dropdown
  const { data: candidates = [] } = useQuery({
    queryKey: ["/api/candidates"],
  });

  // Fetch jobs for dropdown
  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
  });

  // Fetch applications for selected candidate and job
  const { data: applications = [] } = useQuery({
    queryKey: ["/api/applications"],
  });

  const form = useForm<OfferLetterFormData>({
    resolver: zodResolver(offerLetterSchema),
    defaultValues: {
      candidateId: offerLetter?.candidateId || "",
      jobId: offerLetter?.jobId || "",
      applicationId: offerLetter?.applicationId || "",
      designation: offerLetter?.designation || "",
      joiningDate: offerLetter?.joiningDate || "",
      offerDate: offerLetter?.offerDate || new Date().toISOString().split('T')[0],
      companyName: offerLetter?.companyName || "TalentFlow Solutions",
      hrName: offerLetter?.hrName || "",
      hrSignature: offerLetter?.hrSignature || "",
      ctc: offerLetter?.ctc?.toString() || "",
      basicSalary: offerLetter?.basicSalary?.toString() || "",
      hra: offerLetter?.hra?.toString() || "",
      specialAllowance: offerLetter?.specialAllowance?.toString() || "",
      employerPf: offerLetter?.employerPf?.toString() || "",
      otherBenefits: offerLetter?.otherBenefits?.toString() || "",
      employeePf: offerLetter?.employeePf?.toString() || "",
      professionalTax: offerLetter?.professionalTax?.toString() || "200",
      incomeTax: offerLetter?.incomeTax?.toString() || "",
      netSalary: offerLetter?.netSalary?.toString() || "",
      templateUsed: offerLetter?.templateUsed || "default",
      status: offerLetter?.status || "draft",
    },
  });

  const watchedCandidateId = form.watch("candidateId");
  const watchedJobId = form.watch("jobId");
  const watchedCTC = form.watch("ctc");

  // Filter applications based on selected candidate and job
  useEffect(() => {
    if (watchedCandidateId && watchedJobId) {
      const filteredApps = applications.filter((app: Application) => 
        app.candidateId === watchedCandidateId && 
        app.jobId === watchedJobId &&
        app.stage === 'Selected' // Only show applications in 'Selected' stage
      );
      setSelectedApplications(filteredApps);
      
      if (filteredApps.length === 1) {
        form.setValue("applicationId", filteredApps[0].id);
      }
    }
  }, [watchedCandidateId, watchedJobId, applications, form]);

  // Auto-populate job designation when job is selected
  useEffect(() => {
    if (watchedJobId) {
      const selectedJob = jobs.find((job: Job) => job.id === watchedJobId);
      if (selectedJob) {
        form.setValue("designation", selectedJob.title);
      }
    }
  }, [watchedJobId, jobs, form]);

  // Auto-calculate salary breakdown when CTC changes
  useEffect(() => {
    if (watchedCTC) {
      const ctcValue = parseFloat(watchedCTC);
      if (!isNaN(ctcValue) && ctcValue > 0) {
        const breakdown = calculateSalaryBreakdown(ctcValue);
        setSalaryBreakdown(breakdown);
        
        // Auto-populate form fields
        form.setValue("basicSalary", breakdown.basic.toString());
        form.setValue("hra", breakdown.hra.toString());
        form.setValue("specialAllowance", breakdown.specialAllowance.toString());
        form.setValue("employerPf", breakdown.employerPf.toString());
        form.setValue("otherBenefits", breakdown.otherBenefits.toString());
        form.setValue("employeePf", breakdown.employeePf.toString());
        form.setValue("incomeTax", breakdown.incomeTax.toString());
        form.setValue("netSalary", breakdown.netSalary.toString());
      }
    }
  }, [watchedCTC, form]);

  const mutation = useMutation({
    mutationFn: async (data: OfferLetterFormData) => {
      const url = offerLetter ? `/api/offer-letters/${offerLetter.id}` : '/api/offer-letters';
      const method = offerLetter ? 'PUT' : 'POST';
      return await apiRequest(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Offer letter ${offerLetter ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/offer-letters'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${offerLetter ? 'update' : 'create'} offer letter`,
        variant: "destructive",
      });
      console.error('Error saving offer letter:', error);
    },
  });

  const onSubmit = (data: OfferLetterFormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="offer-letter-form">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="candidateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-candidate">
                          <SelectValue placeholder="Select candidate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {candidates.map((candidate: Candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.name} - {candidate.email}
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
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Position</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-job">
                          <SelectValue placeholder="Select job" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobs.map((job: Job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title} - {job.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedApplications.length > 0 && (
              <FormField
                control={form.control}
                name="applicationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-application">
                          <SelectValue placeholder="Select application" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedApplications.map((app: Application) => (
                          <SelectItem key={app.id} value={app.id}>
                            Applied on {new Date(app.createdAt!).toLocaleDateString()} - {app.stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-designation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="joiningDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joining Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-joining-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="offerDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-offer-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hrName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HR Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-hr-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Salary Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Salary Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ctc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual CTC (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g. 600000"
                        {...field}
                        data-testid="input-ctc"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {salaryBreakdown && (
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-semibold mb-3">Auto-calculated Salary Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Basic Salary (40%):</span>
                    <div className="font-medium">₹{salaryBreakdown.basic.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">HRA (20%):</span>
                    <div className="font-medium">₹{salaryBreakdown.hra.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Special Allowance (30%):</span>
                    <div className="font-medium">₹{salaryBreakdown.specialAllowance.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Employer PF (12%):</span>
                    <div className="font-medium">₹{salaryBreakdown.employerPf.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Employee PF (12%):</span>
                    <div className="font-medium">₹{salaryBreakdown.employeePf.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Professional Tax:</span>
                    <div className="font-medium">₹{salaryBreakdown.professionalTax.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Income Tax:</span>
                    <div className="font-medium">₹{salaryBreakdown.incomeTax.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="col-span-2 border-t pt-2 mt-2">
                    <span className="text-muted-foreground font-semibold">Net Take-home Salary:</span>
                    <div className="font-bold text-green-600 text-lg">₹{salaryBreakdown.netSalary.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4" data-testid="form-actions">
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-save-offer"
          >
            {mutation.isPending ? "Saving..." : offerLetter ? "Update Offer Letter" : "Generate Offer Letter"}
          </Button>
        </div>
      </form>
    </Form>
  );
}