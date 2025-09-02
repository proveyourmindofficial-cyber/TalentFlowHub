import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertOfferLetterSchema, type InsertOfferLetter } from "@shared/schema";
import { z } from "zod";

const editOfferLetterSchema = insertOfferLetterSchema.partial().extend({
  ctc: z.string().min(1, "CTC is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
});

type EditOfferLetterData = z.infer<typeof editOfferLetterSchema>;

interface OfferLetterEditDialogProps {
  offer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfferLetterEditDialog({ offer, open, onOpenChange }: OfferLetterEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditOfferLetterData>({
    resolver: zodResolver(editOfferLetterSchema),
    defaultValues: {
      ctc: offer?.ctc?.toString() || "",
      designation: offer?.designation || "",
      joiningDate: offer?.joiningDate ? new Date(offer.joiningDate).toISOString().split('T')[0] : "",
      status: offer?.status || "draft",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditOfferLetterData) => {
      const payload = {
        ...data,
        ctc: data.ctc ? parseInt(data.ctc) : undefined,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
      };
      return apiRequest("PUT", `/api/offer-letters/${offer.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offer-letters"] });
      toast({
        title: "Success",
        description: "Offer letter updated successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update offer letter",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditOfferLetterData) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Offer Letter</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Software Engineer"
                        {...field}
                        data-testid="input-designation"
                      />
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
                        placeholder="650000"
                        {...field}
                        data-testid="input-ctc"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="joiningDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joining Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-joining-date"
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
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-save"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}