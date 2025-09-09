import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import type { Candidate, InsertCandidate, CandidateSkill } from "@shared/schema";
import { CandidateForm } from "@/components/candidate/candidate-form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: candidate, isLoading, error } = useQuery<Candidate>({
    queryKey: ['/api/candidates', candidateId],
    enabled: !!candidateId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ candidateData, skills }: { candidateData: InsertCandidate; skills: CandidateSkill[] }) => {
      const response = await fetch(`/api/candidates/${candidateId}`, {
        method: "PUT",
        body: JSON.stringify(candidateData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedCandidate = await response.json();
      
      // Update skills
      if (skills.length > 0) {
        // First, remove all existing skills for this candidate
        const existingSkillsResponse = await fetch(`/api/candidates/${candidateId}/skills`);
        if (existingSkillsResponse.ok) {
          const existingSkills = await existingSkillsResponse.json();
          for (const existingSkill of existingSkills) {
            await fetch(`/api/candidates/${candidateId}/skills/${existingSkill.skillId}`, {
              method: "DELETE",
            });
          }
        }
        
        // Then save new skills
        for (const skill of skills) {
          await fetch(`/api/candidates/${candidateId}/skills`, {
            method: "POST",
            body: JSON.stringify({
              skillId: skill.id,
              proficiency: skill.proficiency,
              yearsOfExperience: skill.yearsOfExperience || 0,
              certified: skill.certified || false,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
      }
      
      return updatedCandidate;
    },
    onSuccess: () => {
      // Invalidate all queries affected by candidate updates
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates", candidateId, "skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates", candidateId, "applications"] });
      setEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Candidate profile updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleSubmit = (candidateData: InsertCandidate, skills: CandidateSkill[]) => {
    updateMutation.mutate({ candidateData, skills });
  };

  const handleSendEmail = () => {
    if (candidate?.email) {
      const subject = `Regarding Your Application - ${candidate.name}`;
      const body = `Dear ${candidate.name},\n\nI hope this email finds you well.\n\nBest regards,\nTalentFlow ATS Team`;
      const mailtoLink = `mailto:${candidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
    } else {
      toast({
        title: "No Email Available",
        description: "This candidate doesn't have an email address on file.",
        variant: "destructive",
      });
    }
  };

  const handleExportProfile = () => {
    if (!candidate) return;
    
    const exportData = {
      'Name': candidate.name,
      'Email': candidate.email,
      'Phone': candidate.phone,
      'Primary Skill': candidate.primarySkill,
      'Total Experience': `${candidate.totalExperience} years`,
      'Relevant Experience': `${candidate.relevantExperience} years`,
      'Current Location': candidate.currentLocation || 'Not specified',
      'Preferred Location': candidate.preferredLocation || 'Not specified',
      'Current Company': candidate.currentCompany || 'Not specified',
      'Current Designation': candidate.currentDesignation || 'Not specified',
      'Current CTC': formatCurrency(candidate.currentCtc),
      'Expected CTC': formatCurrency(candidate.expectedCtc),
      'Notice Period': candidate.noticePeriod || 'Not specified',
      'Status': candidate.status,
      'Qualification': candidate.qualification || 'Not specified',
      'Candidate Type': candidate.candidateType || 'Not specified',
      'Source': candidate.source || 'Not specified',
      'Recruiter': candidate.recruiterName || 'Not specified',
      'LinkedIn': candidate.linkedinUrl || 'Not specified',
      'UAN Number': candidate.uanNumber || 'Not specified',
      'Aadhaar Number': candidate.aadhaarNumber || 'Not specified',
      'Created Date': candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'Not specified',
    };

    // Convert to CSV
    const headers = Object.keys(exportData);
    const values = Object.values(exportData);
    const csvContent = [
      headers.join(','),
      values.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${candidate.name.replace(/\s+/g, '_')}_Profile_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Profile Exported",
      description: `${candidate.name}'s profile has been exported successfully.`,
    });
  };

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
              <Button variant="outline" size="sm" onClick={handleEdit} data-testid="button-edit-profile">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail} data-testid="button-send-email">
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportProfile} data-testid="button-export-profile">
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Candidate Profile</DialogTitle>
          </DialogHeader>
          <CandidateForm
            initialData={candidate}
            onSubmit={handleSubmit}
            onCancel={() => setEditDialogOpen(false)}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}