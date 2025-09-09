import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Briefcase, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  Star,
  TrendingUp,
  Activity,
  Edit,
  Download,
  Send
} from "lucide-react";
import type { Candidate } from "@shared/schema";

// Tab components
import { CandidateOverviewTab } from "@/components/candidate/profile/overview-tab";
import { CandidateSkillsTab } from "@/components/candidate/profile/skills-tab";
import { CandidateApplicationsTab } from "@/components/candidate/profile/applications-tab";
import { CandidateTimelineTab } from "@/components/candidate/profile/timeline-tab";
import { CandidateDocumentsTab } from "@/components/candidate/profile/documents-tab";

export default function CandidateProfilePage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const candidateId = params.id;

  const { data: candidate, isLoading, error } = useQuery<Candidate>({
    queryKey: ['/api/candidates', candidateId],
    enabled: !!candidateId,
  });

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "Not specified";
    const num = parseFloat(amount);
    return `₹${(num / 100000).toFixed(1)}L`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Available': 'bg-green-100 text-green-800',
      'Interviewing': 'bg-blue-100 text-blue-800', 
      'Offered': 'bg-purple-100 text-purple-800',
      'Placed': 'bg-emerald-100 text-emerald-800',
      'Rejected': 'bg-red-100 text-red-800',
      'On Hold': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Candidate Not Found</h1>
          <p className="text-muted-foreground mt-2">Unable to load candidate profile.</p>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/candidates')}
            className="mt-4"
          >
            Back to Candidates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            {/* Candidate Info */}
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl font-bold">
                  {getInitials(candidate.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{candidate.name}</h1>
                  <Badge className={getStatusColor(candidate.status)}>
                    {candidate.status}
                  </Badge>
                </div>
                
                <p className="text-xl text-muted-foreground flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  {candidate.primarySkill}
                </p>
                
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {candidate.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {candidate.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {candidate.currentLocation || 'Location not specified'}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {candidate.totalExperience || 0} years total experience
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {candidate.relevantExperience || 0} years relevant experience
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm">
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Skills & Expertise
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Applications & Jobs
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Timeline & Activity
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <CandidateOverviewTab candidate={candidate} />
          </TabsContent>

          <TabsContent value="skills">
            <CandidateSkillsTab candidateId={candidate.id} />
          </TabsContent>

          <TabsContent value="applications">
            <CandidateApplicationsTab candidateId={candidate.id} />
          </TabsContent>

          <TabsContent value="timeline">
            <CandidateTimelineTab candidateId={candidate.id} />
          </TabsContent>

          <TabsContent value="documents">
            <CandidateDocumentsTab candidate={candidate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}