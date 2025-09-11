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
import { insertCandidateSchema, type InsertCandidate, type Candidate, type CandidateSkill } from "@shared/schema";
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
  // Required fields with proper validation
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z.string()
    .min(1, "Phone number is required")
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number (e.g., +1234567890 or 1234567890)"),
  primarySkill: z.string()
    .min(1, "Primary skill is required"),
  
  // Experience fields with proper validation
  totalExperience: z.coerce.number()
    .min(0, "Total experience cannot be negative")
    .max(50, "Total experience cannot exceed 50 years"),
  relevantExperience: z.coerce.number()
    .min(0, "Relevant experience cannot be negative")
    .max(50, "Relevant experience cannot exceed 50 years"),
  
  // Optional financial fields
  currentCtc: z.coerce.number().min(0, "Current CTC cannot be negative").optional(),
  expectedCtc: z.coerce.number().min(0, "Expected CTC cannot be negative").optional(),
  
  // Employee ID for internal candidates
  serialNumber: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().int().positive("Employee ID must be a positive number").optional()
  ),
  
  // Date fields
  tentativeDoj: z.string().optional(),
  
  // Candidate type
  candidateType: z.enum(['internal', 'external']).default('internal'),
  
  // External candidate specific validations - conditional based on candidate type
  uanNumber: z.string().optional().refine((val) => {
    // If empty or undefined, it's valid for optional
    if (!val || val === '') return true;
    // If has value, must be 12 digits
    return /^\d{12}$/.test(val);
  }, "UAN number must be exactly 12 digits"),
  
  aadhaarNumber: z.string().optional().refine((val) => {
    // If empty or undefined, it's valid for optional
    if (!val || val === '') return true;
    // If has value, must be 12 digits
    return /^\d{12}$/.test(val);
  }, "Aadhaar number must be exactly 12 digits"),
  
  linkedinUrl: z.string().optional().refine((val) => {
    // If empty or undefined, it's valid for optional
    if (!val || val === '') return true;
    // If has value, must be valid URL
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Please enter a valid LinkedIn URL"),
  
  // External candidate required fields - conditionally validated in refinement
  recruiterName: z.string(),
  source: z.string(),
  clientName: z.string(),
}).refine((data) => {
  // For external candidates, make certain fields required
  if (data.candidateType === 'external') {
    return data.recruiterName && data.recruiterName.trim() !== '';
  }
  return true;
}, {
  message: "Recruiter name is required for external candidates",
  path: ["recruiterName"]
}).refine((data) => {
  // For external candidates, source is required
  if (data.candidateType === 'external') {
    return data.source && data.source.trim() !== '';
  }
  return true;
}, {
  message: "Source is required for external candidates",
  path: ["source"]
}).refine((data) => {
  // For external candidates, client name is required
  if (data.candidateType === 'external') {
    return data.clientName && data.clientName.trim() !== '';
  }
  return true;
}, {
  message: "Client name is required for external candidates",
  path: ["clientName"]
}).refine((data) => {
  // Relevant experience should not exceed total experience
  return data.relevantExperience <= data.totalExperience;
}, {
  message: "Relevant experience cannot exceed total experience",
  path: ["relevantExperience"]
});

interface CandidateFormProps {
  initialData?: Candidate;
  onSubmit: (data: InsertCandidate, skills: CandidateSkill[]) => void;
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

