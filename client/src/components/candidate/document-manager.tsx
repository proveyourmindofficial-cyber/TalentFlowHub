import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ModernFileUpload } from "@/components/ui/modern-file-upload";
import { Upload, FileText, Download, Trash2, Eye, Plus, GraduationCap, Briefcase, CreditCard, FolderPlus, FolderOpen } from "lucide-react";
import type { UploadResult } from "@uppy/core";

interface EducationEntry {
  id: string;
  qualification: string;
  institutionName: string;
  passedOutYear: string;
  percentage?: string;
  documents: UploadedDocument[];
}

interface EmploymentEntry {
  id: string;
  organizationName: string;
  designation: string;
  fromDate: string;
  toDate: string;
  ctc?: string;
  location: string;
  documents: UploadedDocument[];
}

interface IdentityDocuments {
  aadhaar: { number: string; documents: UploadedDocument[] };
  pan: { number: string; documents: UploadedDocument[] };
  passport: { number: string; documents: UploadedDocument[] };
  uan: { number: string; documents: UploadedDocument[] };
}

interface AdditionalDocuments {
  resume: UploadedDocument[];
  linkedinVerification: { url: string; documents: UploadedDocument[] };
  videoScreening: { url: string; documents: UploadedDocument[] };
  other: UploadedDocument[];
}

interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  size: number;
}

interface DocumentManagerProps {
  candidateType: "internal" | "external";
  educationEntries: EducationEntry[];
  employmentEntries: EmploymentEntry[];
  identityDocuments: IdentityDocuments;
  additionalDocuments: AdditionalDocuments;
  onEducationChange: (entries: EducationEntry[]) => void;
  onEmploymentChange: (entries: EmploymentEntry[]) => void;
  onIdentityChange: (identity: IdentityDocuments) => void;
  onAdditionalChange: (additional: AdditionalDocuments) => void;
}

const QUALIFICATION_OPTIONS = [
  "High School",
  "Intermediate/12th", 
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "MBA",
  "Ph.D",
  "Professional Certification",
  "Other"
];

const EMPLOYMENT_DOCUMENT_TYPES = [
  "Offer Letter",
  "Experience Letter", 
  "Bank Statement",
  "Salary Slips",
  "PF Statement",
  "ESI Document",
  "Relieving Letter",
  "Other"
];

