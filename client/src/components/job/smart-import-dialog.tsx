import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, FileText, Zap, AlertCircle, CheckCircle2, ArrowRight, Wand2 } from "lucide-react";
import { parseJobPosting, type ParsedJobData } from "@/utils/jobParser";
import { useLocation } from "wouter";

interface SmartImportDialogProps {
  trigger?: React.ReactNode;
}

export default function SmartImportDialog({ trigger }: SmartImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [jobText, setJobText] = useState("");
  const [parsedData, setParsedData] = useState<ParsedJobData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleAnalyze = async () => {
    if (!jobText.trim()) {
      toast({
        title: "No Content",
        description: "Please paste your job posting content first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const parsed = parseJobPosting(jobText);
      setParsedData(parsed);
      
      toast({
        title: "✨ Analysis Complete!",
        description: "Successfully extracted job details from your posting.",
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

  const handleCreateJob = () => {
    if (!parsedData) return;
    
    // Store parsed data in sessionStorage for the job form
    sessionStorage.setItem('smartImportData', JSON.stringify(parsedData));
    
    // Close dialog and navigate to job creation form
    setOpen(false);
    setLocation('/jobs/new?import=smart');
    
    toast({
      title: "🚀 Ready to Create!",
      description: "Job form pre-filled with extracted data. Review and save!",
    });
  };

  const handleReset = () => {
    setJobText("");
    setParsedData(null);
  };

  const getConfidenceColor = (value: string | boolean | undefined) => {
    if (!value || (typeof value === 'string' && value.length === 0)) return "bg-red-100 text-red-700";
    if (typeof value === 'boolean') return value ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
    return value.length > 10 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
  };

  const defaultTrigger = (
    <Button 
      variant="outline" 
      className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100 text-purple-700 font-semibold rounded-xl transform transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
      data-testid="button-smart-import"
    >
      <Wand2 className="w-4 h-4 mr-2" />
      ✨ Smart Import
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold text-gray-800">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            Smart Job Import - AI Parser
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left Side - Input */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm font-semibold text-gray-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Paste Your Job Posting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="🚀 We're Hiring at O2F Infosolutions!
We're looking for an experienced Talent Acquisition Specialist...
📍 Location: Hyderabad
🕓 Experience: 4-8 Years
..."
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  rows={12}
                  className="resize-none font-mono text-sm"
                />
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-500">
                    {jobText.length} characters
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={!jobText && !parsedData}
                    >
                      Clear
                    </Button>
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
                          Analyze
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Parsed Results */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm font-semibold text-gray-700">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  Extracted Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!parsedData ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Paste your job posting and click "Analyze" to extract job details automatically</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {/* Key Information */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-600">Job Title:</span>
                        <Badge variant="outline" className={getConfidenceColor(parsedData.title)}>
                          {parsedData.title || "Not detected"}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-600">Location:</span>
                        <Badge variant="outline" className={getConfidenceColor(parsedData.location)}>
                          {parsedData.location || "Not detected"}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-600">Experience:</span>
                        <Badge variant="outline" className={getConfidenceColor(parsedData.experienceLevel)}>
                          {parsedData.experienceLevel || "Not detected"}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-600">Job Type:</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700">
                          {parsedData.jobType.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-600">Remote:</span>
                        <Badge variant="outline" className={getConfidenceColor(parsedData.isRemoteAvailable)}>
                          {parsedData.isRemoteAvailable ? "Available" : "Office only"}
                        </Badge>
                      </div>

                      {parsedData.companyName && (
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-medium text-gray-600">Company:</span>
                          <Badge variant="outline" className="bg-green-100 text-green-700">
                            {parsedData.companyName}
                          </Badge>
                        </div>
                      )}

                      {parsedData.contactEmails.length > 0 && (
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-medium text-gray-600">Emails:</span>
                          <div className="flex flex-wrap gap-1">
                            {parsedData.contactEmails.slice(0, 2).map((email, idx) => (
                              <Badge key={idx} variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                                {email}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedData.skills && (
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-medium text-gray-600">Skills:</span>
                          <Badge variant="outline" className={getConfidenceColor(parsedData.skills)}>
                            {parsedData.skills.split(',').length} detected
                          </Badge>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Content Sections */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Description:</span>
                        <span className={`px-2 py-1 rounded ${getConfidenceColor(parsedData.description)}`}>
                          {parsedData.description ? `${parsedData.description.length} chars` : "Missing"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Requirements:</span>
                        <span className={`px-2 py-1 rounded ${getConfidenceColor(parsedData.requirements)}`}>
                          {parsedData.requirements ? `${parsedData.requirements.length} chars` : "Missing"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Responsibilities:</span>
                        <span className={`px-2 py-1 rounded ${getConfidenceColor(parsedData.responsibilities)}`}>
                          {parsedData.responsibilities ? `${parsedData.responsibilities.length} chars` : "Missing"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            🆓 Completely free - no API costs
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateJob}
              disabled={!parsedData}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Create Job with Data
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}