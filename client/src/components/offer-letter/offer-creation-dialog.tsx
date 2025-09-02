import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Application, Candidate, Job } from "@shared/schema";
import { Calculator, FileText, Send } from "lucide-react";

const offerFormSchema = z.object({
  designation: z.string().min(1, "Designation is required"),
  ctc: z.number().min(1, "CTC must be greater than 0"),
  joiningDate: z.string().min(1, "Joining date is required"),
  companyName: z.string().min(1, "Company name is required"),
  hrName: z.string().min(1, "HR name is required"),
});

type OfferFormData = z.infer<typeof offerFormSchema>;

type Amount = { monthly: number | string; annual: number | string };

interface SalaryBreakdown {
  earningsA: {
    basic: Amount;
    conveyance: Amount;
    hra: Amount;
    medical: Amount;
    flexi: Amount;
    totalA: Amount;
  };
  otherBenefitsB: {
    esi: Amount;
    epfEmployer: Amount;
    totalB: Amount;
  };
  totals: {
    totalAB: Amount;
  };
  deductions: {
    pt: Amount;
    pfEmployee: Amount;
    insurance: Amount;
    total: Amount;
  };
  netTakeHomeMonthly: number | string;
}

function calculateSalaryBreakdown(ctcAnnual: number): SalaryBreakdown {
  const round0 = (n: number) => Math.round(n);

  // Annuals (truth)
  const basicAnnual = round0(0.60 * ctcAnnual);
  const hraAnnual = round0(0.40 * basicAnnual);
  const conveyAnnual = 19200;
  const medicalAnnual = 15000;

  const basicMonthlyRaw = basicAnnual / 12;
  const employerPFMonthly = Math.min(0.12 * Math.min(15000, basicMonthlyRaw), 1800);
  const employerPFAnnual = round0(employerPFMonthly * 12); // 21,600 at cap

  const aAnnual = ctcAnnual - employerPFAnnual;
  const flexiAnnual = aAnnual - (basicAnnual + hraAnnual + conveyAnnual + medicalAnnual);

  // Monthlies (rounded display)
  const basicMonthly = round0(basicAnnual / 12);      // 32,500
  const hraMonthly = round0(hraAnnual / 12);          // 13,000
  const conveyMonthly = 1600;
  const medicalMonthly = 1250;
  const aMonthly = round0(aAnnual / 12);              // 52,367

  // Flexi monthly balances the row sum to equal A monthly
  const flexiMonthly = aMonthly - (basicMonthly + hraMonthly + conveyMonthly + medicalMonthly);

  const epfEmployerMonthly = employerPFMonthly;       // 1,800
  const epfEmployerAnnual = employerPFAnnual;         // 21,600

  const totalABMonthly = aMonthly + epfEmployerMonthly; // 54,167
  const totalABAnnual  = aAnnual  + epfEmployerAnnual;  // must equal CTC

  // Deductions (offer screen only)
  const pfEmployeeMonthly = epfEmployerMonthly;       // 1,800
  const pfEmployeeAnnual  = epfEmployerAnnual;        // 21,600
  const ptMonthly = 200, ptAnnual = 2400;
  const insuranceMonthly = 500, insuranceAnnual = 6000;

  const deductionsMonthly = pfEmployeeMonthly + ptMonthly + insuranceMonthly; // 2,500
  const deductionsAnnual = pfEmployeeAnnual + ptAnnual + insuranceAnnual;     // 30,000

  const netMonthly = aMonthly - deductionsMonthly;    // 49,867

  const dash = "—"; // for ESI display

  return {
    earningsA: {
      basic:       { monthly: basicMonthly, annual: basicAnnual },
      conveyance:  { monthly: conveyMonthly, annual: conveyAnnual },
      hra:         { monthly: hraMonthly, annual: hraAnnual },
      medical:     { monthly: medicalMonthly, annual: medicalAnnual },
      flexi:       { monthly: flexiMonthly, annual: flexiAnnual },
      totalA:      { monthly: aMonthly, annual: aAnnual },
    },
    otherBenefitsB: {
      esi:         { monthly: dash, annual: dash }, // show dash as string
      epfEmployer: { monthly: epfEmployerMonthly, annual: epfEmployerAnnual },
      totalB:      { monthly: totalABMonthly - aMonthly, annual: totalABAnnual - aAnnual },
    },
    totals: {
      totalAB:     { monthly: totalABMonthly, annual: totalABAnnual }, // equals CTC
    },
    deductions: {
      pt:          { monthly: ptMonthly, annual: ptAnnual },
      pfEmployee:  { monthly: pfEmployeeMonthly, annual: pfEmployeeAnnual },
      insurance:   { monthly: insuranceMonthly, annual: insuranceAnnual },
      total:       { monthly: deductionsMonthly, annual: deductionsAnnual },
    },
    netTakeHomeMonthly: netMonthly,
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

interface OfferCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any; // Using any for now to avoid type conflicts
}

export function OfferCreationDialog({ open, onOpenChange, application }: OfferCreationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      designation: application.job.title,
      ctc: Number(application.candidate.expectedCtc) || 600000,
      joiningDate: "",
      companyName: "TalentFlow Solutions",
      hrName: "HR Manager",
    }
  });

  const watchedCtc = form.watch("ctc");
  const salaryBreakdown = watchedCtc > 0 ? calculateSalaryBreakdown(watchedCtc) : null;

  const createOfferMutation = useMutation({
    mutationFn: async (data: OfferFormData) => {
      const payload = {
        candidateId: application.candidate.id,
        jobId: application.job.id,
        applicationId: application.id,
        designation: data.designation,
        joiningDate: data.joiningDate,
        ctc: data.ctc.toString(),
        hrName: data.hrName,
        companyName: data.companyName
      };

      return apiRequest("POST", "/api/offer-letters", payload);
    },
    onSuccess: async () => {
      // Update application stage to "Offer Released" and candidate status to "Offer Released"
      await apiRequest("PUT", `/api/applications/${application.id}`, { 
        stage: "Offer Released" 
      });
      
      await apiRequest("PUT", `/api/candidates/${application.candidateId}`, { 
        status: "Offer Released" 
      });

      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offer-letters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation/counts"] });
      
      toast({
        title: "Offer Released Successfully",
        description: `Offer letter created and released for ${application.candidate.name}`,
      });
      
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create offer letter. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OfferFormData) => {
    createOfferMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Offer Letter for {application.candidate.name}
          </DialogTitle>
          <DialogDescription>
            Fill in the offer details. Salary breakdown will be calculated automatically based on Indian standards.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Candidate Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Candidate Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Name:</strong> {application.candidate.name}</div>
                  <div><strong>Email:</strong> {application.candidate.email}</div>
                  <div><strong>Position:</strong> {application.job.title}</div>
                  <div><strong>Department:</strong> {application.job.department}</div>
                  <div><strong>Expected CTC:</strong> ₹{Number(application.candidate.expectedCtc || 0).toLocaleString('en-IN')}</div>
                  <div><strong>Current Status:</strong> {application.candidate.status}</div>
                </div>
              </CardContent>
            </Card>

            {/* Offer Details Form */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ctc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual CTC (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(parseInt(e.target.value) || 0);
                          setShowBreakdown(true);
                        }}
                      />
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
                      <Input type="date" {...field} />
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
                    <FormLabel>HR Manager Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Salary Breakdown - Exact Spec Format */}
            {salaryBreakdown && showBreakdown && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Salary Breakdown for ₹{watchedCtc.toLocaleString('en-IN')}</h3>
                  </div>
                  
                  {/* SALARY BREAKUP (A) */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base text-green-700">SALARY BREAKUP (A)</CardTitle>
                        <div className="grid grid-cols-2 gap-12 text-sm font-semibold">
                          <span>Monthly</span>
                          <span>Annual</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Basic Salary</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.earningsA.basic.monthly === 'number' ? salaryBreakdown.earningsA.basic.monthly.toLocaleString('en-IN') : salaryBreakdown.earningsA.basic.monthly}</span>
                          <span>₹{typeof salaryBreakdown.earningsA.basic.annual === 'number' ? salaryBreakdown.earningsA.basic.annual.toLocaleString('en-IN') : salaryBreakdown.earningsA.basic.annual}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Conveyance</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.earningsA.conveyance.monthly === 'number' ? salaryBreakdown.earningsA.conveyance.monthly.toLocaleString('en-IN') : salaryBreakdown.earningsA.conveyance.monthly}</span>
                          <span>₹{typeof salaryBreakdown.earningsA.conveyance.annual === 'number' ? salaryBreakdown.earningsA.conveyance.annual.toLocaleString('en-IN') : salaryBreakdown.earningsA.conveyance.annual}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>House Rent Allowance (HRA)</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.earningsA.hra.monthly === 'number' ? salaryBreakdown.earningsA.hra.monthly.toLocaleString('en-IN') : salaryBreakdown.earningsA.hra.monthly}</span>
                          <span>₹{typeof salaryBreakdown.earningsA.hra.annual === 'number' ? salaryBreakdown.earningsA.hra.annual.toLocaleString('en-IN') : salaryBreakdown.earningsA.hra.annual}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Medical Reimbursements</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.earningsA.medical.monthly === 'number' ? salaryBreakdown.earningsA.medical.monthly.toLocaleString('en-IN') : salaryBreakdown.earningsA.medical.monthly}</span>
                          <span>₹{typeof salaryBreakdown.earningsA.medical.annual === 'number' ? salaryBreakdown.earningsA.medical.annual.toLocaleString('en-IN') : salaryBreakdown.earningsA.medical.annual}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Flexi Benefit Allowances</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.earningsA.flexi.monthly === 'number' ? salaryBreakdown.earningsA.flexi.monthly.toLocaleString('en-IN') : salaryBreakdown.earningsA.flexi.monthly}</span>
                          <span>₹{typeof salaryBreakdown.earningsA.flexi.annual === 'number' ? salaryBreakdown.earningsA.flexi.annual.toLocaleString('en-IN') : salaryBreakdown.earningsA.flexi.annual}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center font-semibold text-green-700">
                        <span>Total (A)</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.earningsA.totalA.monthly === 'number' ? salaryBreakdown.earningsA.totalA.monthly.toLocaleString('en-IN') : salaryBreakdown.earningsA.totalA.monthly}</span>
                          <span>₹{typeof salaryBreakdown.earningsA.totalA.annual === 'number' ? salaryBreakdown.earningsA.totalA.annual.toLocaleString('en-IN') : salaryBreakdown.earningsA.totalA.annual}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* OTHER BENEFITS (B) */}
                  <Card className="mt-4">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base text-blue-700">OTHER BENEFITS (B)</CardTitle>
                        <div className="grid grid-cols-2 gap-12 text-sm font-semibold">
                          <span>Monthly</span>
                          <span>Annual</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Employer Contribution to ESI</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>{salaryBreakdown.otherBenefitsB.esi.monthly}</span>
                          <span>{salaryBreakdown.otherBenefitsB.esi.annual}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Employer Contribution to EPF</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.otherBenefitsB.epfEmployer.monthly === 'number' ? salaryBreakdown.otherBenefitsB.epfEmployer.monthly.toLocaleString('en-IN') : salaryBreakdown.otherBenefitsB.epfEmployer.monthly}</span>
                          <span>₹{typeof salaryBreakdown.otherBenefitsB.epfEmployer.annual === 'number' ? salaryBreakdown.otherBenefitsB.epfEmployer.annual.toLocaleString('en-IN') : salaryBreakdown.otherBenefitsB.epfEmployer.annual}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center font-semibold text-blue-700">
                        <span>Total (B)</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.otherBenefitsB.totalB.monthly === 'number' ? salaryBreakdown.otherBenefitsB.totalB.monthly.toLocaleString('en-IN') : salaryBreakdown.otherBenefitsB.totalB.monthly}</span>
                          <span>₹{typeof salaryBreakdown.otherBenefitsB.totalB.annual === 'number' ? salaryBreakdown.otherBenefitsB.totalB.annual.toLocaleString('en-IN') : salaryBreakdown.otherBenefitsB.totalB.annual}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* TOTAL SALARY (A+B) */}
                  <Card className="mt-4 bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center font-bold text-green-700 text-lg">
                        <span>Total Salary (A+B)</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.totals.totalAB.monthly === 'number' ? salaryBreakdown.totals.totalAB.monthly.toLocaleString('en-IN') : salaryBreakdown.totals.totalAB.monthly}</span>
                          <span>₹{typeof salaryBreakdown.totals.totalAB.annual === 'number' ? salaryBreakdown.totals.totalAB.annual.toLocaleString('en-IN') : salaryBreakdown.totals.totalAB.annual}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* DEDUCTIONS */}
                  <Card className="mt-4">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base text-red-700">DEDUCTIONS</CardTitle>
                        <div className="grid grid-cols-2 gap-12 text-sm font-semibold">
                          <span>Monthly</span>
                          <span>Annual</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Professional Tax (PT)</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.deductions.pt.monthly === 'number' ? salaryBreakdown.deductions.pt.monthly.toLocaleString('en-IN') : salaryBreakdown.deductions.pt.monthly}</span>
                          <span>₹{typeof salaryBreakdown.deductions.pt.annual === 'number' ? salaryBreakdown.deductions.pt.annual.toLocaleString('en-IN') : salaryBreakdown.deductions.pt.annual}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Employee Contribution of PF</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.deductions.pfEmployee.monthly === 'number' ? salaryBreakdown.deductions.pfEmployee.monthly.toLocaleString('en-IN') : salaryBreakdown.deductions.pfEmployee.monthly}</span>
                          <span>₹{typeof salaryBreakdown.deductions.pfEmployee.annual === 'number' ? salaryBreakdown.deductions.pfEmployee.annual.toLocaleString('en-IN') : salaryBreakdown.deductions.pfEmployee.annual}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Insurance</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.deductions.insurance.monthly === 'number' ? salaryBreakdown.deductions.insurance.monthly.toLocaleString('en-IN') : salaryBreakdown.deductions.insurance.monthly}</span>
                          <span>₹{typeof salaryBreakdown.deductions.insurance.annual === 'number' ? salaryBreakdown.deductions.insurance.annual.toLocaleString('en-IN') : salaryBreakdown.deductions.insurance.annual}</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center font-semibold text-red-700">
                        <span>Total Deductions</span>
                        <div className="grid grid-cols-2 gap-12 text-right">
                          <span>₹{typeof salaryBreakdown.deductions.total.monthly === 'number' ? salaryBreakdown.deductions.total.monthly.toLocaleString('en-IN') : salaryBreakdown.deductions.total.monthly}</span>
                          <span>₹{typeof salaryBreakdown.deductions.total.annual === 'number' ? salaryBreakdown.deductions.total.annual.toLocaleString('en-IN') : salaryBreakdown.deductions.total.annual}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Monthly Take Home Salary */}
                  <Card className="mt-4 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center font-bold text-blue-700 text-lg">
                        <span>Monthly Take Home Salary</span>
                        <span>₹{typeof salaryBreakdown.netTakeHomeMonthly === 'number' ? salaryBreakdown.netTakeHomeMonthly.toLocaleString('en-IN') : salaryBreakdown.netTakeHomeMonthly}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        <em>TDS and payslip structure are handled by HR separately.</em>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createOfferMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {createOfferMutation.isPending ? "Creating..." : "Release Offer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}