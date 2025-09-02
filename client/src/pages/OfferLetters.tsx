import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, Edit, Trash2, Download, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BulkOperations, ItemCheckbox } from "@/components/ui/bulk-operations";
import { ImportExportButtons } from "@/components/ui/import-export-buttons";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";

// Complete Offer Letter Preview Component - Exact Template Match
function OfferLetterPreview({ offer }: { offer: any }) {
  const formatDate = (date: Date | string): string => {
    if (!date) return "____________";
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'long' });
    const year = d.getFullYear();
    const s = ["th", "st", "nd", "rd"];
    const v = day % 100;
    const ord = (s[(v - 20) % 10] || s[v] || s[0]);
    return `${month} ${day}${ord}, ${year}`;
  };

  const formatINR = (amount: number): string => {
    return amount.toLocaleString('en-IN');
  };

  // Get candidate name properly
  const candidateName = offer.candidate?.name || "Candidate Name";
  const candidateLocation = offer.candidate?.currentLocation || "Bangalore";
  const designation = offer.designation || "Sr Consultant – Talent Acquisition";
  const ctc = Number(offer.ctc) || 650000;
  
  // Salary components (annual amounts)
  const basicSalary = Number(offer.basicSalary) || 390000;
  const hra = Number(offer.hra) || 156000;
  const conveyance = Number(offer.conveyanceAllowance) || 19200;
  const medical = Number(offer.medicalAllowance) || 15000;
  const flexi = Number(offer.flexiPay) || 48200;
  const employerPf = Number(offer.employerPf) || 21600;
  const employeePf = Number(offer.employeePf) || 21600;
  const professionalTax = Number(offer.professionalTax) || 2400;
  const insurance = Number(offer.insurance) || 6000;
  const incomeTax = Number(offer.incomeTax) || 0;

  const toMonthly = (yearlyAmount: number) => Math.round(yearlyAmount / 12);
  
  const totalA = basicSalary + hra + conveyance + medical + flexi;
  const totalB = employerPf;
  const totalSalary = totalA + totalB;
  const totalDeductions = employeePf + professionalTax + insurance + incomeTax;
  const netMonthly = Math.round((totalSalary - totalDeductions) / 12);

  return (
    <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '11pt', lineHeight: '1.5', color: 'black' }}>
      <style>{`
        @page { margin: 20mm; }
        .page-break { page-break-before: always; }
        table { border-collapse: collapse; width: 100%; margin: 14px 0; }
        th, td { border: 1px solid #000; padding: 6px; }
        .no-border td, .no-border th { border: none; }
        .center { text-align: center; }
        .right { text-align: right; }
        .section-title { font-weight: bold; margin: 14px 0 6px; }
        p { margin: 6px 0; text-align: justify; }
      `}</style>

      {/* Date (top-right) */}
      <div className="right" style={{ marginBottom: '24px' }}>
        {formatDate(offer.offerDate || offer.createdAt)}
      </div>

      {/* Candidate Address */}
      <div style={{ marginBottom: '32px' }}>
        {candidateName}<br />
        {candidateLocation}
      </div>

      {/* Title */}
      <div className="center" style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '16px' }}>
        Offer of Employment
      </div>

      <div style={{ marginBottom: '16px' }}>Dear {candidateName},</div>
      
      <div className="center" style={{ fontWeight: 'bold', marginBottom: '16px' }}>
        Congratulations!!!
      </div>

      {/* Main Content - Exact from Template */}
      <p>Please refer to the interview and discussions you had with us recently.</p>

      <p>
        We are pleased to offer you the position of <strong>{designation}</strong> at <strong>O2F Info Solutions Pvt Ltd</strong> and the joining date would be <strong>{formatDate(offer.joiningDate)}</strong>.
      </p>

      <p>
        Your employment will be based at Hyderabad, however, based on the position's requirements, you may be required to work anywhere in India and this offer of employment will take effect from the date of your reporting. This offer is valid up to <strong>{formatDate(offer.joiningDate)}</strong> subject to your joining on or before the given joining date.
      </p>

      <p>
        Your Annual CTC will be Rs. {formatINR(ctc)}. This CTC Includes Conveyance and all other allowances and benefits as applicable to you as detailed in Annexure-1. The break-up of your CTC is indicated in the attached annexure.
      </p>

      <p>
        You will be covered under Group Medical Insurance for a sum of Rs.5,00,000. Under Group Medical Insurance, Hospitalization cover can be utilized only by the employee and the benefit is not extended to any other family members.
      </p>

      <p>
        Your compensation details are strictly confidential, and you may discuss it only with the authorized personnel of HR in case of any clarification. It is our hope that your acceptance of this offer will be just the beginning of a mutually rewarding relationship.
      </p>

      <p>
        Salary Payments will be made by 05th of the next calendar month subject to attendance. Net take home salary is subject to Income Tax and other statutory deductions and will be paid into the Bank Account of the Employee. For operating convenience, we encourage all our employees to open a salary account with HDFC Bank after joining the employment with us.
      </p>

      <p>
        <strong>Note:</strong> Alternatively, you can share us your HDFC Bank Account details, if you are already holding an account with HDFC Bank. you are free to provide us your other Bank Account details (For NEFT Transfers) other than HDFC Bank if you do not want to have HDFC Bank as your Banking Partner.
      </p>

      <p>
        You will receive a monthly pay statement detailing gross pay and deductions. Any subsequent changes to your salary will be highlighted on that statement. Income tax liability (TDS) or any other statutory deduction arising as a result of your employment, it should be borne by the employee and company in no event be liable for payment of those taxes and statutory deductions in addition to your CTC either during the period of your employment or after cessation of your employment with O2F.
      </p>

      <p>
        Your employment with O2F Info solutions Pvt Ltd will be governed by the following Terms and conditions. You will also be governed by current O2F's rules, regulations, internal policies, and practices which are subject to change from time to time.
      </p>

      {/* Annexure-1 Table - Complete Salary Breakdown */}
      <div style={{ margin: '20px 0' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>
          Annexure-1: Salary Structure
        </div>
        
        <table>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ textAlign: 'left' }}>Particulars</th>
              <th style={{ textAlign: 'right' }}>Per Month (Rs.)</th>
              <th style={{ textAlign: 'right' }}>Per Year (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={3} style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>A. Salary Components:</td></tr>
            <tr>
              <td>Basic Salary</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(basicSalary))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(basicSalary)}</td>
            </tr>
            <tr>
              <td>HRA</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(hra))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(hra)}</td>
            </tr>
            <tr>
              <td>Conveyance</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(conveyance))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(conveyance)}</td>
            </tr>
            <tr>
              <td>Medical</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(medical))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(medical)}</td>
            </tr>
            <tr>
              <td>Flexi Pay</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(flexi))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(flexi)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
              <td>Total A</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(totalA))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(totalA)}</td>
            </tr>
            
            <tr><td colSpan={3} style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>B. Company Contribution:</td></tr>
            <tr>
              <td>Employer PF</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(employerPf))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(employerPf)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
              <td>Total B</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(totalB))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(totalB)}</td>
            </tr>
            
            <tr style={{ fontWeight: 'bold', backgroundColor: '#e8f4fd' }}>
              <td>Total Salary (A + B)</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(totalSalary))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(totalSalary)}</td>
            </tr>
            
            <tr><td colSpan={3} style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>C. Deductions:</td></tr>
            <tr>
              <td>Employee PF</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(employeePf))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(employeePf)}</td>
            </tr>
            <tr>
              <td>Professional Tax</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(professionalTax))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(professionalTax)}</td>
            </tr>
            <tr>
              <td>Group Medical Insurance</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(insurance))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(insurance)}</td>
            </tr>
            <tr>
              <td>Income Tax</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(incomeTax))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(incomeTax)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
              <td>Total Deductions</td>
              <td style={{ textAlign: 'right' }}>{formatINR(toMonthly(totalDeductions))}</td>
              <td style={{ textAlign: 'right' }}>{formatINR(totalDeductions)}</td>
            </tr>
            
            <tr style={{ fontWeight: 'bold', backgroundColor: '#d4edda' }}>
              <td>Net Monthly Salary</td>
              <td style={{ textAlign: 'right' }}>{formatINR(netMonthly)}</td>
              <td style={{ textAlign: 'right' }}>--</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terms and Conditions */}
      <div className="section-title">Location of work</div>
      <p>
        Your employment will be based in Bangalore and the company reserves the right to Transfer your services to anywhere in India and Overseas or utilize your expertise to any of our projects based in India and Overseas. Relocation or Compensatory allowance applicable to a specific Project / location as per Company's policy will be paid to you.
      </p>

      <div className="section-title">Duties and Responsibilities</div>
      <p>
        The Company reserves the right, at any time during your employment, with reasonable notice, to require you to undertake any reasonable, alternative duties which are within your capabilities. You shall not indulge actively/or cause any act likely to affect the discipline that is expected from every employee of this organization or associate with any such activity which may amount to an act subversive of discipline.
      </p>

      <div className="section-title">Notice Period / Termination</div>
      <p>
        At the time of tendering resignation, you shall be required to give 60 Days' notice in writing. Your resignation will become effective and final upon acceptance by the Management not withstanding that the communication of the acceptance of resignation has reached you or not. However, it will be the prerogative of the Management to accept or not your resignation. In case of any misconduct on your part, Non-Performance of your services can be terminated with immediate effect without assigning any reason and without giving to you any notice or notice pay in lieu of notice or any compensation in lieu thereof.
      </p>

      {/* Signature Section */}
      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '45%' }}>
          <div>Employee Acceptance:</div>
          <div style={{ marginTop: '40px', borderBottom: '1px solid black', width: '200px', height: '2px' }}></div>
          <div>{candidateName}</div>
          <div>Date: _______________</div>
        </div>
        <div style={{ width: '45%' }}>
          <div>For O2F Info Solutions Pvt Ltd</div>
          <div style={{ marginTop: '40px', borderBottom: '1px solid black', width: '200px', height: '2px' }}></div>
          <div>{offer.hrName || 'HR Manager'}</div>
          <div>HR Manager</div>
          <div>Date: {formatDate(offer.offerDate || offer.createdAt)}</div>
        </div>
      </div>
    </div>
  );
}