export function DocumentManager({
  candidateType,
  educationEntries,
  employmentEntries,
  identityDocuments,
  additionalDocuments,
  onEducationChange,
  onEmploymentChange,
  onIdentityChange,
  onAdditionalChange,
}: DocumentManagerProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [currentUploadContext, setCurrentUploadContext] = useState<{
    section: string;
    entryId: string | null;
    documentType: string;
  } | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleModernUpload = async (files: File[]) => {
    if (!currentUploadContext) return;
    
    const { section, entryId, documentType } = currentUploadContext;
    setUploading(`${section}-${entryId}-${documentType}`);
    
    try {
      for (const file of files) {
        // Get upload URL
        const response = await fetch("/api/objects/upload", { method: "POST" });
        const data = await response.json();
        
        // Upload file
        await fetch(data.uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type }
        });
        
        // Create document entry
        const newDoc: UploadedDocument = {
          id: generateId(),
          name: file.name,
          url: data.uploadURL,
          uploadedAt: new Date().toISOString(),
          size: file.size,
        };
        
        // Add to appropriate section
        if (section === "education" && entryId) {
          updateEducationEntry(entryId, "documents", [
            ...educationEntries.find(e => e.id === entryId)?.documents || [],
            newDoc
          ]);
        } else if (section === "employment" && entryId) {
          updateEmploymentEntry(entryId, "documents", [
            ...employmentEntries.find(e => e.id === entryId)?.documents || [],
            newDoc
          ]);
        } else if (section === "identity") {
          const identityType = documentType as keyof IdentityDocuments;
          onIdentityChange({
            ...identityDocuments,
            [identityType]: {
              ...identityDocuments[identityType],
              documents: [...identityDocuments[identityType].documents, newDoc]
            }
          });
        } else if (section === "additional") {
          const additionalType = documentType as keyof AdditionalDocuments;
          if (additionalType === "linkedinVerification" || additionalType === "videoScreening") {
            onAdditionalChange({
              ...additionalDocuments,
              [additionalType]: {
                ...additionalDocuments[additionalType],
                documents: [...additionalDocuments[additionalType].documents, newDoc]
              }
            });
          } else {
            onAdditionalChange({
              ...additionalDocuments,
              [additionalType]: [...(additionalDocuments[additionalType] as UploadedDocument[]), newDoc]
            });
          }
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(null);
      setUploadModalOpen(false);
      setCurrentUploadContext(null);
    }
  };
  
  const handleUpload = async () => {
    return {
      method: "PUT" as const,
      url: "https://example.com/upload", // This would be replaced with actual upload URL
    };
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Education Entry Management
  const addEducationEntry = () => {
    const newEntry: EducationEntry = {
      id: generateId(),
      qualification: "",
      institutionName: "",
      passedOutYear: "",
      percentage: "",
      documents: []
    };
    onEducationChange([...educationEntries, newEntry]);
  };

  const updateEducationEntry = (id: string, field: keyof EducationEntry, value: any) => {
    const updated = educationEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    onEducationChange(updated);
  };

  const removeEducationEntry = (id: string) => {
    onEducationChange(educationEntries.filter(entry => entry.id !== id));
  };

  // Employment Entry Management
  const addEmploymentEntry = () => {
    const newEntry: EmploymentEntry = {
      id: generateId(),
      organizationName: "",
      designation: "",
      fromDate: "",
      toDate: "",
      ctc: "",
      location: "",
      documents: []
    };
    onEmploymentChange([...employmentEntries, newEntry]);
  };

  const updateEmploymentEntry = (id: string, field: keyof EmploymentEntry, value: any) => {
    const updated = employmentEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    onEmploymentChange(updated);
  };

  const removeEmploymentEntry = (id: string) => {
    onEmploymentChange(employmentEntries.filter(entry => entry.id !== id));
  };

  // Document Upload Handler
  const handleDocumentUpload = async (
    section: string,
    entryId: string | null,
    documentType: string,
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => {
    setUploading(null);
    
    const newDoc: UploadedDocument = {
      id: generateId(),
      name: result.successful[0]?.name || "Unknown",
      url: result.successful[0]?.uploadURL || "",
      uploadedAt: new Date().toISOString(),
      size: result.successful[0]?.size || 0,
    };

    if (section === "education" && entryId) {
      updateEducationEntry(entryId, "documents", [
        ...educationEntries.find(e => e.id === entryId)?.documents || [],
        newDoc
      ]);
    } else if (section === "employment" && entryId) {
      updateEmploymentEntry(entryId, "documents", [
        ...employmentEntries.find(e => e.id === entryId)?.documents || [],
        newDoc
      ]);
    } else if (section === "identity") {
      const identityType = documentType as keyof IdentityDocuments;
      onIdentityChange({
        ...identityDocuments,
        [identityType]: {
          ...identityDocuments[identityType],
          documents: [...identityDocuments[identityType].documents, newDoc]
        }
      });
    } else if (section === "additional") {
      const additionalType = documentType as keyof AdditionalDocuments;
      if (additionalType === "linkedinVerification" || additionalType === "videoScreening") {
        onAdditionalChange({
          ...additionalDocuments,
          [additionalType]: {
            ...additionalDocuments[additionalType],
            documents: [...additionalDocuments[additionalType].documents, newDoc]
          }
        });
      } else {
        onAdditionalChange({
          ...additionalDocuments,
          [additionalType]: [...(additionalDocuments[additionalType] as UploadedDocument[]), newDoc]
        });
      }
    }
  };

  const removeDocument = (section: string, entryId: string | null, documentId: string, documentType?: string) => {
    if (section === "education" && entryId) {
      const entry = educationEntries.find(e => e.id === entryId);
      if (entry) {
        updateEducationEntry(entryId, "documents", entry.documents.filter(d => d.id !== documentId));
      }
    } else if (section === "employment" && entryId) {
      const entry = employmentEntries.find(e => e.id === entryId);
      if (entry) {
        updateEmploymentEntry(entryId, "documents", entry.documents.filter(d => d.id !== documentId));
      }
    } else if (section === "identity" && documentType) {
      const identityType = documentType as keyof IdentityDocuments;
      onIdentityChange({
        ...identityDocuments,
        [identityType]: {
          ...identityDocuments[identityType],
          documents: identityDocuments[identityType].documents.filter(d => d.id !== documentId)
        }
      });
    } else if (section === "additional" && documentType) {
      const additionalType = documentType as keyof AdditionalDocuments;
      if (additionalType === "linkedinVerification" || additionalType === "videoScreening") {
        onAdditionalChange({
          ...additionalDocuments,
          [additionalType]: {
            ...additionalDocuments[additionalType],
            documents: additionalDocuments[additionalType].documents.filter(d => d.id !== documentId)
          }
        });
      } else {
        onAdditionalChange({
          ...additionalDocuments,
          [additionalType]: (additionalDocuments[additionalType] as UploadedDocument[]).filter(d => d.id !== documentId)
        });
      }
    }
  };

  const DocumentUploadRow = ({ 
    documents, 
    onUpload, 
    section, 
    entryId = null, 
    documentType, 
    allowedTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"] 
  }: {
    documents: UploadedDocument[];
    onUpload: () => void;
    section: string;
    entryId?: string | null;
    documentType: string;
    allowedTypes?: string[];
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setCurrentUploadContext({ section, entryId, documentType });
            setUploadModalOpen(true);
          }}
          disabled={uploading === `${section}-${entryId}-${documentType}`}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-medium"
        >
          <Upload className="h-4 w-4 mr-1" />
          {uploading === `${section}-${entryId}-${documentType}` ? "Uploading..." : "Upload Document"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Allowed: {allowedTypes.join(", ")}
        </span>
      </div>
      
      {documents.length > 0 && (
        <div className="space-y-1">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(doc.url, "_blank")}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(section, entryId, doc.id, documentType)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Document Manager
            <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              Smart Organization
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Organize documents by category with structured information and file uploads
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["education"]} className="w-full">
          
          {/* Education Section */}
          <AccordionItem value="education">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                <span>Education Details</span>
                <Badge variant="secondary">{educationEntries.length} entries</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {educationEntries.map((entry, index) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Education Entry {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEducationEntry(entry.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`qualification-${entry.id}`}>Qualification *</Label>
                      <Select 
                        value={entry.qualification} 
                        onValueChange={(value) => updateEducationEntry(entry.id, "qualification", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select qualification..." />
                        </SelectTrigger>
                        <SelectContent>
                          {QUALIFICATION_OPTIONS.map((qual) => (
                            <SelectItem key={qual} value={qual}>{qual}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor={`institution-${entry.id}`}>Institution Name *</Label>
                      <Input
                        id={`institution-${entry.id}`}
                        value={entry.institutionName}
                        onChange={(e) => updateEducationEntry(entry.id, "institutionName", e.target.value)}
                        placeholder="Enter institution name..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`year-${entry.id}`}>Passed Out Year *</Label>
                      <Input
                        id={`year-${entry.id}`}
                        type="number"
                        min="1950"
                        max="2030"
                        value={entry.passedOutYear}
                        onChange={(e) => updateEducationEntry(entry.id, "passedOutYear", e.target.value)}
                        placeholder="YYYY"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`percentage-${entry.id}`}>Percentage/CGPA</Label>
                      <Input
                        id={`percentage-${entry.id}`}
                        value={entry.percentage || ""}
                        onChange={(e) => updateEducationEntry(entry.id, "percentage", e.target.value)}
                        placeholder="85% or 8.5 CGPA"
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <Label className="text-sm font-medium">
                      Upload Document {entry.qualification ? `(${entry.qualification} Certificate)` : ""}
                    </Label>
                    <div className="mt-2">
                      <DocumentUploadRow
                        documents={entry.documents}
                        onUpload={() => setUploading(`education-${entry.id}-certificate`)}
                        section="education"
                        entryId={entry.id}
                        documentType="certificate"
                        allowedTypes={[".pdf", ".jpg", ".jpeg", ".png"]}
                      />
                    </div>
                  </div>
                </Card>
              ))}
              
              <Button type="button" onClick={addEducationEntry} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Education Entry
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Employment Section */}
          <AccordionItem value="employment">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <span>Employment History</span>
                <Badge variant="secondary">{employmentEntries.length} entries</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {employmentEntries.map((entry, index) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Employment Entry {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEmploymentEntry(entry.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor={`organization-${entry.id}`}>Organization Name *</Label>
                      <Input
                        id={`organization-${entry.id}`}
                        value={entry.organizationName}
                        onChange={(e) => updateEmploymentEntry(entry.id, "organizationName", e.target.value)}
                        placeholder="Enter company name..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`designation-${entry.id}`}>Designation *</Label>
                      <Input
                        id={`designation-${entry.id}`}
                        value={entry.designation}
                        onChange={(e) => updateEmploymentEntry(entry.id, "designation", e.target.value)}
                        placeholder="Enter job title..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`from-date-${entry.id}`}>From Date *</Label>
                      <Input
                        id={`from-date-${entry.id}`}
                        type="date"
                        value={entry.fromDate}
                        onChange={(e) => updateEmploymentEntry(entry.id, "fromDate", e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`to-date-${entry.id}`}>To Date *</Label>
                      <Input
                        id={`to-date-${entry.id}`}
                        type="date"
                        value={entry.toDate}
                        onChange={(e) => updateEmploymentEntry(entry.id, "toDate", e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`ctc-${entry.id}`}>CTC</Label>
                      <Input
                        id={`ctc-${entry.id}`}
                        value={entry.ctc || ""}
                        onChange={(e) => updateEmploymentEntry(entry.id, "ctc", e.target.value)}
                        placeholder="₹ 5,00,000 LPA"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`location-${entry.id}`}>Location</Label>
                      <Input
                        id={`location-${entry.id}`}
                        value={entry.location}
                        onChange={(e) => updateEmploymentEntry(entry.id, "location", e.target.value)}
                        placeholder="City, State"
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <Label className="text-sm font-medium">Employment Documents</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upload relevant documents: Offer Letter, Experience Letter, Bank Statement, Salary Slips, PF/ESI Documents
                    </p>
                    <DocumentUploadRow
                      documents={entry.documents}
                      onUpload={() => setUploading(`employment-${entry.id}-documents`)}
                      section="employment"
                      entryId={entry.id}
                      documentType="documents"
                      allowedTypes={[".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]}
                    />
                  </div>
                </Card>
              ))}
              
              <Button type="button" onClick={addEmploymentEntry} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Employment Entry
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Identity/Government Documents */}
          <AccordionItem value="identity">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <span>Identity / Government Documents</span>
                <Badge variant="secondary">
                  {Object.values(identityDocuments).reduce((acc, curr) => acc + curr.documents.length, 0)} documents
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6">
              <div className="grid gap-6">
                {/* Aadhaar */}
                <Card className="p-4">
                  <div className="space-y-3">
                    <Label htmlFor="aadhaar-number">Aadhaar Number</Label>
                    <Input
                      id="aadhaar-number"
                      value={identityDocuments.aadhaar.number}
                      onChange={(e) => onIdentityChange({
                        ...identityDocuments,
                        aadhaar: { ...identityDocuments.aadhaar, number: e.target.value }
                      })}
                      placeholder="XXXX XXXX XXXX"
                      maxLength={12}
                    />
                    <DocumentUploadRow
                      documents={identityDocuments.aadhaar.documents}
                      onUpload={() => setUploading("identity-aadhaar")}
                      section="identity"
                      documentType="aadhaar"
                      allowedTypes={[".pdf", ".jpg", ".jpeg", ".png"]}
                    />
                  </div>
                </Card>

                {/* PAN */}
                <Card className="p-4">
                  <div className="space-y-3">
                    <Label htmlFor="pan-number">PAN Number</Label>
                    <Input
                      id="pan-number"
                      value={identityDocuments.pan.number}
                      onChange={(e) => onIdentityChange({
                        ...identityDocuments,
                        pan: { ...identityDocuments.pan, number: e.target.value.toUpperCase() }
                      })}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                    <DocumentUploadRow
                      documents={identityDocuments.pan.documents}
                      onUpload={() => setUploading("identity-pan")}
                      section="identity"
                      documentType="pan"
                      allowedTypes={[".pdf", ".jpg", ".jpeg", ".png"]}
                    />
                  </div>
                </Card>

                {/* Passport */}
                <Card className="p-4">
                  <div className="space-y-3">
                    <Label htmlFor="passport-number">Passport Number (Optional)</Label>
                    <Input
                      id="passport-number"
                      value={identityDocuments.passport.number}
                      onChange={(e) => onIdentityChange({
                        ...identityDocuments,
                        passport: { ...identityDocuments.passport, number: e.target.value.toUpperCase() }
                      })}
                      placeholder="A1234567"
                    />
                    <DocumentUploadRow
                      documents={identityDocuments.passport.documents}
                      onUpload={() => setUploading("identity-passport")}
                      section="identity"
                      documentType="passport"
                      allowedTypes={[".pdf", ".jpg", ".jpeg", ".png"]}
                    />
                  </div>
                </Card>

                {/* UAN */}
                <Card className="p-4">
                  <div className="space-y-3">
                    <Label htmlFor="uan-number">UAN Number (If Applicable)</Label>
                    <Input
                      id="uan-number"
                      value={identityDocuments.uan.number}
                      onChange={(e) => onIdentityChange({
                        ...identityDocuments,
                        uan: { ...identityDocuments.uan, number: e.target.value }
                      })}
                      placeholder="123456789012"
                      maxLength={12}
                    />
                    <DocumentUploadRow
                      documents={identityDocuments.uan.documents}
                      onUpload={() => setUploading("identity-uan")}
                      section="identity"
                      documentType="uan"
                      allowedTypes={[".pdf", ".jpg", ".jpeg", ".png"]}
                    />
                  </div>
                </Card>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Additional Documents */}
          <AccordionItem value="additional">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5" />
                <span>Additional / Optional Documents</span>
                <Badge variant="secondary">
                  {additionalDocuments.resume.length + 
                   additionalDocuments.linkedinVerification.documents.length +
                   additionalDocuments.videoScreening.documents.length +
                   additionalDocuments.other.length} documents
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6">
              {/* Resume */}
              <Card className="p-4">
                <div className="space-y-3">
                  <Label>Resume / CV</Label>
                  <DocumentUploadRow
                    documents={additionalDocuments.resume}
                    onUpload={() => setUploading("additional-resume")}
                    section="additional"
                    documentType="resume"
                    allowedTypes={[".pdf", ".doc", ".docx"]}
                  />
                </div>
              </Card>

              {/* LinkedIn Verification */}
              <Card className="p-4">
                <div className="space-y-3">
                  <Label htmlFor="linkedin-url">LinkedIn Profile</Label>
                  <Input
                    id="linkedin-url"
                    value={additionalDocuments.linkedinVerification.url}
                    onChange={(e) => onAdditionalChange({
                      ...additionalDocuments,
                      linkedinVerification: {
                        ...additionalDocuments.linkedinVerification,
                        url: e.target.value
                      }
                    })}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  <Label className="text-sm">LinkedIn Verification Screenshot (Optional)</Label>
                  <DocumentUploadRow
                    documents={additionalDocuments.linkedinVerification.documents}
                    onUpload={() => setUploading("additional-linkedin")}
                    section="additional"
                    documentType="linkedinVerification"
                    allowedTypes={[".pdf", ".jpg", ".jpeg", ".png"]}
                  />
                </div>
              </Card>

              {/* Video Screening */}
              <Card className="p-4">
                <div className="space-y-3">
                  <Label htmlFor="video-screening-url">Manager Screening Video URL</Label>
                  <Input
                    id="video-screening-url"
                    value={additionalDocuments.videoScreening.url}
                    onChange={(e) => onAdditionalChange({
                      ...additionalDocuments,
                      videoScreening: {
                        ...additionalDocuments.videoScreening,
                        url: e.target.value
                      }
                    })}
                    placeholder="Video URL or upload file below"
                  />
                  <Label className="text-sm">Upload Video File (Optional)</Label>
                  <DocumentUploadRow
                    documents={additionalDocuments.videoScreening.documents}
                    onUpload={() => setUploading("additional-video")}
                    section="additional"
                    documentType="videoScreening"
                    allowedTypes={[".mp4", ".mov", ".avi", ".pdf"]}
                  />
                </div>
              </Card>

              {/* Other Documents */}
              <Card className="p-4">
                <div className="space-y-3">
                  <Label>Other Supporting Documents</Label>
                  <p className="text-sm text-muted-foreground">
                    Any additional documents that support your application
                  </p>
                  <DocumentUploadRow
                    documents={additionalDocuments.other}
                    onUpload={() => setUploading("additional-other")}
                    section="additional"
                    documentType="other"
                    allowedTypes={[".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]}
                  />
                </div>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>

    {/* Modern File Upload Modal */}
    <ModernFileUpload
      isOpen={uploadModalOpen}
      onClose={() => {
        setUploadModalOpen(false);
        setCurrentUploadContext(null);
      }}
      onUpload={handleModernUpload}
      acceptedTypes={[".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]}
      maxFiles={5}
      title={`Upload ${currentUploadContext?.documentType || 'Documents'}`}
    />
  </>
  );
}