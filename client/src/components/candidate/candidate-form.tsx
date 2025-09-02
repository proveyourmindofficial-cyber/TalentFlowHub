import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Upload, Users, Building2, FileText, DollarSign, Calendar } from "lucide-react";
import { insertCandidateSchema, type InsertCandidate, type Candidate } from "@shared/schema";
import { z } from "zod";
import { ObjectUploader } from "@/components/ObjectUploader";
import { DropdownWithAdd } from "@/components/ui/dropdown-with-add";
import { PrimarySkillDropdown } from "@/components/ui/primary-skill-dropdown";
import { ExperienceSection, CompensationSection, DocumentsSection } from "./candidate-form-sections";
import { DocumentManager } from "./document-manager";
import { SkillsManager } from "./skills-manager";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { UploadResult } from "@uppy/core";

const candidateFormSchema = insertCandidateSchema.extend({
  totalExperience: z.coerce.number().min(0).max(50),
  relevantExperience: z.coerce.number().min(0).max(50),
  currentCtc: z.coerce.number().min(0).optional(),
  expectedCtc: z.coerce.number().min(0).optional(),
  tentativeDoj: z.string().optional(),
  candidateType: z.enum(['internal', 'external']).default('internal'),
  // External candidate specific validations
  uanNumber: z.string().regex(/^\d{12}$/, "UAN must be 12 digits").optional().or(z.literal('')),
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits").optional().or(z.literal('')),
  linkedInUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
});

interface CandidateFormProps {
  initialData?: Candidate;
  onSubmit: (data: InsertCandidate) => void;
  isLoading?: boolean;
}

