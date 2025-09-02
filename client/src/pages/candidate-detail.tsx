import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  FileText,
  Briefcase,
  IndianRupee,
  Clock,
  User,
} from "lucide-react";
import { type Candidate } from "@shared/schema";
import Header from "@/components/layout/header";

export default function CandidateDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const {
    data: candidate,
    isLoading,
    error,
  } = useQuery<Candidate>({
    queryKey: ["/api/candidates", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header 
            title="Loading..."
            description="Loading candidate details"
            showNewJobButton={false}
          />
          <div className="p-6 space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header 
            title="Not Found"
            description="Candidate not found"
            showNewJobButton={false}
          />
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/candidates")}
                data-testid="button-back-to-candidates"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Candidates
              </Button>
            </div>
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Candidate not found</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Interviewing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Offered":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Placed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "Not specified";
    return `₹${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not specified";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full" data-testid="candidate-detail-page">
      <Header 
        title={candidate.name}
        description={candidate.primarySkill}
        showNewJobButton={false}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/candidates")}
                data-testid="button-back-to-candidates"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Candidates
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(candidate.status)} data-testid="badge-candidate-status">
                {candidate.status}
              </Badge>
              <Button
                variant="outline"
                onClick={() => setLocation(`/candidates?edit=${candidate.id}`)}
                data-testid="button-edit-candidate"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3" data-testid="contact-email">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">{candidate.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3" data-testid="contact-phone">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-muted-foreground">{candidate.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3" data-testid="contact-location">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">
                  {candidate.currentLocation || "Not specified"}
                </p>
                {candidate.preferredLocation && (
                  <p className="text-sm text-muted-foreground">
                    Preferred: {candidate.preferredLocation}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div data-testid="experience-total">
              <p className="font-medium">Total Experience</p>
              <p className="text-muted-foreground">
                {candidate.totalExperience ? `${candidate.totalExperience} years` : "Not specified"}
              </p>
            </div>
            <div data-testid="experience-relevant">
              <p className="font-medium">Relevant Experience</p>
              <p className="text-muted-foreground">
                {candidate.relevantExperience ? `${candidate.relevantExperience} years` : "Not specified"}
              </p>
            </div>
            <div className="flex items-center gap-3" data-testid="experience-company">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Current Company</p>
                <p className="text-muted-foreground">{candidate.currentCompany || "Not specified"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div data-testid="compensation-current">
              <p className="font-medium">Current CTC</p>
              <p className="text-muted-foreground">{formatCurrency(candidate.currentCtc)}</p>
            </div>
            <div data-testid="compensation-expected">
              <p className="font-medium">Expected CTC</p>
              <p className="text-muted-foreground">{formatCurrency(candidate.expectedCtc)}</p>
            </div>
            <div className="flex items-center gap-3" data-testid="compensation-notice">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Notice Period</p>
                <p className="text-muted-foreground">{candidate.noticePeriod || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3" data-testid="compensation-doj">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Tentative DOJ</p>
                <p className="text-muted-foreground">{formatDate(candidate.tentativeDoj)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents & Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidate.resumeUrl ? (
              <div data-testid="document-resume">
                <p className="font-medium">Resume</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(candidate.resumeUrl!, '_blank')}
                  className="mt-1"
                  data-testid="button-view-resume"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Resume
                </Button>
              </div>
            ) : (
              <div data-testid="document-no-resume">
                <p className="font-medium">Resume</p>
                <p className="text-muted-foreground">No resume uploaded</p>
              </div>
            )}

            {candidate.notes && (
              <>
                <Separator />
                <div data-testid="candidate-notes">
                  <p className="font-medium">Notes</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{candidate.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
    </div>
  );
}