  // Section progression state
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());

  // Define form sections
  const sections = [
    {
      id: 0,
      title: "Candidate Type",
      fields: ["candidateType"]
    },
    {
      id: 1,
      title: "Basic Information",
      fields: candidateType === 'internal' 
        ? ["name", "email", "phone", "primarySkill", "serialNumber", "recruiterName"]
        : ["name", "email", "phone", "primarySkill", "notes"] // notes = father's name for external
    },
    {
      id: 2,
      title: candidateType === 'external' ? "Recruitment Details" : "Experience Information",
      fields: candidateType === 'external'
        ? ["recruiterName", "source", "clientName"]
        : ["totalExperience", "relevantExperience", "currentCompany", "currentLocation", "preferredLocation"]
    },
    {
      id: 3,
      title: candidateType === 'external' ? "Government IDs & Links" : "Compensation & Timeline",
      fields: candidateType === 'external'
        ? ["uanNumber", "aadhaarNumber", "linkedinUrl"]
        : ["currentCtc", "expectedCtc", "noticePeriod", "tentativeDoj"]
    },
    {
      id: 4,
      title: candidateType === 'external' ? "Experience Information" : "Education & Skills",
      fields: candidateType === 'external'
        ? ["totalExperience", "relevantExperience", "currentCompany", "currentLocation", "preferredLocation"]
        : ["highestQualification"]
    },
    {
      id: 5,
      title: candidateType === 'external' ? "Compensation & Timeline" : "Documents & Final Review",
      fields: candidateType === 'external'
        ? ["currentCtc", "expectedCtc", "noticePeriod", "tentativeDoj"]
        : ["status"]
    },
    ...(candidateType === 'external' ? [{
      id: 6,
      title: "Documents & Final Review",
      fields: ["status"]
    }] : [])
  ];

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
      status: (initialData?.status as any) || "Available",
      candidateType: (initialData?.candidateType as 'internal' | 'external') || 'internal',
      // External candidate fields - auto-fill recruiter name from authenticated user
      recruiterName: initialData?.recruiterName || (isAuthenticated && user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ""),
      source: initialData?.source || "",
      clientName: initialData?.clientName || "",
      uanNumber: initialData?.uanNumber || "",
      aadhaarNumber: initialData?.aadhaarNumber || "",
      linkedinUrl: initialData?.linkedinUrl || "",
      highestQualification: initialData?.highestQualification || "",
      // Fields that exist in schema only
      jobLocation: initialData?.jobLocation || "",
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

  // Section validation and navigation functions with robust error checking
  const validateSectionFields = async (sectionIndex: number): Promise<boolean> => {
    const section = sections[sectionIndex];
    console.log('🔍 Validating section:', section.title, 'Fields:', section.fields);
    
    try {
      // First trigger validation for all fields in this section
      const fieldValidationResults = await Promise.all(
        section.fields.map(async (field) => {
          const result = await form.trigger(field as any);
          console.log(`Field ${field} validation result:`, result);
          return result;
        })
      );
      
      // Wait a moment for form state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check form errors after validation
      const formErrors = form.formState.errors;
      console.log('📋 Form errors after validation:', formErrors);
      
      // Get current form values for debugging
      const formValues = form.getValues();
      console.log('📝 Current form values:', {
        name: formValues.name,
        email: formValues.email,
        phone: formValues.phone,
        primarySkill: formValues.primarySkill,
        candidateType: formValues.candidateType
      });
      
      // Check if any section fields have errors
      const sectionHasErrors = section.fields.some(field => {
        const hasError = Boolean(formErrors[field as keyof typeof formErrors]);
        console.log(`Field ${field} has error:`, hasError, formErrors[field as keyof typeof formErrors]);
        return hasError;
      });
      
      // Also check if required fields are empty (additional validation)
      let hasEmptyRequiredFields = false;
      
      if (sectionIndex === 1) { // Basic Information section
        const requiredFields = ['name', 'email', 'phone', 'primarySkill'];
        hasEmptyRequiredFields = requiredFields.some(field => {
          const value = formValues[field as keyof typeof formValues];
          const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
          console.log(`Required field ${field} is empty:`, isEmpty, 'Value:', value);
          return isEmpty;
        });
      }
      
      const isValid = !sectionHasErrors && !hasEmptyRequiredFields;
      
      console.log('✅ Section validation result:', {
        section: section.title,
        isValid,
        sectionHasErrors,
        hasEmptyRequiredFields,
        fieldValidationResults
      });
      
      return isValid;
      
    } catch (error) {
      console.error("❌ Section validation error:", error);
      return false;
    }
  };

  const handleNextSection = async () => {
    console.log('🚀 Attempting to move to next section from:', currentSection);
    
    // Force validation of the entire form first
    const allFieldsValid = await form.trigger();
    console.log('📊 All fields validation result:', allFieldsValid);
    
    // Then validate just this section
    const isCurrentSectionValid = await validateSectionFields(currentSection);
    console.log('📋 Current section validation result:', isCurrentSectionValid);
    
    if (!isCurrentSectionValid) {
      const section = sections[currentSection];
      const formErrors = form.formState.errors;
      
      console.log('🚫 Blocking progression due to validation errors:', formErrors);
      
      // Get specific error messages with better formatting
      const errorDetails = section.fields
        .map(field => {
          const error = formErrors[field as keyof typeof formErrors];
          const value = form.getValues(field as any);
          return {
            field,
            error: error?.message,
            value,
            hasError: Boolean(error)
          };
        })
        .filter(item => item.hasError || !item.value);
        
      console.log('📝 Error details:', errorDetails);
      
      const errorMessages = errorDetails.map(item => 
        `${item.field}: ${item.error || 'This field is required'}`
      );
      
      toast({
        title: "❌ Validation Failed",
        description: errorMessages.length > 0 
          ? `Please fix these issues before proceeding:\n• ${errorMessages.join('\n• ')}`
          : `Please complete all required fields in "${section.title}" before proceeding.`,
        variant: "destructive",
      });
      
      // Focus on first problematic field
      const firstErrorField = errorDetails[0]?.field;
      if (firstErrorField) {
        // Try multiple selectors to find the field
        const selectors = [
          `[data-testid*="${firstErrorField}"]`,
          `[name="${firstErrorField}"]`,
          `input[placeholder*="${firstErrorField}"]`
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if ('focus' in element) {
              (element as HTMLElement).focus();
            }
            break;
          }
        }
      }
      
      return false;
    }

    console.log('✅ Section validation passed, moving to next section');

    // Mark current section as completed
    setCompletedSections(prev => new Set([...prev, currentSection]));
    
    // Move to next section
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      console.log('➡️ Moved to section:', currentSection + 1);
    }
    
    return true;
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const canProceedToNext = () => {
    return currentSection < sections.length - 1;
  };

  const canGoBack = () => {
    return currentSection > 0;
  };

  const isSectionCompleted = (sectionIndex: number) => {
    return completedSections.has(sectionIndex);
  };

  // Handle Primary Skill selection - auto-populate Skills & Expertise
  const handlePrimarySkillSelect = (skill: any) => {
    const primarySkillEntry = {
      id: `primary-${skill.id}`,
      name: skill.name,
      category: skill.category || 'technical',
      proficiency: 5 as const, // Expert level for primary skill
      yearsOfExperience: parseInt(String(form.getValues('totalExperience'))) || 1,
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
      linkedinUrl: values.linkedinUrl || null,
      // Include structured document data
      educationData: JSON.stringify(educationEntries),
      employmentData: JSON.stringify(employmentEntries),
      identityData: JSON.stringify(identityDocuments),
      additionalData: JSON.stringify(additionalDocuments),
    };
    onSubmit(candidateData, selectedSkills);
  }

  // Function to render section-specific content
  const renderSectionContent = () => {
    const section = sections[currentSection];
    
    switch (section.id) {
      case 0: // Candidate Type Selection
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {section.title}
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
                    <FormMessage role="alert" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );

      case 1: // Basic Information
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {section.title}
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
                    <FormMessage role="alert" />
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
                    <FormMessage role="alert" />
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
                    <FormMessage role="alert" />
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
                          handlePrimarySkillSelect(skill);
                        }}
                        placeholder="Select your primary skill"
                        data-testid="dropdown-primary-skill"
                      />
                    </FormControl>
                    <FormMessage role="alert" />
                  </FormItem>
                )}
              />

              {candidateType === 'internal' && (
                <>
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee ID</FormLabel>
                        <FormControl>
                          <Input data-testid="input-employee-id" placeholder="Enter employee ID" {...field} />
                        </FormControl>
                        <FormMessage role="alert" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recruiterName"
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
                        <FormMessage role="alert" />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {candidateType === 'external' && (
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name</FormLabel>
                      <FormControl>
                        <Input data-testid="input-father-name" placeholder="Enter father's name" {...field} />
                      </FormControl>
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
        );

      case 2: // Recruitment Details or Experience Information
        if (candidateType === 'external') {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {section.title}
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
                      <FormMessage role="alert" />
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
                      <FormMessage role="alert" />
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
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          );
        } else {
          return <ExperienceSection control={form.control} />;
        }

      case 3: // Government IDs & Links or Compensation & Timeline
        if (candidateType === 'external') {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {section.title}
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
                      <FormMessage role="alert" />
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
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-linkedin-url" 
                          placeholder="https://linkedin.com/in/yourprofile"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          );
        } else {
          return <CompensationSection control={form.control} />;
        }

      case 4: // Experience Information or Education & Skills
        if (candidateType === 'external') {
          return <ExperienceSection control={form.control} />;
        } else {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Education & Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="highestQualification"
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
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />

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
          );
        }

      case 5: // Compensation & Timeline or Documents & Final Review
        if (candidateType === 'external') {
          return <CompensationSection control={form.control} />;
        } else {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Documents & Final Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <FormField
                  control={form.control}
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
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          );
        }

      case 6: // Documents & Final Review (external candidates only)
        return (
          <Card>
            <CardHeader>
              <CardTitle>Documents & Final Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <FormField
                control={form.control}
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
                    <FormMessage role="alert" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Add New Candidate</h2>
            <div className="text-sm text-muted-foreground">
              Step {currentSection + 1} of {sections.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            />
          </div>

          {/* Section Steps */}
          <div className="flex flex-wrap gap-2">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  index === currentSection
                    ? "bg-blue-600 text-white"
                    : isSectionCompleted(index)
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {section.title}
              </div>
            ))}
          </div>
        </div>

        {/* Current Section Content */}
        {renderSectionContent()}

        {/* Navigation Controls */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreviousSection}
            disabled={!canGoBack()}
            data-testid="button-previous"
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {canProceedToNext() ? (
              <Button
                type="button"
                onClick={handleNextSection}
                data-testid="button-next"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading || resumeUploading}
                className="min-w-32"
                data-testid="button-submit"
              >
                {isLoading ? "Saving..." : initialData ? "Update Candidate" : "Create Candidate"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