export function CandidateForm({ initialData, onSubmit, isLoading }: CandidateFormProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [resumeUploading, setResumeUploading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<any[]>([]);
  const [candidateType, setCandidateType] = useState<'internal' | 'external'>(
    (initialData?.candidateType as 'internal' | 'external') || 'internal'
  );

  // Document Manager State  
  const [educationEntries, setEducationEntries] = useState(() => {
    try {
      return initialData?.educationData ? JSON.parse(initialData.educationData as string) : [];
    } catch {
      return [];
    }
  });
  
  const [employmentEntries, setEmploymentEntries] = useState(() => {
    try {
      return initialData?.employmentData ? JSON.parse(initialData.employmentData as string) : [];
    } catch {
      return [];
    }
  });
  
  const [identityDocuments, setIdentityDocuments] = useState(() => {
    try {
      return initialData?.identityData ? JSON.parse(initialData.identityData as string) : {
        aadhaar: { number: "", documents: [] },
        pan: { number: "", documents: [] },
        passport: { number: "", documents: [] },
        uan: { number: "", documents: [] },
      };
    } catch {
      return {
        aadhaar: { number: "", documents: [] },
        pan: { number: "", documents: [] },
        passport: { number: "", documents: [] },
        uan: { number: "", documents: [] },
      };
    }
  });
  
  const [additionalDocuments, setAdditionalDocuments] = useState(() => {
    try {
      return initialData?.additionalData ? JSON.parse(initialData.additionalData as string) : {
        resume: [],
        linkedinVerification: { url: "", documents: [] },
        videoScreening: { url: "", documents: [] },
        other: [],
      };
    } catch {
      return {
        resume: [],
        linkedinVerification: { url: "", documents: [] },
        videoScreening: { url: "", documents: [] },
        other: [],
      };
    }
  });

  const form = useForm<z.infer<typeof candidateFormSchema>>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      primarySkill: initialData?.primarySkill || "",
      totalExperience: Number(initialData?.totalExperience) || 0,
      relevantExperience: Number(initialData?.relevantExperience) || 0,
      currentCompany: initialData?.currentCompany || "",
      currentLocation: initialData?.currentLocation || "",
      preferredLocation: initialData?.preferredLocation || "",
      currentCtc: initialData?.currentCtc ? Number(initialData.currentCtc) : undefined,
      expectedCtc: initialData?.expectedCtc ? Number(initialData.expectedCtc) : undefined,
      noticePeriod: initialData?.noticePeriod || "",
      tentativeDoj: initialData?.tentativeDoj || "",
      resumeUrl: initialData?.resumeUrl || "",
      notes: initialData?.notes || "",
      status: initialData?.status || "Available",
      candidateType: (initialData?.candidateType as 'internal' | 'external') || 'internal',
      // External candidate fields - auto-fill recruiter name from authenticated user
      recruiterName: initialData?.recruiterName || (isAuthenticated && user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ""),
      source: initialData?.source || "",
      clientName: initialData?.clientName || "",
      uanNumber: initialData?.uanNumber || "",
      aadhaarNumber: initialData?.aadhaarNumber || "",
      linkedInUrl: initialData?.linkedInUrl || "",
      fatherName: initialData?.fatherName || "",
      currentAddress: initialData?.currentAddress || "",
      permanentAddress: initialData?.permanentAddress || "",
      qualification: initialData?.qualification || "",
      skills: initialData?.skills || "",
      // Additional dropdown fields
      emergencyContactName: initialData?.emergencyContactName || "",
      emergencyContactNumber: initialData?.emergencyContactNumber || "",
      relationshipWithEmergencyContact: initialData?.relationshipWithEmergencyContact || "",
      bloodGroup: initialData?.bloodGroup || "",
      maritalStatus: initialData?.maritalStatus || "",
      nationality: initialData?.nationality || "",
      religion: initialData?.religion || "",
    },
  });

  const handleResumeUpload = async () => {
    try {
      const response = await fetch("/api/objects/upload", {
        method: "POST",
      });
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      toast({
        title: "Upload Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleResumeUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      setResumeUploading(true);
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const uploadURL = uploadedFile.uploadURL;
        
        const response = await fetch("/api/resumes", {
          method: "PUT",
          body: JSON.stringify({ resumeURL: uploadURL }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();

        form.setValue("resumeUrl", data.objectPath);
        toast({
          title: "Resume Uploaded",
          description: "Resume has been uploaded successfully",
        });
      }
    } catch (error) {
      console.error("Error processing resume upload:", error);
      toast({
        title: "Upload Error",
        description: "Failed to process resume upload",
        variant: "destructive",
      });
    } finally {
      setResumeUploading(false);
    }
  };

  // Auto-fill recruiter name when user is authenticated and no existing recruiter name
  useEffect(() => {
    if (isAuthenticated && user && !initialData?.recruiterName) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (fullName && form.getValues('recruiterName') !== fullName) {
        form.setValue('recruiterName', fullName);
      }
    }
  }, [isAuthenticated, user, form, initialData?.recruiterName]);

  // Watch candidate type changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'candidateType' && value.candidateType !== candidateType) {
        setCandidateType(value.candidateType as 'internal' | 'external');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, candidateType]);

  // Role-based permissions for recruiter field editing
  const canEditRecruiterField = () => {
    if (!isAuthenticated || !user) return true; // Allow editing if not authenticated
    
    // Directors can edit any recruiter name
    if (user.role === 'director') return true;
    
    // Account managers can edit recruiter names
    if (user.role === 'am') return true;
    
    // Recruiters can only edit if it's their own name or empty
    if (user.role === 'recruiter') {
      const currentRecruiterName = form.getValues('recruiterName');
      const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return !currentRecruiterName || currentRecruiterName === userFullName;
    }
    
    // HR can edit recruiter names
    if (user.role === 'hr') return true;
    
    // Others cannot edit
    return false;
  };

  // Handle Primary Skill selection - auto-populate Skills & Expertise
  const handlePrimarySkillSelect = (skill: any) => {
    const primarySkillEntry = {
      id: `primary-${skill.id}`,
      name: skill.name,
      category: skill.category || 'technical',
      proficiency: 5 as const, // Expert level for primary skill
      yearsOfExperience: parseInt(form.getValues('totalExperience') as string) || 1,
      candidateId: 'temp',
      addedAt: new Date().toISOString(),
    };

    // Check if primary skill is already in selected skills
    const existingSkillIndex = selectedSkills.findIndex(s => s.name === skill.name);
    
    if (existingSkillIndex >= 0) {
      // Update existing skill to Expert level
      const updatedSkills = [...selectedSkills];
      updatedSkills[existingSkillIndex] = { ...updatedSkills[existingSkillIndex], proficiency: 5 };
      setSelectedSkills(updatedSkills);
    } else {
      // Add new skill at Expert level
      setSelectedSkills(prev => [primarySkillEntry, ...prev]);
    }

    toast({
      title: "Primary Skill Added",
      description: `${skill.name} has been added to your Skills & Expertise at Expert level.`,
    });
  };

  function handleSubmit(values: z.infer<typeof candidateFormSchema>) {
    const candidateData: InsertCandidate = {
      ...values,
      totalExperience: values.totalExperience.toString(),
      relevantExperience: values.relevantExperience.toString(),
      currentCtc: values.currentCtc?.toString(),
      expectedCtc: values.expectedCtc?.toString(),
      // Handle empty date fields - convert empty strings to null
      tentativeDoj: values.tentativeDoj || null,
      // Convert empty strings to null for optional fields
      uanNumber: values.uanNumber || null,
      aadhaarNumber: values.aadhaarNumber || null,
      linkedInUrl: values.linkedInUrl || null,
      // Include structured document data
      educationData: JSON.stringify(educationEntries),
      employmentData: JSON.stringify(employmentEntries),
      identityData: JSON.stringify(identityDocuments),
      additionalData: JSON.stringify(additionalDocuments),
    };
    onSubmit(candidateData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Candidate Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidate Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="candidateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Candidate Type *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="select-candidate-type">
                        <SelectValue placeholder="Select candidate type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal Candidate</SelectItem>
                        <SelectItem value="external">External Candidate</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidateType === 'external' && (
              <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>S.No:</strong> Will be auto-generated | 
                  <strong> Date:</strong> Will be set to today's date automatically
                </p>
              </div>
            )}
            
            {candidateType === 'internal' && (
              <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Internal Candidate:</strong> Employee ID and department information will be required | 
                  <strong>Referral tracking:</strong> Available for internal recommendations
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input data-testid="input-name" placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input data-testid="input-email" type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input data-testid="input-phone" placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primarySkill"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Skill *</FormLabel>
                  <FormControl>
                    <PrimarySkillDropdown
                      value={field.value}
                      onValueChange={field.onChange}
                      onSkillSelect={(skill) => {
                        // Auto-populate Skills & Expertise with primary skill at Expert level
                        handlePrimarySkillSelect(skill);
                      }}
                      placeholder="Select your primary skill"
                      data-testid="dropdown-primary-skill"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {candidateType === 'internal' && (
              <>
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID</FormLabel>
                      <FormControl>
                        <Input data-testid="input-employee-id" placeholder="Enter employee ID" {...field} />
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
                      <FormLabel>Current Department</FormLabel>
                      <FormControl>
                        <DropdownWithAdd
                          category="current_department"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select or add department"
                          data-testid="dropdown-department"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </>
            )}

            {candidateType === 'external' && (
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father's Name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-father-name" placeholder="Enter father's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* External Candidate Specific Fields */}
        {candidateType === 'external' && (
          <>
            {/* Recruitment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Recruitment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recruiterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Recruiter Name *
                        {isAuthenticated && user && field.value === `${user.firstName || ''} ${user.lastName || ''}`.trim() && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            Auto-filled
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <DropdownWithAdd
                          category="recruiter_name"
                          value={field.value}
                          onValueChange={canEditRecruiterField() ? field.onChange : undefined}
                          placeholder={canEditRecruiterField() ? "Select or add recruiter" : "Recruiter name (read-only)"}
                          disabled={!canEditRecruiterField()}
                          data-testid="dropdown-recruiter-name"
                        />
                      </FormControl>
                      {!canEditRecruiterField() && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Only directors, managers, and HR can modify recruiter assignments
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source *</FormLabel>
                      <FormControl>
                        <DropdownWithAdd
                          category="source"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select or add source"
                          data-testid="dropdown-source"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name *</FormLabel>
                      <FormControl>
                        <DropdownWithAdd
                          category="client_name"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select or add client"
                          data-testid="dropdown-client-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Government IDs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Government IDs & Links
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="uanNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UAN Number (12 digits)</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-uan-number" 
                          placeholder="Enter 12-digit UAN number" 
                          {...field}
                          maxLength={12}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aadhaarNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number (12 digits)</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-aadhaar-number" 
                          placeholder="Enter 12-digit Aadhaar number" 
                          {...field}
                          maxLength={12}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedInUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn Profile URL</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-linkedin-url" 
                          placeholder="https://www.linkedin.com/in/username" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          data-testid="textarea-current-address"
                          placeholder="Enter current address"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permanentAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permanent Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          data-testid="textarea-permanent-address"
                          placeholder="Enter permanent address"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger data-testid="select-blood-group">
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger data-testid="select-marital-status">
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-nationality" 
                          placeholder="Enter nationality (e.g., Indian)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religion</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-religion" 
                          placeholder="Enter religion (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-emergency-contact-name" 
                          placeholder="Enter emergency contact name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Number</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-emergency-contact-number" 
                          placeholder="Enter emergency contact number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relationshipWithEmergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger data-testid="select-relationship">
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Father">Father</SelectItem>
                            <SelectItem value="Mother">Mother</SelectItem>
                            <SelectItem value="Spouse">Spouse</SelectItem>
                            <SelectItem value="Brother">Brother</SelectItem>
                            <SelectItem value="Sister">Sister</SelectItem>
                            <SelectItem value="Friend">Friend</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Education & Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Education & Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <DropdownWithAdd
                          category="qualification"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select or add qualification"
                          data-testid="dropdown-qualification"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Advanced Skills Manager */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Skills & Expertise</h3>
                  <SkillsManager
                    candidateId={initialData?.id}
                    selectedSkills={selectedSkills}
                    onSkillsChange={setSelectedSkills}
                    readOnly={false}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Common sections for both candidate types */}
        <ExperienceSection control={form.control} />
        
        <CompensationSection control={form.control} />

        {/* Advanced Document Manager */}
        <DocumentManager
          candidateType={candidateType}
          educationEntries={educationEntries}
          employmentEntries={employmentEntries}
          identityDocuments={identityDocuments}
          additionalDocuments={additionalDocuments}
          onEducationChange={setEducationEntries}
          onEmploymentChange={setEmploymentEntries}
          onIdentityChange={setIdentityDocuments}
          onAdditionalChange={setAdditionalDocuments}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
            disabled={isLoading || resumeUploading}
            className="min-w-32"
            data-testid="button-submit"
          >
            {isLoading ? "Saving..." : initialData ? "Update Candidate" : "Create Candidate"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