// Preview Dialog Component
function OfferLetterPreviewDialog({ offerId, open, onOpenChange }: { offerId: string, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: offer, isLoading } = useQuery({
    queryKey: [`/api/offer-letters/${offerId}`],
    queryFn: async () => {
      const response = await fetch(`/api/offer-letters/${offerId}`);
      if (!response.ok) throw new Error('Failed to fetch offer letter');
      return response.json();
    },
    enabled: !!offerId,
  });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading offer letter...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!offer) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Offer Letter Preview</DialogTitle>
        </DialogHeader>
        <div className="bg-white p-8 text-black" style={{ fontFamily: 'Times, serif', lineHeight: '1.6' }}>
          <OfferLetterPreview offer={offer} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Dialog Component
function OfferLetterEditDialog({ offer, open, onOpenChange }: { offer: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [designation, setDesignation] = useState(offer.designation);
  const [status, setStatus] = useState(offer.status);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/offer-letters/${offer.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offer-letters"] });
      toast({ title: "Success", description: "Offer letter updated successfully" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update offer letter", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ designation, status });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Offer Letter</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-2">Designation</label>
            <Input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              data-testid="input-edit-designation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border rounded"
              data-testid="select-edit-status"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-offer">
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OfferLetters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editOffer, setEditOffer] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewOfferId, setPreviewOfferId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: offers = [], isLoading, error } = useQuery({
    queryKey: ["/api/offer-letters"],
  }) as { data: any[], isLoading: boolean, error: any };

  // Bulk selection
  const {
    selectedIds,
    isSelected,
    toggleItem,
    toggleAll,
    clearSelection
  } = useBulkSelection(offers.map((offer: any) => offer.id));

  // Filter offers based on search
  const filteredOffers = offers.filter((offer: any) => 
    offer.candidate?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/offer-letters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offer-letters"] });
      toast({ title: "Success", description: "Offer letter deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete offer letter", variant: "destructive" });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (offerIds: string[]) => {
      return apiRequest("POST", "/api/offer-letters/bulk-delete", { ids: offerIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offer-letters"] });
      clearSelection();
      toast({ title: "Success", description: "Offer letters deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete offer letters", variant: "destructive" });
    },
  });

  const handleEdit = (offer: any) => {
    setEditOffer(offer);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedIds);
  };

  const handleImport = async (importData: any[]): Promise<void> => {
    const mutation = useMutation({
      mutationFn: async (offers: any[]) => {
        return apiRequest("POST", "/api/offer-letters/bulk-import", { offerLetters: offers });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/offer-letters"] });
        clearSelection();
      }
    });
    
    const offersToImport = importData.map(item => ({
      candidateId: item.candidateId,
      designation: item.designation,
      ctc: item.ctc ? parseInt(item.ctc) : undefined,
      joiningDate: item.joiningDate ? new Date(item.joiningDate) : undefined,
      status: item.status || 'draft'
    }));
    
    await mutation.mutateAsync(offersToImport);
  };

  const handleDownloadPDF = async (offerId: string) => {
    try {
      const response = await fetch(`/api/offer-letters/${offerId}/generate-pdf`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const { pdfUrl } = await response.json();
          window.open(pdfUrl, '_blank');
        } else {
          // Handle direct PDF response
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `offer-letter-${offerId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } else {
        toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    }
  };

  const handleSendEmail = async (offerId: string) => {
    try {
      const response = await fetch(`/api/offer-letters/${offerId}/send-email`, {
        method: 'POST'
      });
      if (response.ok) {
        toast({ title: "Success", description: "Offer letter sent successfully!" });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({ title: "Error", description: "Failed to send offer letter", variant: "destructive" });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'expired': return 'secondary';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Offer Letters" description="Manage and track offer letters for selected candidates" />
        <div className="flex-1 overflow-auto p-6">
            <Card>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Offer Letters" description="Manage and track offer letters for selected candidates" />
        <div className="flex-1 overflow-auto p-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-error">Failed to load offer letters. Please try again.</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Offer Letters" description="Manage and track offer letters for selected candidates" />
      <div className="flex-1 overflow-auto p-6 space-y-6" data-testid="offer-letters-page">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Offer Letters</CardTitle>
                <div className="flex gap-2">
                  <ImportExportButtons
                    data={filteredOffers}
                    onImport={handleImport}
                    exportFilename="offer_letters_export"
                    templateType="offer-letters"
                    exportColumns={[
                      { key: 'candidate.name', label: 'Candidate Name' },
                      { key: 'designation', label: 'Designation' },
                      { key: 'ctc', label: 'CTC' },
                      { key: 'joiningDate', label: 'Joining Date' },
                      { key: 'status', label: 'Status' },
                      { key: 'createdAt', label: 'Created Date' }
                    ]}
                  />
                </div>
              </div>
              
              {/* Search */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search offer letters..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64"
                    data-testid="input-search-offers"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Bulk Operations */}
              {filteredOffers.length > 0 && (
                <div className="px-6 py-3">
                  <BulkOperations
                    selectedItems={selectedIds}
                    totalItems={filteredOffers.length}
                    onSelectAll={toggleAll}
                    onBulkDelete={handleBulkDelete}
                    itemName="offer letter"
                  />
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {filteredOffers.length > 0 && (
                      <TableHead className="w-12">
                        <ItemCheckbox
                          checked={selectedIds.length === filteredOffers.length && filteredOffers.length > 0}
                          onChange={() => toggleAll(selectedIds.length !== filteredOffers.length)}
                          data-testid="checkbox-select-all-offers"
                        />
                      </TableHead>
                    )}
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>CTC</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOffers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8" data-testid="no-offers-message">
                        <div className="text-gray-500">
                          {searchQuery ? "No offer letters found matching your search." : "No offer letters created yet."}
                        </div>
                        {!searchQuery && (
                          <p className="text-sm text-gray-400 mt-2">
                            Create offer letters through the Applications module.
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOffers.map((offer: any) => (
                      <TableRow key={offer.id} data-testid={`offer-row-${offer.id}`}>
                        <TableCell>
                          <ItemCheckbox
                            checked={isSelected(offer.id)}
                            onChange={() => toggleItem(offer.id, !isSelected(offer.id))}
                            data-testid={`checkbox-${offer.id}`}
                          />
                        </TableCell>
                        <TableCell data-testid={`offer-candidate-${offer.id}`}>
                          {offer.candidate?.name || 'Unknown Candidate'}
                        </TableCell>
                        <TableCell data-testid={`offer-designation-${offer.id}`}>
                          {offer.designation}
                        </TableCell>
                        <TableCell data-testid={`offer-ctc-${offer.id}`}>
                          {formatCurrency(Number(offer.ctc))}
                        </TableCell>
                        <TableCell data-testid={`offer-joining-date-${offer.id}`}>
                          {offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString() : 'Not set'}
                        </TableCell>
                        <TableCell data-testid={`offer-status-${offer.id}`}>
                          <Badge variant={getStatusBadgeVariant(offer.status)} className="capitalize">
                            {offer.status}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`offer-created-${offer.id}`}>
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewOfferId(offer.id)}
                              data-testid={`button-view-${offer.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(offer)}
                              data-testid={`button-edit-${offer.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(offer.id)}
                              data-testid={`button-download-${offer.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendEmail(offer.id)}
                              data-testid={`button-send-${offer.id}`}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-delete-${offer.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Offer Letter</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this offer letter for {offer.candidate?.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(offer.id)}
                                    className="bg-destructive text-destructive-foreground"
                                    data-testid={`confirm-delete-${offer.id}`}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          {editOffer && (
            <OfferLetterEditDialog
              offer={editOffer}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
            />
          )}

          {/* Preview Dialog */}
          {previewOfferId && (
            <OfferLetterPreviewDialog 
              offerId={previewOfferId}
              open={!!previewOfferId}
              onOpenChange={(open) => !open && setPreviewOfferId(null)}
            />
          )}
        </div>
    </div>
  );
}