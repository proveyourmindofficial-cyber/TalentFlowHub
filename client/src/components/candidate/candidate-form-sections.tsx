import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, FileText, Upload } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { DropdownWithAdd } from "@/components/ui/dropdown-with-add";
import type { Control } from "react-hook-form";

interface FormSectionsProps {
  control: Control<any>;
  resumeUploading: boolean;
  handleResumeUpload: () => Promise<any>;
  handleResumeUploadComplete: (result: any) => Promise<void>;
  resumeUrl: string;
}

export function ExperienceSection({ control }: { control: Control<any> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Experience Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="totalExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Experience (Years) *</FormLabel>
              <FormControl>
                <Input data-testid="input-total-experience" type="number" step="0.1" placeholder="0.0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="relevantExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relevant Experience (Years) *</FormLabel>
              <FormControl>
                <Input data-testid="input-relevant-experience" type="number" step="0.1" placeholder="0.0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="currentCompany"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Company</FormLabel>
              <FormControl>
                <DropdownWithAdd
                  category="current_company"
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select or add company"
                  data-testid="dropdown-current-company"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="currentLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Location</FormLabel>
              <FormControl>
                <DropdownWithAdd
                  category="current_location"
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select or add location"
                  data-testid="dropdown-current-location"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="preferredLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Location</FormLabel>
              <FormControl>
                <DropdownWithAdd
                  category="preferred_location"
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select or add preferred location"
                  data-testid="dropdown-preferred-location"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function CompensationSection({ control }: { control: Control<any> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Compensation & Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="currentCtc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current CTC (₹)</FormLabel>
              <FormControl>
                <Input data-testid="input-current-ctc" type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="expectedCtc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected CTC (₹)</FormLabel>
              <FormControl>
                <Input data-testid="input-expected-ctc" type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="noticePeriod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notice Period</FormLabel>
              <FormControl>
                <Input data-testid="input-notice-period" placeholder="e.g., 30 days" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="tentativeDoj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tentative Date of Joining</FormLabel>
              <FormControl>
                <Input data-testid="input-tentative-doj" type="date" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function DocumentsSection({ 
  control, 
  resumeUploading, 
  handleResumeUpload, 
  handleResumeUploadComplete, 
  resumeUrl 
}: FormSectionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Documents & Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="resumeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume Upload *</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880}
                    onGetUploadParameters={handleResumeUpload}
                    onComplete={handleResumeUploadComplete}
                    buttonClassName="w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {resumeUploading ? "Uploading..." : "Upload Resume (PDF/DOC)"}
                    </div>
                  </ObjectUploader>
                  {resumeUrl && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ Resume uploaded successfully
                    </p>
                  )}
                  <input type="hidden" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="documentsUrls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Documents</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <ObjectUploader
                    maxNumberOfFiles={5}
                    maxFileSize={5242880}
                    onGetUploadParameters={handleResumeUpload}
                    onComplete={handleResumeUploadComplete}
                    buttonClassName="w-full border-dashed"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Additional Documents (ID Proof, Certificates, etc.)
                    </div>
                  </ObjectUploader>
                  <p className="text-xs text-muted-foreground">
                    Upload up to 5 documents: ID Proof, Educational Certificates, Experience Letters, etc.
                  </p>
                  <input type="hidden" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  data-testid="textarea-notes"
                  placeholder="Any additional information about the candidate"
                  {...field}
                  value={field.value || ""}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Interviewing">Interviewing</SelectItem>
                    <SelectItem value="Offered">Offered</SelectItem>
                    <SelectItem value="Placed">Placed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}