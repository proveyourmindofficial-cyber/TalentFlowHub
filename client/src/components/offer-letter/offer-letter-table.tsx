import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Eye, Edit, Trash2, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BulkOperations, ItemCheckbox } from "@/components/ui/bulk-operations";
import { ImportExportButtons } from "@/components/ui/import-export-buttons";
import { OfferLetterEditDialog } from "@/components/offer-letter/offer-letter-edit-dialog";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OfferLetterTableProps {
  onCreateNew: () => void;
  onPreview: (offer: any) => void;
}

export function OfferLetterTable({ onCreateNew, onPreview }: OfferLetterTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editOffer, setEditOffer] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
      toast({
        title: "Success",
        description: "Offer letter deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete offer letter",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Offer letters deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete offer letters",
        variant: "destructive",
      });
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
        toast({
          title: "Error",
          description: "Failed to generate PDF",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (offerId: string) => {
    try {
      const response = await fetch(`/api/offer-letters/${offerId}/send-email`, {
        method: 'POST'
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Offer letter sent successfully!",
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send offer letter",
        variant: "destructive",
      });
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
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <>
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
              <Button onClick={onCreateNew} data-testid="button-new-offer">
                <Plus className="w-4 h-4 mr-2" />
                Create Offer Letter
              </Button>
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
          <div className="px-6 py-3">
            <BulkOperations
              selectedItems={selectedIds}
              totalItems={filteredOffers.length}
              onSelectAll={toggleAll}
              onBulkDelete={handleBulkDelete}
              itemName="offer letter"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <ItemCheckbox
                    checked={selectedIds.length === filteredOffers.length && filteredOffers.length > 0}
                    onChange={() => toggleAll(selectedIds.length !== filteredOffers.length)}
                    data-testid="checkbox-select-all-offers"
                  />
                </TableHead>
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
                      <Button className="mt-4" onClick={onCreateNew} data-testid="button-create-first-offer">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Offer Letter
                      </Button>
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
                          onClick={() => onPreview(offer)}
                          data-testid={`button-preview-${offer.id}`}
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
                                Are you sure you want to delete this offer letter? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(offer.id)}
                                className="bg-destructive text-destructive-foreground"
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
    </>
  );
}