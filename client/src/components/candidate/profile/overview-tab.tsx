import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Briefcase, 
  MapPin, 
  DollarSign,
  Calendar,
  Building,
  Mail,
  Phone,
  Clock,
  TrendingUp,
  Target,
  CheckCircle
} from "lucide-react";
import type { Candidate } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface CandidateOverviewTabProps {
  candidate: Candidate;
}

export function CandidateOverviewTab({ candidate }: CandidateOverviewTabProps) {
  // Fetch related data for overview metrics
  const { data: applications = [] } = useQuery({
    queryKey: ['/api/candidates', candidate.id, 'applications'],
    enabled: !!candidate.id,
  });

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "Not specified";
    const num = parseFloat(amount);
    return `₹${(num / 100000).toFixed(1)}L`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not specified";
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  // Calculate metrics
  const totalApplications = applications.length;
  const activeApplications = applications.filter((app: any) => 
    !['Rejected', 'Not Joined', 'Joined'].includes(app.stage)
  ).length;

  const successRate = totalApplications > 0 
    ? Math.round((applications.filter((app: any) => app.stage === 'Joined').length / totalApplications) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Personal Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="font-semibold">{candidate.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {candidate.email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {candidate.phone}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Company</label>
                <p className="font-semibold flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {candidate.currentCompany || "Not specified"}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Location</label>
                <p className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {candidate.currentLocation || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Preferred Location</label>
                <p className="font-semibold">
                  {candidate.preferredLocation || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notice Period</label>
                <p className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {candidate.noticePeriod || "Not specified"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tentative DOJ</label>
                <p className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(candidate.tentativeDoj)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Professional Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Primary Skill</label>
                <p className="font-semibold text-lg">{candidate.primarySkill}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Company</label>
                <p className="font-semibold">{candidate.currentCompany || "Not specified"}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Experience</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {candidate.totalExperience || 0} years
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Relevant Experience</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {candidate.relevantExperience || 0} years
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compensation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Compensation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Current CTC</label>
              <p className="font-semibold text-lg text-blue-600">
                {formatCurrency(candidate.currentCtc)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Expected CTC</label>
              <p className="font-semibold text-lg text-green-600">
                {formatCurrency(candidate.expectedCtc)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Metrics & Summary */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Applications</span>
              <Badge variant="secondary">{totalApplications}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Applications</span>
              <Badge variant="default">{activeApplications}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <Badge variant="outline">{successRate}%</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Profile Completion</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Resume uploaded</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Contact verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Skills added</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {candidate.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{candidate.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Timeline Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">Joined platform:</span>
              <span className="font-medium">
                {formatDate(candidate.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Last updated:</span>
              <span className="font-medium">
                {formatDate(candidate.updatedAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}